import { describe, expect, it } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Database } from 'bun:sqlite';
import { applyProductionDatabaseMigrations } from './apply-production-database';
import { migrateTauriLibrary, readMigrationMarker, RESTORE_LOCK } from '../electron/main/data-migrate';
import { evaluateRestoreOffer, writeSkipRestoreMarker } from '../electron/main/restore-source';

const workspaceRoot = resolve(import.meta.dir, '..');

async function createMigratedSourceDb(dir: string): Promise<string> {
	const path = join(dir, 'tauri.sqlite');
	await applyProductionDatabaseMigrations({
		DATABASE_URL: pathToFileURL(path).href,
		MEDIA_MANAGER_MIGRATIONS_DIR: resolve(workspaceRoot, 'src/lib/drizzle/migrations'),
		MEDIA_MANAGER_SCHEMA_CONTRACT: resolve(workspaceRoot, 'src/lib/drizzle/schema-contract.json'),
	});
	return path;
}

function createForeignSourceDb(dir: string): string {
	const path = join(dir, 'foreign.sqlite');
	const db = new Database(path);
	db.exec('CREATE TABLE Asset (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
	db.exec("INSERT INTO Asset (id, name) VALUES ('a1', 'one')");
	db.close();
	return path;
}

describe('tauri library restore', () => {
	it('restores once and stays idempotent without deleting the source', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-migrate-'));
		const source = await createMigratedSourceDb(dir);
		const targetDir = join(dir, 'target');
		const first = await migrateTauriLibrary({ sourceDb: source, targetDir });
		expect(first.status).toBe('completed');
		expect(first.sourcePreserved).toBe(true);
		const second = await migrateTauriLibrary({ sourceDb: source, targetDir });
		expect(second.status).toBe('already-completed');
		expect(second.sourcePreserved).toBe(true);
		const marker = readMigrationMarker(targetDir);
		expect(marker?.status).toBe('completed');
	});

	it('recovers when the marker is missing after the target exists', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-migrate-crash-'));
		const source = await createMigratedSourceDb(dir);
		const targetDir = join(dir, 'target');
		await migrateTauriLibrary({ sourceDb: source, targetDir });
		const markerPath = join(targetDir, 'migration-tauri-to-electron-v1.json');
		writeFileSync(markerPath, '{"status":"applying"}');
		const recovered = await migrateTauriLibrary({ sourceDb: source, targetDir });
		expect(recovered.status).toBe('completed');
		expect(recovered.sourcePreserved).toBe(true);
	});

	it('records no-source without creating a library from the workspace', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-migrate-empty-'));
		const result = await migrateTauriLibrary({ sourceDb: null, targetDir: dir });
		expect(result.status).toBe('no-source');
		expect(readMigrationMarker(dir)?.status).toBe('no-source');
	});

	it('recovers a crash before the atomic rename and keeps the source', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-migrate-rename-'));
		const source = await createMigratedSourceDb(dir);
		const targetDir = join(dir, 'target');
		mkdirSync(targetDir, { recursive: true });
		writeFileSync(join(targetDir, 'library.sqlite.staging'), readFileSync(source));
		const recovered = await migrateTauriLibrary({ sourceDb: source, targetDir });
		expect(recovered.status).toBe('completed');
		expect(recovered.sourcePreserved).toBe(true);
		expect(existsSync(join(targetDir, 'library.sqlite'))).toBe(true);
		expect(existsSync(source)).toBe(true);
	});

	it('refuses a live restore lock and steals a stale lock', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-migrate-lock-'));
		const source = await createMigratedSourceDb(dir);
		const targetDir = join(dir, 'target');
		mkdirSync(targetDir, { recursive: true });
		writeFileSync(join(targetDir, RESTORE_LOCK), `${process.pid}\n`);
		await expect(migrateTauriLibrary({ sourceDb: source, targetDir })).rejects.toThrow('Restore is already running.');
		writeFileSync(join(targetDir, RESTORE_LOCK), '99999999\n');
		const recovered = await migrateTauriLibrary({ sourceDb: source, targetDir });
		expect(recovered.status).toBe('completed');
		expect(existsSync(join(targetDir, RESTORE_LOCK))).toBe(false);
	});

	it('rejects a foreign schema and keeps the previous migrated library', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-migrate-foreign-'));
		const good = await createMigratedSourceDb(dir);
		const targetDir = join(dir, 'target');
		const first = await migrateTauriLibrary({ sourceDb: good, targetDir });
		expect(first.status).toBe('completed');
		writeFileSync(join(targetDir, 'migration-tauri-to-electron-v1.json'), '{"status":"applying"}');
		const foreign = createForeignSourceDb(dir);
		const failed = await migrateTauriLibrary({ sourceDb: foreign, targetDir });
		expect(failed.status).toBe('failed');
		expect(failed.sourcePreserved).toBe(true);
		const favorite = new Database(join(targetDir, 'library.sqlite'), { readonly: true });
		try {
			const columns = favorite.query('PRAGMA table_info("Favorite")').all() as Array<{ name: string }>;
			expect(columns.some((column) => column.name === 'profileId')).toBe(true);
		} finally {
			favorite.close();
		}
	});

	it('offers restore only when a Tauri source exists and the marker is absent', () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-restore-offer-'));
		const source = createForeignSourceDb(dir);
		const appDataDir = join(dir, 'app-data');
		const first = evaluateRestoreOffer({
			appDataDir,
			env: { MEDIA_MANAGER_TAURI_SOURCE_DB: source },
		});
		expect(first.available).toBe(true);
		expect(first.sourceDb).toBe(source);
		writeSkipRestoreMarker(appDataDir);
		const skipped = evaluateRestoreOffer({
			appDataDir,
			env: { MEDIA_MANAGER_TAURI_SOURCE_DB: source },
		});
		expect(skipped.available).toBe(false);
	});
});
