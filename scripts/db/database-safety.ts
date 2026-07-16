import { Database } from 'bun:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { constants, createReadStream } from 'node:fs';
import { copyFile, link, mkdir, mkdtemp, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export type DatabaseInventory = {
	byteSize: number;
	fileName: string;
	freelistCount: number;
	generatedAt: string;
	journalMode: string;
	pageCount: number;
	quickCheck: string;
	schemaHash: string;
	tableCounts: Record<string, number>;
	userVersion: number;
};

export type BackupManifest = {
	appVersion: string;
	backupFile: string;
	byteSize: number;
	createdAt: string;
	formatVersion: 2;
	inventory: DatabaseInventory;
	rootReferences: string[];
	restoreVerified: true;
	schemaVersion: number;
	sha256: string;
};

type LegacyBackupManifest = Omit<
	BackupManifest,
	'appVersion' | 'formatVersion' | 'rootReferences' | 'schemaVersion'
> & {
	formatVersion: 1;
};

type CreateBackupOptions = {
	appVersion?: string;
	databasePath: string;
	now?: Date;
	outputDirectory: string;
	rootReferences?: string[];
	workspaceRoot: string;
};

type VerifyBackupOptions = {
	backupPath: string;
	manifestPath?: string;
};

type RestoreBackupOptions = VerifyBackupOptions & {
	outputPath: string;
};

type SchemaEntry = {
	name: string;
	sql: string | null;
	type: string;
};

const WINDOWS_FILE_RELEASE_ATTEMPTS = 40;
const WINDOWS_FILE_RELEASE_DELAY_MS = 100;

function isRetryableFileReleaseError(error: unknown): boolean {
	const code = (error as NodeJS.ErrnoException).code;
	return code === 'EBUSY' || code === 'EPERM';
}

async function retryFileRelease<T>(operation: () => Promise<T>): Promise<T> {
	for (let attempt = 1; ; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			if (!isRetryableFileReleaseError(error) || attempt >= WINDOWS_FILE_RELEASE_ATTEMPTS) throw error;
			await delay(WINDOWS_FILE_RELEASE_DELAY_MS);
		}
	}
}

async function removeFileAfterRelease(filePath: string): Promise<void> {
	await retryFileRelease(() => rm(filePath, { force: true }));
}

function readFirstValue(row: unknown): unknown {
	if (!row || typeof row !== 'object') {
		return undefined;
	}
	return Object.values(row as Record<string, unknown>)[0];
}

function toSafeNumber(value: unknown, label: string): number {
	const converted = Number(value);
	if (!Number.isSafeInteger(converted) || converted < 0) {
		throw new Error(`${label} devolvió un entero inválido.`);
	}
	return converted;
}

function quoteIdentifier(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}

function isPathInside(rootPath: string, candidatePath: string): boolean {
	const pathFromRoot = relative(resolve(rootPath), resolve(candidatePath));
	return pathFromRoot === '' || !(pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot));
}

function assertInventoryMatches(expected: DatabaseInventory, actual: DatabaseInventory): void {
	if (actual.quickCheck !== 'ok') {
		throw new Error(`La copia restaurada no supera PRAGMA quick_check: ${actual.quickCheck}`);
	}
	if (actual.schemaHash !== expected.schemaHash) {
		throw new Error('La copia restaurada no coincide con el schema del backup.');
	}
	if (JSON.stringify(actual.tableCounts) !== JSON.stringify(expected.tableCounts)) {
		throw new Error('La copia restaurada no coincide con los conteos del backup.');
	}
}

function assertBackupManifest(value: unknown): asserts value is BackupManifest | LegacyBackupManifest {
	if (!value || typeof value !== 'object') {
		throw new Error('El manifest no es un objeto JSON válido.');
	}
	const manifest = value as Partial<BackupManifest>;
	if (
		(manifest.formatVersion !== 1 && manifest.formatVersion !== 2) ||
		manifest.restoreVerified !== true ||
		typeof manifest.backupFile !== 'string' ||
		typeof manifest.sha256 !== 'string' ||
		typeof manifest.byteSize !== 'number' ||
		!manifest.inventory
	) {
		throw new Error('El manifest no cumple el contrato de backup v1.');
	}
	if (
		manifest.formatVersion === 2 &&
		(typeof manifest.appVersion !== 'string' ||
			typeof manifest.schemaVersion !== 'number' ||
			!Array.isArray(manifest.rootReferences) ||
			!manifest.rootReferences.every((rootId) => typeof rootId === 'string'))
	) {
		throw new Error('El manifest no cumple el contrato de backup v2.');
	}
}

export function resolveDatabasePath(databaseUrlOrPath: string, cwd = process.cwd()): string {
	const value = databaseUrlOrPath.trim();
	if (!value) {
		throw new Error('La ruta de base de datos está vacía.');
	}
	if (/^(?:https?|libsql|ws|wss):/i.test(value)) {
		throw new Error('Esta herramienta sólo admite bases SQLite locales.');
	}
	if (value.includes('?') || value.includes('#')) {
		throw new Error('DATABASE_URL no puede incluir query ni fragment para operaciones de backup.');
	}
	if (value.startsWith('file://')) {
		return resolve(fileURLToPath(value));
	}
	const localPath = value.startsWith('file:') ? decodeURIComponent(value.slice('file:'.length)) : value;
	return resolve(cwd, localPath);
}

export async function calculateSha256(filePath: string): Promise<string> {
	const hash = createHash('sha256');
	for await (const chunk of createReadStream(filePath)) {
		hash.update(chunk);
	}
	return hash.digest('hex');
}

export async function inventoryDatabase(databasePath: string, now = new Date()): Promise<DatabaseInventory> {
	const resolvedPath = resolve(databasePath);
	const fileStats = await stat(resolvedPath);
	if (!fileStats.isFile()) {
		throw new Error(`La base SQLite no es un archivo: ${resolvedPath}`);
	}

	const database = new Database(resolvedPath, { readonly: true });
	try {
		const schemaEntries = database
			.query("SELECT name, type, sql FROM sqlite_schema WHERE type IN ('table', 'view') ORDER BY type, name")
			.all() as SchemaEntry[];
		const tableCounts: Record<string, number> = {};
		for (const entry of schemaEntries) {
			if (entry.type === 'table' && !entry.name.startsWith('sqlite_')) {
				const row = database.query(`SELECT count(*) AS count FROM ${quoteIdentifier(entry.name)}`).get();
				tableCounts[entry.name] = toSafeNumber(readFirstValue(row), `Conteo de ${entry.name}`);
			}
		}

		const canonicalSchema = schemaEntries.map(({ name, sql, type }) => ({ name, sql, type }));
		const schemaHash = createHash('sha256').update(JSON.stringify(canonicalSchema)).digest('hex');
		const quickCheck = String(readFirstValue(database.query('PRAGMA quick_check').get()) ?? 'unknown');

		return {
			byteSize: fileStats.size,
			fileName: basename(resolvedPath),
			freelistCount: toSafeNumber(readFirstValue(database.query('PRAGMA freelist_count').get()), 'freelist_count'),
			generatedAt: now.toISOString(),
			journalMode: String(readFirstValue(database.query('PRAGMA journal_mode').get()) ?? 'unknown'),
			pageCount: toSafeNumber(readFirstValue(database.query('PRAGMA page_count').get()), 'page_count'),
			quickCheck,
			schemaHash,
			tableCounts,
			userVersion: toSafeNumber(readFirstValue(database.query('PRAGMA user_version').get()), 'user_version'),
		};
	} finally {
		database.clearQueryCache();
		database.close();
	}
}

async function inventoryDatabaseInChild(databasePath: string, now?: Date): Promise<DatabaseInventory> {
	const inventoryFixture = resolve(import.meta.dir, 'fixtures', 'inventory-database-child.ts');
	const child = Bun.spawn([process.execPath, inventoryFixture, databasePath, ...(now ? [now.toISOString()] : [])], {
		cwd: process.cwd(),
		env: process.env,
		stderr: 'pipe',
		stdout: 'pipe',
	});
	const [exitCode, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	if (exitCode !== 0) {
		throw new Error(`El inventario SQLite aislado falló: ${stderr.trim() || `exit ${exitCode}`}`);
	}
	return JSON.parse(stdout) as DatabaseInventory;
}

async function vacuumDatabaseIntoInChild(sourcePath: string, outputPath: string): Promise<void> {
	const vacuumFixture = resolve(import.meta.dir, 'fixtures', 'vacuum-database-child.ts');
	const child = Bun.spawn([process.execPath, vacuumFixture, sourcePath, outputPath], {
		cwd: process.cwd(),
		env: process.env,
		stderr: 'pipe',
		stdout: 'ignore',
	});
	const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
	if (exitCode !== 0) {
		throw new Error(`El snapshot SQLite aislado falló: ${stderr.trim() || `exit ${exitCode}`}`);
	}
}

async function verifyRestorableCopy(backupPath: string, expectedInventory: DatabaseInventory): Promise<void> {
	const restoreDirectory = await mkdtemp(join(tmpdir(), 'media-manager-backup-restore-'));
	const restoredPath = join(restoreDirectory, 'restored.sqlite');
	try {
		await copyFile(backupPath, restoredPath);
		const restoredInventory = await inventoryDatabaseInChild(restoredPath);
		assertInventoryMatches(expectedInventory, restoredInventory);
	} finally {
		await rm(restoreDirectory, {
			force: true,
			maxRetries: 40,
			recursive: true,
			retryDelay: 250,
		});
	}
}

export async function createVerifiedBackup({
	appVersion = 'unknown',
	databasePath,
	now = new Date(),
	outputDirectory,
	rootReferences = [],
	workspaceRoot,
}: CreateBackupOptions): Promise<{ backupPath: string; manifest: BackupManifest; manifestPath: string }> {
	const resolvedDatabasePath = resolve(databasePath);
	const sourceStats = await stat(resolvedDatabasePath);
	if (!sourceStats.isFile()) {
		throw new Error(`La base SQLite no es un archivo: ${resolvedDatabasePath}`);
	}
	const resolvedOutputDirectory = resolve(outputDirectory);
	if (isPathInside(workspaceRoot, resolvedOutputDirectory)) {
		throw new Error('El directorio de backup debe estar fuera del workspace/Git.');
	}
	await mkdir(resolvedOutputDirectory, { recursive: true });
	const [canonicalOutputDirectory, canonicalWorkspaceRoot] = await Promise.all([
		realpath(resolvedOutputDirectory),
		realpath(workspaceRoot),
	]);
	if (isPathInside(canonicalWorkspaceRoot, canonicalOutputDirectory)) {
		throw new Error('El directorio de backup debe estar fuera del workspace/Git.');
	}

	const timestamp = now.toISOString().replaceAll(':', '-').replaceAll('.', '-');
	const backupId = randomUUID().slice(0, 8);
	const backupPath = join(canonicalOutputDirectory, `media-manager-backup-${timestamp}-${backupId}.sqlite`);
	const manifestPath = `${backupPath}.manifest.json`;
	const stagingBackupPath = `${backupPath}.partial`;
	const stagingManifestPath = `${manifestPath}.partial`;
	for (const artifactPath of [backupPath, manifestPath, stagingBackupPath, stagingManifestPath]) {
		try {
			await stat(artifactPath);
			throw new Error(`El artefacto ya existe y no será sobrescrito: ${artifactPath}`);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
				throw error;
			}
		}
	}

	try {
		await vacuumDatabaseIntoInChild(resolvedDatabasePath, stagingBackupPath);
		const inventory = await inventoryDatabaseInChild(stagingBackupPath, now);
		if (inventory.quickCheck !== 'ok') {
			throw new Error(`El backup no supera PRAGMA quick_check: ${inventory.quickCheck}`);
		}
		const sha256 = await calculateSha256(stagingBackupPath);
		await verifyRestorableCopy(stagingBackupPath, inventory);
		const manifest: BackupManifest = {
			appVersion,
			backupFile: basename(backupPath),
			byteSize: inventory.byteSize,
			createdAt: now.toISOString(),
			formatVersion: 2,
			inventory: { ...inventory, fileName: basename(backupPath) },
			rootReferences: [...new Set(rootReferences)].sort(),
			restoreVerified: true,
			schemaVersion: inventory.userVersion,
			sha256,
		};
		await writeFile(stagingManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
			encoding: 'utf8',
			flag: 'wx',
		});
		await retryFileRelease(() => rename(stagingBackupPath, backupPath));
		await retryFileRelease(() => rename(stagingManifestPath, manifestPath));
		return { backupPath, manifest, manifestPath };
	} catch (error) {
		for (const artifactPath of [stagingBackupPath, stagingManifestPath, backupPath, manifestPath]) {
			await removeFileAfterRelease(artifactPath);
		}
		throw error;
	}
}

export async function verifyExistingBackup({
	backupPath,
	manifestPath = `${backupPath}.manifest.json`,
}: VerifyBackupOptions): Promise<BackupManifest | LegacyBackupManifest> {
	const parsedManifest = JSON.parse(await readFile(manifestPath, 'utf8')) as unknown;
	assertBackupManifest(parsedManifest);
	if (basename(backupPath) !== parsedManifest.backupFile) {
		throw new Error('El archivo de backup no coincide con el manifest.');
	}
	const backupStats = await stat(backupPath);
	if (backupStats.size !== parsedManifest.byteSize) {
		throw new Error('El tamaño del backup no coincide con el manifest.');
	}
	const sha256 = await calculateSha256(backupPath);
	if (sha256 !== parsedManifest.sha256) {
		throw new Error('El SHA-256 del backup no coincide con el manifest.');
	}
	const inventory = await inventoryDatabaseInChild(backupPath);
	assertInventoryMatches(parsedManifest.inventory, inventory);
	await verifyRestorableCopy(backupPath, parsedManifest.inventory);
	return parsedManifest;
}

export async function restoreVerifiedBackup({
	backupPath,
	manifestPath = `${backupPath}.manifest.json`,
	outputPath,
}: RestoreBackupOptions): Promise<{
	manifest: BackupManifest | LegacyBackupManifest;
	outputPath: string;
}> {
	const resolvedBackupPath = resolve(backupPath);
	const resolvedOutputPath = resolve(outputPath);
	if (resolvedBackupPath === resolvedOutputPath) {
		throw new Error('El destino de restore no puede ser el mismo archivo de backup.');
	}
	if (await stat(resolvedOutputPath).catch(() => null)) {
		throw new Error(`El destino de restore ya existe y no será sobrescrito: ${resolvedOutputPath}`);
	}
	const manifest = await verifyExistingBackup({ backupPath: resolvedBackupPath, manifestPath: resolve(manifestPath) });
	await mkdir(dirname(resolvedOutputPath), { recursive: true });
	const stagingPath = `${resolvedOutputPath}.partial-${randomUUID().slice(0, 8)}`;
	try {
		await copyFile(resolvedBackupPath, stagingPath, constants.COPYFILE_EXCL);
		const restoredInventory = await inventoryDatabaseInChild(stagingPath);
		assertInventoryMatches(manifest.inventory, restoredInventory);
		await link(stagingPath, resolvedOutputPath);
		await removeFileAfterRelease(stagingPath);
		return { manifest, outputPath: resolvedOutputPath };
	} catch (error) {
		await removeFileAfterRelease(stagingPath);
		throw error;
	}
}
