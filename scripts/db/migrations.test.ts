import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
	checkDatabase,
	inspectMigrationStatus,
	loadMigrations,
	MIGRATIONS_DIRECTORY,
	MIGRATION_TABLE,
	migrateDatabase,
	migrateDatabaseFromCli,
} from './migrations';

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-migrations-'));
	temporaryDirectories.push(directory);
	return directory;
}

async function writeJournal(migrationDirectory: string, tags: string[]): Promise<void> {
	await mkdir(join(migrationDirectory, 'meta'), { recursive: true });
	await writeFile(
		join(migrationDirectory, 'meta', '_journal.json'),
		JSON.stringify({ dialect: 'sqlite', entries: tags.map((tag, idx) => ({ idx, tag })), version: '7' }),
		'utf8'
	);
}

async function sha256(path: string): Promise<string> {
	return createHash('sha256')
		.update(await readFile(path))
		.digest('hex');
}

function createMigrationHistoryTable(database: Database): void {
	database.exec(`
		CREATE TABLE __media_manager_migrations (
			version INTEGER PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			checksum TEXT NOT NULL,
			appliedAt TEXT NOT NULL,
			durationMs INTEGER NOT NULL CHECK(durationMs >= 0)
		)
	`);
}

function insertHistory(database: Database, version: number, name: string, checksum: string): void {
	database
		.query(
			`INSERT INTO __media_manager_migrations (version, name, checksum, appliedAt, durationMs)
			 VALUES (?, ?, ?, ?, 0)`
		)
		.run(version, name, checksum, new Date(0).toISOString());
}

async function run(
	command: string[],
	environment: Record<string, string> = {}
): Promise<{
	exitCode: number;
	stderr: string;
	stdout: string;
}> {
	const child = Bun.spawn(command, {
		cwd: resolve(import.meta.dir, '../..'),
		env: { ...process.env, ...environment },
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
	for (const directory of temporaryDirectories.splice(0)) await rm(directory, { force: true, recursive: true });
});

describe('versioned SQLite migrations', () => {
	it('creates the current schema from empty and is idempotent', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'fresh.sqlite');

		const first = await migrateDatabase({ databasePath });
		const second = await migrateDatabase({ databasePath });
		const check = await checkDatabase({ databasePath });

		expect(first.applied).toEqual([
			'0000_baseline.sql',
			'0001_relational_integrity.sql',
			'0002_queue_idempotency.sql',
			'0003_epoch_ms_normalization.sql',
		]);
		expect(second).toEqual({
			applied: [],
			skipped: [
				'0000_baseline.sql',
				'0001_relational_integrity.sql',
				'0002_queue_idempotency.sql',
				'0003_epoch_ms_normalization.sql',
			],
		});
		expect(check.healthy).toBe(true);
		expect(check.status).toBe('ok');
		expect(check.integrity).toBe('ok');
		expect(check.foreignKeyViolations).toBe(0);
		expect(check.schema.changed).toEqual([]);
		expect(check.schema.missing).toEqual([]);
		expect(check.diagnostics).toEqual(
			expect.objectContaining({
				databaseBytes: expect.any(Number),
				foreignKeysEnabled: true,
				journalMode: 'wal',
				sqliteVersion: expect.any(String),
			})
		);
		expect(check.diagnostics.availableBytes).toBeGreaterThan(check.diagnostics.databaseBytes);
	});

	it('reports a missing database as a pending plan without creating it', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'missing.sqlite');
		const status = await inspectMigrationStatus({ databasePath });

		expect(status.migrations.map((entry) => entry.state)).toEqual(['pending', 'pending', 'pending', 'pending']);
		expect(await Bun.file(databasePath).exists()).toBe(false);
	});

	it('rejects an applied migration whose checksum changed', async () => {
		const directory = await createTemporaryDirectory();
		const migrationDirectory = join(directory, 'migrations');
		const databasePath = join(directory, 'checksum.sqlite');
		await mkdir(migrationDirectory);
		const migrationPath = join(migrationDirectory, '0000_baseline.sql');
		await copyFile(join(MIGRATIONS_DIRECTORY, '0000_baseline.sql'), migrationPath);
		await writeJournal(migrationDirectory, ['0000_baseline']);
		await migrateDatabase({ databasePath, migrationsDirectory: migrationDirectory });
		await writeFile(migrationPath, `${await readFile(migrationPath, 'utf8')}\n-- tampered\n`, 'utf8');

		const status = await inspectMigrationStatus({ databasePath, migrationsDirectory: migrationDirectory });
		expect(status.migrations[0].state).toBe('modified');
		await expect(migrateDatabase({ databasePath, migrationsDirectory: migrationDirectory })).rejects.toThrow(
			'Migración aplicada fue modificada'
		);
	});

	it('rolls back a failed migration and leaves the prior version intact', async () => {
		const directory = await createTemporaryDirectory();
		const migrationDirectory = join(directory, 'migrations');
		const databasePath = join(directory, 'rollback.sqlite');
		await mkdir(migrationDirectory);
		await writeFile(
			join(migrationDirectory, '0000_stable.sql'),
			'CREATE TABLE stable (id TEXT PRIMARY KEY);\n',
			'utf8'
		);
		await writeJournal(migrationDirectory, ['0000_stable', '0001_broken']);
		await writeFile(
			join(migrationDirectory, '0001_broken.sql'),
			'CREATE TABLE transient (id TEXT);--> statement-breakpoint\nTHIS IS NOT SQL;\n',
			'utf8'
		);

		await expect(migrateDatabase({ databasePath, migrationsDirectory: migrationDirectory })).rejects.toThrow();
		const database = new Database(databasePath, { readonly: true });
		expect(database.query("SELECT 1 FROM sqlite_schema WHERE name = 'stable'").get()).toBeTruthy();
		expect(database.query("SELECT 1 FROM sqlite_schema WHERE name = 'transient'").get()).toBeNull();
		const applied = database.query('SELECT name FROM __media_manager_migrations ORDER BY version').all();
		database.close();
		expect(applied).toEqual([{ name: '0000_stable.sql' }]);
	});

	it('rebuilds constrained tables with foreign keys disabled only for the declared migration', async () => {
		const directory = await createTemporaryDirectory();
		const migrationDirectory = join(directory, 'migrations');
		const databasePath = join(directory, 'foreign-key-rebuild.sqlite');
		await mkdir(migrationDirectory);
		await writeFile(
			join(migrationDirectory, '0000_legacy.sql'),
			[
				'CREATE TABLE parent (id TEXT PRIMARY KEY);',
				"INSERT INTO parent(id) VALUES ('kept');",
				'CREATE TABLE child (id TEXT PRIMARY KEY, parentId TEXT NOT NULL);',
				"INSERT INTO child(id, parentId) VALUES ('valid', 'kept'), ('orphan', 'missing');",
			].join('--> statement-breakpoint\n')
		);
		await writeFile(
			join(migrationDirectory, '0001_constraints.sql'),
			[
				'-- media-manager: foreign-keys-off\nDELETE FROM child WHERE parentId NOT IN (SELECT id FROM parent);',
				'CREATE TABLE child_new (id TEXT PRIMARY KEY, parentId TEXT NOT NULL REFERENCES parent(id) ON DELETE CASCADE);',
				'INSERT INTO child_new SELECT * FROM child;',
				'DROP TABLE child;',
				'ALTER TABLE child_new RENAME TO child;',
			].join('--> statement-breakpoint\n')
		);
		await writeJournal(migrationDirectory, ['0000_legacy', '0001_constraints']);

		const result = await migrateDatabase({ databasePath, migrationsDirectory: migrationDirectory });
		const database = new Database(databasePath, { readonly: true });
		const children = database.query('SELECT id, parentId FROM child ORDER BY id').all();
		const foreignKeys = database.query('PRAGMA foreign_key_list(child)').all();
		database.close();

		expect(result.applied).toEqual(['0000_legacy.sql', '0001_constraints.sql']);
		expect(children).toEqual([{ id: 'valid', parentId: 'kept' }]);
		expect(foreignKeys).toHaveLength(1);
	});

	it('rolls back a declared table rebuild when it would leave foreign key violations', async () => {
		const directory = await createTemporaryDirectory();
		const migrationDirectory = join(directory, 'migrations');
		const databasePath = join(directory, 'foreign-key-violation.sqlite');
		await mkdir(migrationDirectory);
		await writeFile(
			join(migrationDirectory, '0000_legacy.sql'),
			[
				'CREATE TABLE parent (id TEXT PRIMARY KEY);',
				'CREATE TABLE child (id TEXT PRIMARY KEY, parentId TEXT NOT NULL);',
				"INSERT INTO child(id, parentId) VALUES ('orphan', 'missing');",
			].join('--> statement-breakpoint\n')
		);
		await writeFile(
			join(migrationDirectory, '0001_broken_constraints.sql'),
			[
				'-- media-manager: foreign-keys-off\nCREATE TABLE child_new (id TEXT PRIMARY KEY, parentId TEXT NOT NULL REFERENCES parent(id));',
				'INSERT INTO child_new SELECT * FROM child;',
				'DROP TABLE child;',
				'ALTER TABLE child_new RENAME TO child;',
			].join('--> statement-breakpoint\n')
		);
		await writeJournal(migrationDirectory, ['0000_legacy', '0001_broken_constraints']);

		await expect(migrateDatabase({ databasePath, migrationsDirectory: migrationDirectory })).rejects.toThrow(
			'dejaría 1 violación(es)'
		);
		const database = new Database(databasePath, { readonly: true });
		expect(database.query('SELECT * FROM child').all()).toEqual([{ id: 'orphan', parentId: 'missing' }]);
		expect(database.query('PRAGMA foreign_key_list(child)').all()).toEqual([]);
		expect(database.query('SELECT name FROM __media_manager_migrations ORDER BY version').all()).toEqual([
			{ name: '0000_legacy.sql' },
		]);
		database.close();
	});

	it('refuses an untracked non-empty database', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'legacy.sqlite');
		const database = new Database(databasePath);
		database.exec('CREATE TABLE legacy_data (id TEXT PRIMARY KEY)');
		database.close();

		await expect(migrateDatabase({ databasePath })).rejects.toThrow('schema sin un prefijo de migraciones válido');
	});

	it('refuses a non-empty database with an empty migration history before baseline DDL', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'empty-history.sqlite');
		const database = new Database(databasePath);
		database.exec('CREATE TABLE legacy_data (id TEXT PRIMARY KEY)');
		createMigrationHistoryTable(database);
		database.close();

		await expect(migrateDatabase({ databasePath })).rejects.toThrow('prefijo de migraciones válido');
		const verification = new Database(databasePath, { readonly: true });
		expect(verification.query("SELECT 1 FROM sqlite_schema WHERE name = 'Image'").get()).toBeNull();
		expect(verification.query("SELECT 1 FROM sqlite_schema WHERE name = 'legacy_data'").get()).toBeTruthy();
		verification.close();
	});

	it('refuses a discontinuous history before applying the missing migration', async () => {
		const directory = await createTemporaryDirectory();
		const migrationDirectory = join(directory, 'migrations');
		const databasePath = join(directory, 'gap.sqlite');
		await mkdir(migrationDirectory);
		await writeFile(join(migrationDirectory, '0000_first.sql'), 'CREATE TABLE first_table (id TEXT PRIMARY KEY);\n');
		await writeFile(join(migrationDirectory, '0001_second.sql'), 'CREATE TABLE second_table (id TEXT PRIMARY KEY);\n');
		await writeFile(join(migrationDirectory, '0002_third.sql'), 'CREATE TABLE third_table (id TEXT PRIMARY KEY);\n');
		await writeJournal(migrationDirectory, ['0000_first', '0001_second', '0002_third']);
		const migrations = await loadMigrations(migrationDirectory);
		const database = new Database(databasePath);
		database.exec(migrations[0].statements[0]);
		createMigrationHistoryTable(database);
		insertHistory(database, 0, migrations[0].name, migrations[0].checksum);
		insertHistory(database, 2, migrations[2].name, migrations[2].checksum);
		database.close();

		await expect(migrateDatabase({ databasePath, migrationsDirectory: migrationDirectory })).rejects.toThrow(
			'historial de migraciones no es continuo'
		);
		const verification = new Database(databasePath, { readonly: true });
		expect(verification.query("SELECT 1 FROM sqlite_schema WHERE name = 'second_table'").get()).toBeNull();
		verification.close();
	});

	it('refuses unknown migration versions before baseline DDL', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'unknown.sqlite');
		const database = new Database(databasePath);
		createMigrationHistoryTable(database);
		insertHistory(database, 99, '0099_unknown.sql', 'unknown-checksum');
		database.close();

		await expect(migrateDatabase({ databasePath })).rejects.toThrow('migración desconocida');
		const verification = new Database(databasePath, { readonly: true });
		expect(verification.query("SELECT 1 FROM sqlite_schema WHERE name = 'Image'").get()).toBeNull();
		verification.close();
	});

	it('rejects canonical schema drift even when migration history is valid', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'drift.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.exec('CREATE TABLE unexpected_object (id TEXT PRIMARY KEY)');
		database.query('PRAGMA wal_checkpoint(TRUNCATE)').get();
		database.query('PRAGMA journal_mode = DELETE').get();
		database.close();
		const hashBefore = await sha256(databasePath);

		await expect(migrateDatabase({ databasePath })).rejects.toThrow('schema resultante no coincide');
		expect(await sha256(databasePath)).toBe(hashBefore);
		expect(await Bun.file(`${databasePath}-wal`).exists()).toBe(false);
		expect(await Bun.file(`${databasePath}-shm`).exists()).toBe(false);
		const unchanged = new Database(databasePath, { readonly: true });
		expect(unchanged.query('PRAGMA journal_mode').get()).toEqual({ journal_mode: 'delete' });
		unchanged.close();
	});

	it('does not hide arbitrary objects behind the media_fts prefix', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'fake-fts.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.exec('CREATE TABLE media_fts_evil (id TEXT PRIMARY KEY)');
		database.close();

		const check = await checkDatabase({ databasePath });
		expect(check.healthy).toBe(false);
		expect(check.status).toBe('error');
		expect(check.errors).toContain('schema_drift');
		expect(check.schema.extra).toContainEqual({
			classification: 'unknown',
			name: 'media_fts_evil',
			type: 'table',
		});
	});

	it('reports a non-WAL database as a warning without hiding otherwise healthy state', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'warning.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.query('PRAGMA wal_checkpoint(TRUNCATE)').get();
		database.query('PRAGMA journal_mode = DELETE').get();
		database.close();

		const check = await checkDatabase({ databasePath });
		expect(check.healthy).toBe(true);
		expect(check.status).toBe('warning');
		expect(check.warnings).toContain('journal_mode=delete');
	});

	it('rejects a user_version that contradicts the canonical migration history', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'impossible-version.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.exec('PRAGMA user_version = 999');
		database.close();

		const check = await checkDatabase({ databasePath });
		expect(check.healthy).toBe(false);
		expect(check.status).toBe('error');
		expect(check.expectedUserVersion).toBe(4);
		expect(check.errors).toContain('user_version_mismatch=999:4');
	});

	it('rejects a future user_version before an allowed pending migration can normalize it', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'pending-impossible-version.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.exec(`DELETE FROM ${MIGRATION_TABLE} WHERE version = 3; PRAGMA user_version = 999;`);
		database.close();

		await expect(migrateDatabase({ allowExistingPending: true, databasePath })).rejects.toThrow(
			'user_version no coincide con la historia aplicada: actual=999, esperado=3'
		);
		const unchanged = new Database(databasePath, { readonly: true });
		expect(unchanged.query(`SELECT count(*) AS count FROM ${MIGRATION_TABLE}`).get()).toEqual({ count: 3 });
		expect(unchanged.query('PRAGMA user_version').get()).toEqual({ user_version: 999 });
		unchanged.close();
	});

	it('rejects an allowlisted FTS trigger name when its SQL is not canonical', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'hostile-fts-trigger.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.exec(`
			CREATE VIRTUAL TABLE media_fts USING fts5(
				name,
				content,
				entity_type,
				entity_id,
				tokenize = 'unicode61 remove_diacritics 2'
			);
			CREATE TRIGGER images_ai AFTER INSERT ON Image BEGIN
				DELETE FROM Profile;
			END;
		`);
		database.clearQueryCache();
		database.close();

		const check = await checkDatabase({ databasePath });
		expect(check.healthy).toBe(false);
		expect(check.schema.extra).toContainEqual({ classification: 'unknown', name: 'images_ai', type: 'trigger' });
	});

	it('serializes four concurrent CLI migrators behind one fresh-database owner', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'concurrent.sqlite');
		const migrationScript = resolve(import.meta.dir, 'migrations.ts');
		const commands = Array.from({ length: 4 }, () =>
			run([process.execPath, migrationScript, 'migrate', '--database', databasePath, '--json'])
		);
		const results = await Promise.all(commands);

		expect(results.map((result) => result.exitCode)).toEqual([0, 0, 0, 0]);
		const payloads = results.map((result) => JSON.parse(result.stdout) as { applied: string[]; skipped: string[] });
		expect(payloads.reduce((total, payload) => total + payload.applied.length, 0)).toBe(4);
		expect(payloads.reduce((total, payload) => total + payload.skipped.length, 0)).toBe(12);
	});

	it('does not grant in-place migration authority when a pending database appears after marker claim', async () => {
		const directory = await createTemporaryDirectory();
		const pendingSourcePath = join(directory, 'pending-source.sqlite');
		const claimedTargetPath = join(directory, 'claimed-target.sqlite');
		await migrateDatabase({ databasePath: pendingSourcePath });
		const pendingSource = new Database(pendingSourcePath);
		pendingSource.exec(`DELETE FROM ${MIGRATION_TABLE} WHERE version = 3; PRAGMA user_version = 3;`);
		pendingSource.close();

		await expect(
			migrateDatabaseFromCli(claimedTargetPath, async () => {
				await copyFile(pendingSourcePath, claimedTargetPath, constants.COPYFILE_EXCL);
			})
		).rejects.toThrow('db:upgrade');
		const unchanged = new Database(claimedTargetPath, { readonly: true });
		expect(unchanged.query(`SELECT count(*) AS count FROM ${MIGRATION_TABLE}`).get()).toEqual({ count: 3 });
		expect(unchanged.query('PRAGMA user_version').get()).toEqual({ user_version: 3 });
		unchanged.close();
		expect(await Bun.file(`${claimedTargetPath}.migration-initializing`).exists()).toBe(false);
	});

	it('requires an explicit target and never falls back to db.sqlite', async () => {
		const migrationScript = resolve(import.meta.dir, 'migrations.ts');
		const result = await run([process.execPath, migrationScript, 'status'], { DATABASE_URL: '' });

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('no existe fallback a db.sqlite');
	});

	it('refuses direct in-place migration of an existing database with pending canonical migrations', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'existing-pending.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.exec(`DELETE FROM ${MIGRATION_TABLE} WHERE version = 3; PRAGMA user_version = 3;`);
		database.query('PRAGMA wal_checkpoint(TRUNCATE)').get();
		database.query('PRAGMA journal_mode = DELETE').get();
		database.close();
		const hashBefore = await sha256(databasePath);

		const migrationScript = resolve(import.meta.dir, 'migrations.ts');
		const result = await run([process.execPath, migrationScript, 'migrate', '--database', databasePath, '--json']);
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('db:upgrade');
		expect(await sha256(databasePath)).toBe(hashBefore);
		expect(await Bun.file(`${databasePath}-wal`).exists()).toBe(false);
		expect(await Bun.file(`${databasePath}-shm`).exists()).toBe(false);
		const unchanged = new Database(databasePath, { readonly: true });
		expect(unchanged.query(`SELECT count(*) AS count FROM ${MIGRATION_TABLE}`).get()).toEqual({ count: 3 });
		expect(unchanged.query('PRAGMA user_version').get()).toEqual({ user_version: 3 });
		expect(unchanged.query('PRAGMA journal_mode').get()).toEqual({ journal_mode: 'delete' });
		unchanged.close();
	});
});
