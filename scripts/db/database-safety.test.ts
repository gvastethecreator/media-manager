import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { existsSync } from 'node:fs';
import { appendFile, mkdir, mkdtemp, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	createVerifiedBackup,
	inventoryDatabase,
	resolveDatabasePath,
	restoreVerifiedBackup,
	verifyExistingBackup,
} from './database-safety';

const temporaryDirectories: string[] = [];

async function createFixture(): Promise<{ databasePath: string; root: string; workspaceRoot: string }> {
	const root = await mkdtemp(join(tmpdir(), 'media-manager-backup-test-'));
	temporaryDirectories.push(root);
	const workspaceRoot = join(root, 'workspace');
	await mkdir(workspaceRoot);
	const databasePath = join(workspaceRoot, 'fixture.sqlite');
	const database = new Database(databasePath);
	database.exec(
		'PRAGMA journal_mode=WAL; PRAGMA user_version=7; CREATE TABLE assets(id INTEGER PRIMARY KEY, label TEXT);'
	);
	database.run('INSERT INTO assets(label) VALUES (?)', 'private-label');
	database.close();
	return { databasePath, root, workspaceRoot };
}

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, recursive: true });
	}
});

describe('database safety inventory', () => {
	it('resuelve rutas relativas y file URLs locales', async () => {
		const { databasePath, workspaceRoot } = await createFixture();
		expect(resolveDatabasePath('file:./fixture.sqlite', workspaceRoot)).toBe(resolve(databasePath));
		expect(resolveDatabasePath(pathToFileURL(databasePath).href, workspaceRoot)).toBe(resolve(databasePath));
		expect(() => resolveDatabasePath('libsql://example.invalid/database')).toThrow('sólo admite bases SQLite locales');
	});

	it('informa identidad técnica y conteos sin copiar contenido de filas', async () => {
		const { databasePath } = await createFixture();
		const inventory = await inventoryDatabase(databasePath, new Date('2026-07-14T12:00:00.000Z'));

		expect(inventory.quickCheck).toBe('ok');
		expect(inventory.userVersion).toBe(7);
		expect(inventory.tableCounts).toEqual({ assets: 1 });
		expect(inventory.schemaHash).toHaveLength(64);
		expect(JSON.stringify(inventory)).not.toContain('private-label');
	});
});

describe('database safety CLI', () => {
	it('ofrece ayuda aun con argumentos extra y usa exit 2 para uso inválido', async () => {
		const cliPath = join(import.meta.dir, 'safe-backup.ts');
		const help = Bun.spawn([process.execPath, cliPath, '--help', '--unknown'], {
			stderr: 'pipe',
			stdout: 'pipe',
		});
		expect(await help.exited).toBe(0);
		expect(await new Response(help.stdout).text()).toContain('inventario y backup verificable');

		const invalid = Bun.spawn([process.execPath, cliPath, 'inventory'], {
			env: { ...process.env, DATABASE_URL: '' },
			stderr: 'pipe',
			stdout: 'pipe',
		});
		expect(await invalid.exited).toBe(2);
		expect(await new Response(invalid.stderr).text()).toContain('Falta --database');
	});
});

describe('verified database backup', () => {
	it('crea un snapshot consistente, manifest y prueba de restore fuera del workspace', async () => {
		const { databasePath, root, workspaceRoot } = await createFixture();
		const outputDirectory = join(root, 'backups');
		const result = await createVerifiedBackup({
			appVersion: '0.1.0-test',
			databasePath,
			now: new Date('2026-07-14T12:00:00.000Z'),
			outputDirectory,
			rootReferences: ['secondary', 'primary', 'primary'],
			workspaceRoot,
		});

		expect(result.manifest.formatVersion).toBe(2);
		expect(result.manifest.appVersion).toBe('0.1.0-test');
		expect(result.manifest.schemaVersion).toBe(7);
		expect(result.manifest.rootReferences).toEqual(['primary', 'secondary']);
		expect(result.manifest.inventory.tableCounts).toEqual({ assets: 1 });
		expect(result.manifest.restoreVerified).toBe(true);
		expect(result.manifest.sha256).toHaveLength(64);
		const manifestText = await readFile(result.manifestPath, 'utf8');
		expect(manifestText).not.toContain(databasePath);
		expect(manifestText).not.toContain('private-label');
		expect((await readdir(outputDirectory)).some((fileName) => fileName.endsWith('.partial'))).toBe(false);
		await expect(verifyExistingBackup({ backupPath: result.backupPath })).resolves.toEqual(result.manifest);

		const source = new Database(databasePath);
		source.run('INSERT INTO assets(label) VALUES (?)', 'later-change');
		source.close();
		expect((await inventoryDatabase(result.backupPath)).tableCounts.assets).toBe(1);
	});

	it('restaura a un path nuevo, verifica la copia y nunca sobrescribe', async () => {
		const { databasePath, root, workspaceRoot } = await createFixture();
		const result = await createVerifiedBackup({
			databasePath,
			outputDirectory: join(root, 'backups'),
			workspaceRoot,
		});
		const outputPath = join(root, 'restored', 'media-manager.sqlite');

		await expect(restoreVerifiedBackup({ backupPath: result.backupPath, outputPath })).resolves.toMatchObject({
			outputPath,
		});
		expect((await inventoryDatabase(outputPath)).tableCounts).toEqual({ assets: 1 });
		await expect(restoreVerifiedBackup({ backupPath: result.backupPath, outputPath })).rejects.toThrow(
			'ya existe y no será sobrescrito'
		);
	});

	it('rechaza backups dentro del workspace', async () => {
		const { databasePath, workspaceRoot } = await createFixture();
		const outputDirectory = join(workspaceRoot, 'backups');
		await expect(
			createVerifiedBackup({
				databasePath,
				outputDirectory,
				workspaceRoot,
			})
		).rejects.toThrow('fuera del workspace/Git');
		expect(existsSync(outputDirectory)).toBe(false);
	});

	it('rechaza un destino externo que resuelve mediante junction dentro del workspace', async () => {
		const { databasePath, root, workspaceRoot } = await createFixture();
		const linkedOutput = join(root, 'linked-output');
		await symlink(workspaceRoot, linkedOutput, 'junction');

		await expect(createVerifiedBackup({ databasePath, outputDirectory: linkedOutput, workspaceRoot })).rejects.toThrow(
			'fuera del workspace/Git'
		);
	});

	it('detecta alteraciones posteriores mediante SHA-256', async () => {
		const { databasePath, root, workspaceRoot } = await createFixture();
		const result = await createVerifiedBackup({
			databasePath,
			outputDirectory: join(root, 'backups'),
			workspaceRoot,
		});
		await appendFile(result.backupPath, 'tampered');

		await expect(verifyExistingBackup({ backupPath: result.backupPath })).rejects.toThrow(
			'no coincide con el manifest'
		);
	});
});
