import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportDatabaseSchema } from './export-schema';
import { migrateDatabase, MIGRATION_TABLE } from './migrations';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 20, recursive: true, retryDelay: 100 });
	}
});

describe('representative schema export', () => {
	it('exports DDL only and omits source paths, migration history and row data', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-schema-export-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'representative.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath, { strict: true });
		try {
			database
				.query(
					`INSERT INTO "Profile" ("id", "name", "emoji", "color", "isActive", "createdAt", "updatedAt")
					 VALUES (?, ?, ?, ?, ?, ?, ?)`
				)
				.run('schema-export-profile', 'private-row-value', 'P', '#000000', 0, 1, 1);
			database.exec(`DROP TABLE ${MIGRATION_TABLE}`);
			database.exec('CREATE TABLE "Task" ("id" text PRIMARY KEY, "title" text NOT NULL)');
		} finally {
			database.clearQueryCache();
			database.close();
		}

		const ddl = await exportDatabaseSchema(databasePath);

		expect(ddl).toMatch(/CREATE TABLE ["`]Profile["`]/);
		expect(ddl).toContain('CREATE TABLE "Task"');
		expect(ddl).not.toContain('private-row-value');
		expect(ddl).not.toContain(databasePath);
		expect(ddl).not.toContain(MIGRATION_TABLE);
	});

	it('fails closed when the copy contains unknown schema objects', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-schema-export-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'unknown.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.exec('CREATE TABLE "unknown_personal_extension" ("id" text PRIMARY KEY)');
		database.clearQueryCache();
		database.close();

		await expect(exportDatabaseSchema(databasePath)).rejects.toThrow('objetos desconocidos');
	});

	it('never overwrites the input database when output resolves to the same file', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-schema-export-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'input.sqlite');
		await migrateDatabase({ databasePath });
		const headerBefore = (await readFile(databasePath)).subarray(0, 16).toString('utf8');
		const child = Bun.spawn(
			[
				process.execPath,
				join(import.meta.dir, 'export-schema.ts'),
				'--database',
				databasePath,
				'--output',
				databasePath,
			],
			{ stderr: 'pipe', stdout: 'pipe' }
		);
		const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);

		expect(exitCode).toBe(1);
		expect(stderr).toContain('no será sobrescrito');
		expect((await readFile(databasePath)).subarray(0, 16).toString('utf8')).toBe(headerBefore);
		expect(headerBefore).toBe('SQLite format 3\0');
	});
});
