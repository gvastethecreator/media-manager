import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { checkDatabase, migrateDatabase } from './migrations';
import {
	assertDisposableLocation,
	DISPOSABLE_DATABASE_APPLICATION_ID,
	markDisposableDatabase,
	resetDisposableDatabase,
} from './reset';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) await rm(directory, { force: true, recursive: true });
});

describe('disposable database reset guard', () => {
	it('resets only an explicitly marked temp database and recreates canonical migrations', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-disposable-reset-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'disposable.sqlite');
		await migrateDatabase({ databasePath });
		await markDisposableDatabase(databasePath);
		const database = new Database(databasePath);
		database.exec("INSERT INTO Profile(id, name) VALUES ('remove-me', 'Disposable')");
		database.close();

		await resetDisposableDatabase(databasePath);
		const reset = new Database(databasePath, { readonly: true });
		expect(reset.query('SELECT count(*) AS count FROM Profile').get()).toEqual({ count: 0 });
		expect(Number(Object.values(reset.query('PRAGMA application_id').get() as Record<string, unknown>)[0])).toBe(
			DISPOSABLE_DATABASE_APPLICATION_ID
		);
		reset.close();
		expect((await checkDatabase({ databasePath })).healthy).toBe(true);
	});

	it('refuses unmarked databases and the workspace db.sqlite path', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-unmarked-reset-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'unmarked.sqlite');
		await migrateDatabase({ databasePath });

		await expect(resetDisposableDatabase(databasePath)).rejects.toThrow('no tiene el marker disposable');
		expect(() => assertDisposableLocation(resolve(process.cwd(), 'db.sqlite'))).toThrow('db.sqlite real nunca');
		expect(existsSync(databasePath)).toBe(true);
	});

	it('keeps Studio explicit and loopback-only and removes obsolete destructive scripts', async () => {
		const studio = await readFile(resolve(process.cwd(), 'scripts/db/studio.js'), 'utf8');
		expect(studio).toContain('values.database');
		expect(studio).toContain("'127.0.0.1'");
		expect(studio).not.toContain("'dev.db'");
		for (const retired of ['clean-and-seed.ts', 'hard-clean.ts', 'seed-drizzle.ts']) {
			expect(existsSync(resolve(process.cwd(), 'scripts/db', retired))).toBe(false);
		}
	});
});
