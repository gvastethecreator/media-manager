import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
	backfillMediaSpecializationAssets,
	MEDIA_SPECIALIZATIONS,
	type MediaRootMapping,
	type MediaSpecializationType,
	reconcileMediaSpecializationAssets,
} from './media-specialization-asset-reconciliation';
import { migrateDatabase } from './migrations';

const temporaryDirectories: string[] = [];
const tables: Record<MediaSpecializationType, string> = {
	audio: 'Audio',
	document: 'Document',
	file3d: 'File3D',
	json: 'JsonFile',
	video: 'Video',
};
const extensions: Record<MediaSpecializationType, string> = {
	audio: 'mp3',
	document: 'pdf',
	file3d: 'glb',
	json: 'json',
	video: 'mp4',
};

async function createDatabase(): Promise<{ database: Database; databasePath: string; directory: string }> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-media-reconcile-'));
	temporaryDirectories.push(directory);
	const databasePath = join(directory, 'copy.sqlite');
	await migrateDatabase({ databasePath });
	const database = new Database(databasePath, { strict: true });
	database.exec('PRAGMA foreign_keys = ON');
	return { database, databasePath, directory };
}

async function insertLegacy(
	database: Database,
	type: MediaSpecializationType,
	id: string,
	path: string,
	hash = createHash('sha256').update(`${type}:${id}`).digest('hex')
): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, `${type}:${id}`, 'utf8');
	const folderId = `folder-${type}`;
	database.query('INSERT OR IGNORE INTO Folder(id, name, path) VALUES (?, ?, ?)').run(folderId, type, dirname(path));
	if (type === 'video') {
		database
			.query(`
				INSERT INTO Video(id, name, path, hash, size, duration, folderId)
				VALUES (?, ?, ?, ?, ?, 0, ?)
			`)
			.run(id, `${id}.${extensions[type]}`, path, hash, Buffer.byteLength(`${type}:${id}`), folderId);
		return;
	}
	database
		.query(`
			INSERT INTO ${tables[type]}(id, name, path, hash, size, mimeType, extension, folderId)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`)
		.run(
			id,
			`${id}.${extensions[type]}`,
			path,
			hash,
			Buffer.byteLength(`${type}:${id}`),
			`test/${type}`,
			extensions[type],
			folderId
		);
}

async function sha256(path: string): Promise<string> {
	return createHash('sha256')
		.update(await readFile(path))
		.digest('hex');
}

async function runScriptCli(
	script: string,
	args: string[]
): Promise<{ exitCode: number; stderr: string; stdout: string }> {
	const child = Bun.spawn([process.execPath, join(import.meta.dir, script), ...args], {
		cwd: join(import.meta.dir, '../..'),
		stderr: 'pipe',
		stdout: 'pipe',
	});
	const [exitCode, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	return { exitCode, stderr, stdout };
}

const runCli = (args: string[]) => runScriptCli('media-specialization-asset-backfill.ts', args);

afterEach(async () => {
	Bun.gc(true);
	await Bun.sleep(50);
	for (const directory of temporaryDirectories.splice(0)) {
		for (let attempt = 0; attempt < 100; attempt += 1) {
			try {
				await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
				break;
			} catch (error) {
				if (!(error && typeof error === 'object' && 'code' in error && error.code === 'EBUSY') || attempt === 99) {
					throw error;
				}
				await Bun.sleep(100);
			}
		}
	}
});

describe('media specialization canonical copy-only backfill', () => {
	it('backfills all five families idempotently and reconciles every projection', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			const roots: MediaRootMapping[] = [{ id: 'root-library', label: 'Library', path: rootPath }];
			for (const type of MEDIA_SPECIALIZATIONS) {
				await insertLegacy(database, type, `${type}-one`, join(rootPath, type, `one.${extensions[type]}`));
			}

			const first = await backfillMediaSpecializationAssets(database, roots);
			expect(first.backfilled).toBe(5);
			expect(first.alreadyCanonical).toBe(0);
			expect(first.report).toEqual(
				expect.objectContaining({ canonical: 5, dataConsistent: true, divergent: 0, legacyOnly: 0, total: 5 })
			);
			for (const type of MEDIA_SPECIALIZATIONS) {
				expect(database.query(`SELECT id, assetId FROM ${tables[type]}`).all()).toEqual([
					{ assetId: `${type}-one`, id: `${type}-one` },
				]);
				expect(first.report.families[type].canonical).toBe(1);
			}
			expect(database.query('SELECT count(*) AS count FROM Asset').get()).toEqual({ count: 5 });
			expect(database.query('SELECT count(*) AS count FROM SourceFile').get()).toEqual({ count: 5 });

			const second = await backfillMediaSpecializationAssets(database, roots);
			expect(second.backfilled).toBe(0);
			expect(second.alreadyCanonical).toBe(5);
			expect(second.report.dataConsistent).toBe(true);
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('fails preflight atomically when one path is unmapped', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			await insertLegacy(database, 'video', 'inside', join(rootPath, 'video', 'inside.mp4'));
			await insertLegacy(database, 'audio', 'outside', join(directory, 'outside', 'outside.mp3'));
			await expect(
				backfillMediaSpecializationAssets(database, [{ id: 'root-library', label: 'Library', path: rootPath }])
			).rejects.toThrow('ROOT_PATH_OUTSIDE');
			expect(database.query('SELECT count(*) AS count FROM Asset').get()).toEqual({ count: 0 });
			expect(database.query('SELECT count(*) AS count FROM SourceFile').get()).toEqual({ count: 0 });
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('rejects cross-family identity collisions before writing canonical rows', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			await insertLegacy(database, 'video', 'shared-id', join(rootPath, 'video', 'shared.mp4'));
			await insertLegacy(database, 'audio', 'shared-id', join(rootPath, 'audio', 'shared.mp3'));
			await expect(
				backfillMediaSpecializationAssets(database, [{ id: 'root-library', label: 'Library', path: rootPath }])
			).rejects.toThrow('colisiones de identidad');
			expect(database.query('SELECT count(*) AS count FROM Asset').get()).toEqual({ count: 0 });
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('reserves Image identities against every specialization backfill', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			const imagePath = join(rootPath, 'image', 'shared.jpg');
			await mkdir(dirname(imagePath), { recursive: true });
			await writeFile(imagePath, 'image:shared-id');
			database
				.query('INSERT OR IGNORE INTO Folder(id, name, path) VALUES (?, ?, ?)')
				.run('folder-image', 'image', dirname(imagePath));
			database
				.query(`
					INSERT INTO Image(id, name, path, hash, size, width, height, folderId)
					VALUES (?, ?, ?, ?, ?, 1, 1, ?)
				`)
				.run('shared-id', 'shared.jpg', imagePath, 'f'.repeat(64), 15, 'folder-image');
			await insertLegacy(database, 'audio', 'shared-id', join(rootPath, 'audio', 'shared.mp3'));

			await expect(
				backfillMediaSpecializationAssets(database, [{ id: 'root-library', label: 'Library', path: rootPath }])
			).rejects.toThrow('colisiones de identidad');
			expect(database.query('SELECT count(*) AS count FROM Asset').get()).toEqual({ count: 0 });
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('reports structural and physical divergence after backfill', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			const roots: MediaRootMapping[] = [{ id: 'root-library', label: 'Library', path: rootPath }];
			await insertLegacy(database, 'document', 'document-diverged', join(rootPath, 'document', 'doc.pdf'));
			await backfillMediaSpecializationAssets(database, roots);
			database.query("UPDATE SourceFile SET contentHash = ? WHERE assetId = 'document-diverged'").run('f'.repeat(64));
			const structural = await reconcileMediaSpecializationAssets(database, roots);
			expect(structural.families.document.divergentIds).toEqual(['document-diverged']);
			database
				.query("UPDATE SourceFile SET contentHash = ? WHERE assetId = 'document-diverged'")
				.run(createHash('sha256').update('document:document-diverged').digest('hex'));
			await mkdir(join(rootPath, 'other'), { recursive: true });
			database.query("UPDATE Folder SET path = ? WHERE id = 'folder-document'").run(join(rootPath, 'other'));
			const physical = await reconcileMediaSpecializationAssets(database, roots);
			expect(physical.families.document.divergentIds).toEqual(['document-diverged']);
			expect(physical.pathVerification).toBe('verified');
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('does not verify a canonical media location when it resolves to a directory', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			const mediaPath = join(rootPath, 'audio', 'track.mp3');
			const roots: MediaRootMapping[] = [{ id: 'root-library', label: 'Library', path: rootPath }];
			await insertLegacy(database, 'audio', 'directory-location', mediaPath);
			await backfillMediaSpecializationAssets(database, roots);
			await rm(mediaPath);
			await mkdir(mediaPath);

			const report = await reconcileMediaSpecializationAssets(database, roots);
			expect(report.pathVerification).toBe('verified');
			expect(report.dataConsistent).toBe(false);
			expect(report.families.audio.divergentIds).toEqual(['directory-location']);
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('runs copy-only, leaves the source byte-identical and publishes only a reconciled output', async () => {
		const { database, databasePath, directory } = await createDatabase();
		const rootPath = join(directory, 'library');
		await insertLegacy(database, 'json', 'json-cli', join(rootPath, 'json', 'config.json'));
		database.clearQueryCache();
		database.close();
		const rootsPath = join(directory, 'roots.json');
		const outputPath = join(directory, 'canonical.sqlite');
		const backupDirectory = join(directory, 'backups');
		await mkdir(backupDirectory);
		await writeFile(rootsPath, JSON.stringify([{ id: 'root-library', label: 'Library', path: rootPath }]));
		const sourceHash = await sha256(databasePath);

		const result = await runCli([
			'--database',
			databasePath,
			'--backup-dir',
			backupDirectory,
			'--output',
			outputPath,
			'--roots',
			rootsPath,
			'--json',
		]);
		expect(result.exitCode, result.stderr).toBe(0);
		expect(existsSync(outputPath)).toBe(true);
		expect(await sha256(databasePath)).toBe(sourceHash);
		const output = new Database(outputPath, { readonly: true, strict: true });
		try {
			expect(
				(await reconcileMediaSpecializationAssets(output, [{ id: 'root-library', label: 'Library', path: rootPath }]))
					.dataConsistent
			).toBe(true);
		} finally {
			output.clearQueryCache();
			output.close();
		}
	});

	it('never publishes the final name when backfill reconciliation fails', async () => {
		const { database, databasePath, directory } = await createDatabase();
		const rootPath = join(directory, 'library');
		await insertLegacy(database, 'audio', 'outside-cli', join(directory, 'outside', 'outside.mp3'));
		database.clearQueryCache();
		database.close();
		const rootsPath = join(directory, 'roots-failure.json');
		const outputPath = join(directory, 'must-not-exist.sqlite');
		const backupDirectory = join(directory, 'backups-failure');
		await mkdir(backupDirectory);
		await mkdir(rootPath);
		await writeFile(rootsPath, JSON.stringify([{ id: 'root-library', label: 'Library', path: rootPath }]));

		const result = await runCli([
			'--database',
			databasePath,
			'--backup-dir',
			backupDirectory,
			'--output',
			outputPath,
			'--roots',
			rootsPath,
		]);
		expect(result.exitCode).toBe(1);
		expect(existsSync(outputPath)).toBe(false);
		expect((await readdir(directory)).filter((name) => name.includes('.media-backfill-partial-'))).toEqual([]);
	});

	it('refuses a reconciliation CLI run that did not verify explicit media roots', async () => {
		const { database, databasePath } = await createDatabase();
		database.clearQueryCache();
		database.close();
		const result = await runScriptCli('media-specialization-asset-reconcile.ts', ['--database', databasePath]);
		expect(result.exitCode).toBe(2);
		expect(result.stderr).toContain('--roots <roots.json>');
		expect(result.stdout).toBe('');
	});
});
