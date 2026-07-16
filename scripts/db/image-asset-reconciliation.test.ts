import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
	backfillImageAssets,
	reconcileImageAssets,
	type ImageRootMapping,
	validateImageRootMappings,
} from './image-asset-reconciliation';
import { migrateDatabase } from './migrations';

const temporaryDirectories: string[] = [];

async function createDatabase(): Promise<{ database: Database; directory: string }> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-image-reconcile-'));
	temporaryDirectories.push(directory);
	const databasePath = join(directory, 'copy.sqlite');
	await migrateDatabase({ databasePath });
	const database = new Database(databasePath, { strict: true });
	database.exec('PRAGMA foreign_keys = ON');
	return { database, directory };
}

async function insertLegacyImage(database: Database, id: string, path: string, hash = 'a'.repeat(64)): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, id, 'utf8');
	database
		.query('INSERT OR IGNORE INTO Folder(id, name, path) VALUES (?, ?, ?)')
		.run('folder-images', 'Images', dirname(path));
	database
		.query(`
			INSERT INTO Image(id, name, path, hash, size, width, height, folderId)
			VALUES (?, ?, ?, ?, 1024, 800, 600, 'folder-images')
		`)
		.run(id, `${id}.jpg`, path, hash);
}

async function sha256(path: string): Promise<string> {
	return createHash('sha256')
		.update(await readFile(path))
		.digest('hex');
}

async function runBackfillCli(args: string[]): Promise<{ exitCode: number; stderr: string; stdout: string }> {
	return runCli('image-asset-backfill.ts', args);
}

async function runCli(script: string, args: string[]): Promise<{ exitCode: number; stderr: string; stdout: string }> {
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

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('Image canonical copy-only backfill', () => {
	it('backfills every legacy Image idempotently and reports verified data consistency', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			const roots: ImageRootMapping[] = [{ id: 'root-library', label: 'Library', path: rootPath }];
			await insertLegacyImage(database, 'image-one', join(rootPath, 'images', 'one.jpg'));
			await insertLegacyImage(database, 'image-two', join(rootPath, 'images', 'two.jpg'), 'b'.repeat(64));

			const first = await backfillImageAssets(database, roots);
			expect(first.backfilled).toBe(2);
			expect(first.alreadyCanonical).toBe(0);
			expect(first.report).toEqual(
				expect.objectContaining({ canonical: 2, dataConsistent: true, divergent: 0, legacyOnly: 0 })
			);
			expect(database.query('SELECT id, assetId FROM Image ORDER BY id').all()).toEqual([
				{ assetId: 'image-one', id: 'image-one' },
				{ assetId: 'image-two', id: 'image-two' },
			]);
			expect(database.query('SELECT count(*) AS count FROM Asset').get()).toEqual({ count: 2 });
			expect(database.query('SELECT count(*) AS count FROM SourceFile').get()).toEqual({ count: 2 });

			const second = await backfillImageAssets(database, roots);
			expect(second.backfilled).toBe(0);
			expect(second.alreadyCanonical).toBe(2);
			expect(second.report.dataConsistent).toBe(true);
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('fails preflight without partial canonical rows when one path is unmapped', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			const roots: ImageRootMapping[] = [{ id: 'root-library', label: 'Library', path: rootPath }];
			await insertLegacyImage(database, 'image-inside', join(rootPath, 'inside.jpg'));
			await insertLegacyImage(database, 'image-outside', join(directory, 'outside', 'outside.jpg'), 'b'.repeat(64));

			await expect(backfillImageAssets(database, roots)).rejects.toThrow('ROOT_PATH_OUTSIDE');
			expect(database.query('SELECT count(*) AS count FROM Asset').get()).toEqual({ count: 0 });
			expect(database.query('SELECT count(*) AS count FROM SourceFile').get()).toEqual({ count: 0 });
			expect(database.query('SELECT count(*) AS count FROM Image WHERE assetId IS NOT NULL').get()).toEqual({
				count: 0,
			});
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('rejects a legacy Image outside its declared Folder before writing canonical rows', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			const declaredFolderPath = join(rootPath, 'declared');
			await mkdir(declaredFolderPath, { recursive: true });
			await insertLegacyImage(database, 'image-cross-folder', join(rootPath, 'outside', 'image.jpg'));
			database.query("UPDATE Folder SET path = ? WHERE id = 'folder-images'").run(declaredFolderPath);

			await expect(
				backfillImageAssets(database, [{ id: 'root-library', label: 'Library', path: rootPath }])
			).rejects.toThrow('FOLDER_PATH_CONFLICT');
			expect(database.query('SELECT count(*) AS count FROM Asset').get()).toEqual({ count: 0 });
			expect(database.query('SELECT count(*) AS count FROM SourceFile').get()).toEqual({ count: 0 });
			expect(database.query('SELECT assetId FROM Image WHERE id = ?').get('image-cross-folder')).toEqual({
				assetId: null,
			});
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('reports a canonical Image as divergent when its physical Folder no longer contains its source', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			const roots: ImageRootMapping[] = [{ id: 'root-library', label: 'Library', path: rootPath }];
			await insertLegacyImage(database, 'image-folder-diverged', join(rootPath, 'images', 'image.jpg'));
			await backfillImageAssets(database, roots);
			const unrelatedFolderPath = join(rootPath, 'unrelated');
			await mkdir(unrelatedFolderPath, { recursive: true });
			database.query("UPDATE Folder SET path = ? WHERE id = 'folder-images'").run(unrelatedFolderPath);

			const report = await reconcileImageAssets(database, roots);
			expect(report.divergentIds).toEqual(['image-folder-diverged']);
			expect(report.dataConsistent).toBe(false);
			expect(report.pathVerification).toBe('verified');
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('reports a linked divergence as inconsistent data', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			const roots: ImageRootMapping[] = [{ id: 'root-library', label: 'Library', path: rootPath }];
			await insertLegacyImage(database, 'image-diverged', join(rootPath, 'diverged.jpg'));
			await backfillImageAssets(database, roots);
			database.query("UPDATE SourceFile SET contentHash = ? WHERE assetId = 'image-diverged'").run('f'.repeat(64));

			const report = await reconcileImageAssets(database, roots);
			expect(report.divergent).toBe(1);
			expect(report.divergentIds).toEqual(['image-diverged']);
			expect(report.dataConsistent).toBe(false);
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('keeps structural consistency separate from physical path verification', async () => {
		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			const roots: ImageRootMapping[] = [{ id: 'root-library', label: 'Library', path: rootPath }];
			await insertLegacyImage(database, 'image-structural-only', join(rootPath, 'structural.jpg'));
			await backfillImageAssets(database, roots);

			const structuralOnly = await reconcileImageAssets(database);
			expect(structuralOnly.pathVerification).toBe('not_verified');
			expect(structuralOnly.dataConsistent).toBe(true);
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('runs the CLI copy-only, leaves the source byte-identical and publishes a reconciled output', async () => {
		const { database, directory } = await createDatabase();
		const sourcePath = join(directory, 'copy.sqlite');
		const rootPath = join(directory, 'library');
		const rootsPath = join(directory, 'roots.json');
		const outputPath = join(directory, 'image-canonical.sqlite');
		const backupDirectory = join(directory, 'backups');
		await insertLegacyImage(database, 'image-cli', join(rootPath, 'cli.jpg'));
		database.clearQueryCache();
		database.close();
		await writeFile(rootsPath, JSON.stringify([{ id: 'root-library', label: 'Library', path: rootPath }]));
		const sourceBefore = await sha256(sourcePath);

		const result = await runBackfillCli([
			'--database',
			sourcePath,
			'--backup-dir',
			backupDirectory,
			'--output',
			outputPath,
			'--roots',
			rootsPath,
			'--json',
		]);

		expect(result.exitCode, result.stderr).toBe(0);
		expect(await sha256(sourcePath)).toBe(sourceBefore);
		expect(existsSync(outputPath)).toBe(true);
		expect((await readdir(backupDirectory)).some((name) => name.endsWith('.sqlite'))).toBe(true);
		const output = new Database(outputPath, { readonly: true });
		expect(output.query('SELECT id, assetId FROM Image').all()).toEqual([{ assetId: 'image-cli', id: 'image-cli' }]);
		expect(
			(await reconcileImageAssets(output, [{ id: 'root-library', label: 'Library', path: rootPath }])).dataConsistent
		).toBe(true);
		output.clearQueryCache();
		output.close();
	});

	it('rejects an unverified retirement gate and invalid roots before creating a backup or output', async () => {
		const { database, directory } = await createDatabase();
		const sourcePath = join(directory, 'copy.sqlite');
		const rootsPath = join(directory, 'invalid-roots.json');
		const outputPath = join(directory, 'must-not-exist.sqlite');
		const backupDirectory = join(directory, 'must-not-create-backups');
		await insertLegacyImage(database, 'image-invalid-roots', join(directory, 'library', 'invalid.jpg'));
		database.clearQueryCache();
		database.close();
		await writeFile(rootsPath, '[]');
		const sourceBefore = await sha256(sourcePath);

		const removedRetirementGate = await runCli('image-asset-reconcile.ts', [
			'--database',
			sourcePath,
			'--retirement-gate',
		]);
		expect(removedRetirementGate.exitCode).toBe(2);
		expect(removedRetirementGate.stderr).toContain('retirement-gate');

		const backfill = await runBackfillCli([
			'--database',
			sourcePath,
			'--backup-dir',
			backupDirectory,
			'--output',
			outputPath,
			'--roots',
			rootsPath,
		]);
		expect(backfill.exitCode).toBe(1);
		expect(await sha256(sourcePath)).toBe(sourceBefore);
		expect(existsSync(outputPath)).toBe(false);
		expect(existsSync(backupDirectory)).toBe(false);
	});

	it('reuses runtime validation for roots and every derived relative reference', async () => {
		await expect(
			validateImageRootMappings([{ id: 'device-root', label: 'Device', path: '\\\\?\\C:\\unsafe' }])
		).rejects.toThrow();

		const { database, directory } = await createDatabase();
		try {
			const rootPath = join(directory, 'library');
			await insertLegacyImage(database, 'image-encoded', join(rootPath, '%2e%2e.jpg'));
			await expect(
				backfillImageAssets(database, [{ id: 'root-library', label: 'Library', path: rootPath }])
			).rejects.toThrow('ROOT_PATH_INVALID');
			expect(database.query('SELECT count(*) AS count FROM Asset').get()).toEqual({ count: 0 });
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});
});
