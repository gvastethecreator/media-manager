import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
	checkDatabase,
	inspectMigrationStatus,
	loadMigrations,
	MIGRATIONS_DIRECTORY,
	migrateDatabase,
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

		expect(first.applied).toEqual(['0000_baseline.sql']);
		expect(second).toEqual({ applied: [], skipped: ['0000_baseline.sql'] });
		expect(check.healthy).toBe(true);
		expect(check.integrity).toBe('ok');
		expect(check.foreignKeyViolations).toBe(0);
		expect(check.schema.changed).toEqual([]);
		expect(check.schema.missing).toEqual([]);
	});

	it('reports a missing database as a pending plan without creating it', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'missing.sqlite');
		const status = await inspectMigrationStatus({ databasePath });

		expect(status.migrations.map((entry) => entry.state)).toEqual(['pending']);
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
		database.close();

		await expect(migrateDatabase({ databasePath })).rejects.toThrow('schema resultante no coincide');
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
		expect(check.schema.extra).toContainEqual({
			classification: 'unknown',
			name: 'media_fts_evil',
			type: 'table',
		});
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

	it('serializes two concurrent CLI migrators with a write lock', async () => {
		const directory = await createTemporaryDirectory();
		const databasePath = join(directory, 'concurrent.sqlite');
		const migrationScript = resolve(import.meta.dir, 'migrations.ts');
		const commands = Array.from({ length: 2 }, () =>
			run([process.execPath, migrationScript, 'migrate', '--database', databasePath, '--json'])
		);
		const results = await Promise.all(commands);

		expect(results.map((result) => result.exitCode)).toEqual([0, 0]);
		const payloads = results.map((result) => JSON.parse(result.stdout) as { applied: string[]; skipped: string[] });
		expect(payloads.reduce((total, payload) => total + payload.applied.length, 0)).toBe(1);
		expect(payloads.reduce((total, payload) => total + payload.skipped.length, 0)).toBe(1);
	});

	it('requires an explicit target and never falls back to db.sqlite', async () => {
		const migrationScript = resolve(import.meta.dir, 'migrations.ts');
		const result = await run([process.execPath, migrationScript, 'status'], { DATABASE_URL: '' });

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('no existe fallback a db.sqlite');
	});
});
