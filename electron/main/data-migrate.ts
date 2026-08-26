import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Database } from 'bun:sqlite';
import { applyProductionDatabaseMigrations } from '../../scripts/apply-production-database';
import { readMigrationMarker } from './data-migrate-marker';
import { MIGRATION_MARKER, RESTORE_LOCK } from './migration-marker';

export { readMigrationMarker } from './data-migrate-marker';
export { MIGRATION_MARKER, RESTORE_LOCK } from './migration-marker';

export interface MigrateOptions {
	sourceDb: string | null;
	targetDir: string;
}

export interface MigrateResult {
	status: 'completed' | 'no-source' | 'already-completed' | 'failed';
	targetDb: string;
	sourcePreserved: boolean;
	error?: string;
}

function runPragmas(dbPath: string): { integrity: string } {
	const db = new Database(dbPath, { readonly: true });
	try {
		const row = db.query('PRAGMA integrity_check').get() as { integrity_check?: string } | null;
		const integrity = String(row?.integrity_check ?? '');
		const foreignKeys = db.query('PRAGMA foreign_key_check').all();
		if (integrity !== 'ok') {
			throw new Error(`integrity_check failed: ${integrity}`);
		}
		if (foreignKeys.length > 0) {
			throw new Error(`foreign_key_check failed: ${foreignKeys.length} rows`);
		}
		return { integrity };
	} finally {
		db.close();
	}
}

function backupSqlite(source: string, destination: string) {
	const sourceDb = new Database(source);
	try {
		sourceDb.exec('PRAGMA wal_checkpoint(TRUNCATE)');
	} catch {
		// The source can be a fixture without WAL.
	} finally {
		sourceDb.close();
	}
	copyFileSync(source, destination);
}

function isPidAlive(pid: number): boolean {
	if (!Number.isInteger(pid) || pid <= 0) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

export function acquireRestoreLock(targetDir: string): () => void {
	mkdirSync(targetDir, { recursive: true });
	const lockPath = join(targetDir, RESTORE_LOCK);
	if (existsSync(lockPath)) {
		const existing = Number.parseInt(readFileSync(lockPath, 'utf8').trim(), 10);
		if (isPidAlive(existing)) {
			throw new Error('Restore is already running.');
		}
		rmSync(lockPath, { force: true });
	}
	const fd = openSync(lockPath, 'wx');
	writeFileSync(fd, `${process.pid}\n`);
	return () => {
		closeSync(fd);
		rmSync(lockPath, { force: true });
	};
}

export async function migrateTauriLibrary({ sourceDb, targetDir }: MigrateOptions): Promise<MigrateResult> {
	const release = acquireRestoreLock(targetDir);
	try {
		const markerPath = join(targetDir, MIGRATION_MARKER);
		const targetDb = join(targetDir, 'library.sqlite');
		const existing = readMigrationMarker(targetDir);
		if (existing?.status === 'completed' || existing?.status === 'no-source') {
			return {
				sourcePreserved: Boolean(sourceDb && existsSync(sourceDb)),
				status: 'already-completed',
				targetDb,
			};
		}

		if (!sourceDb || !existsSync(sourceDb)) {
			writeFileSync(markerPath, `${JSON.stringify({ status: 'no-source', version: 1 }, null, 2)}\n`);
			return { sourcePreserved: false, status: 'no-source', targetDb };
		}

		const staging = `${targetDb}.staging`;
		const backupDir = join(targetDir, 'backups');
		mkdirSync(backupDir, { recursive: true });
		const previousTarget = join(backupDir, 'pre-restore.sqlite');
		if (existsSync(staging)) {
			runPragmas(staging);
		} else {
			backupSqlite(sourceDb, join(backupDir, 'tauri-source.sqlite'));
			backupSqlite(sourceDb, staging);
			runPragmas(staging);
		}
		if (existsSync(targetDb)) backupSqlite(targetDb, previousTarget);
		if (existsSync(targetDb)) rmSync(targetDb);
		renameSync(staging, targetDb);
		runPragmas(targetDb);
		try {
			await applyProductionDatabaseMigrations({
				...process.env,
				DATABASE_URL: pathToFileURL(targetDb).href,
			});
		} catch (error) {
			if (existsSync(previousTarget)) {
				if (existsSync(targetDb)) rmSync(targetDb);
				copyFileSync(previousTarget, targetDb);
			} else if (existsSync(targetDb)) {
				rmSync(targetDb);
			}
			return {
				error: error instanceof Error ? error.message : String(error),
				sourcePreserved: existsSync(sourceDb),
				status: 'failed',
				targetDb,
			};
		}
		writeFileSync(markerPath, `${JSON.stringify({ source: sourceDb, status: 'completed', version: 1 }, null, 2)}\n`);
		return { sourcePreserved: existsSync(sourceDb), status: 'completed', targetDb };
	} finally {
		release();
	}
}

function parseCliArgs(argv: string[]): MigrateOptions {
	let sourceDb: string | null = null;
	let targetDir = '';
	let noSource = false;
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === '--source') {
			sourceDb = argv[index + 1] ?? null;
			index += 1;
		} else if (arg === '--target-dir') {
			targetDir = argv[index + 1] ?? '';
			index += 1;
		} else if (arg === '--no-source') {
			noSource = true;
		}
	}
	if (!targetDir) throw new Error('migrate-library requires --target-dir');
	return { sourceDb: noSource ? null : sourceDb, targetDir };
}

if (import.meta.main) {
	const result = await migrateTauriLibrary(parseCliArgs(process.argv.slice(2)));
	process.stdout.write(`${JSON.stringify(result)}\n`);
}
