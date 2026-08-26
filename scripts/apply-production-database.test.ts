import { describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyProductionDatabaseMigrations } from './apply-production-database';
import { resolveLogDirectory } from '../src/lib/logger/log-directory';

const workspaceRoot = resolve(import.meta.dir, '..');

describe('applyProductionDatabaseMigrations', () => {
	it('applies versioned migrations to an empty packaged library before serve', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-prod-migrate-'));
		const databasePath = join(dir, 'library.sqlite');
		const result = await applyProductionDatabaseMigrations({
			DATABASE_URL: pathToFileURL(databasePath).href,
			MEDIA_MANAGER_MIGRATIONS_DIR: resolve(workspaceRoot, 'src/lib/drizzle/migrations'),
			MEDIA_MANAGER_SCHEMA_CONTRACT: resolve(workspaceRoot, 'src/lib/drizzle/schema-contract.json'),
		});
		expect(result.applied.length).toBeGreaterThan(0);
		expect(result.skipped).toEqual([]);
		const database = new Database(databasePath, { readonly: true });
		try {
			const favorite = database.query('PRAGMA table_info("Favorite")').all() as Array<{ name: string }>;
			expect(favorite.some((column) => column.name === 'profileId')).toBe(true);
			expect(favorite.some((column) => column.name === 'entityType')).toBe(true);
			const history = database.query('SELECT COUNT(*) AS count FROM __media_manager_migrations').get() as {
				count: number;
			};
			expect(history.count).toBe(result.applied.length);
		} finally {
			database.close();
		}
	});

	it('resolves desktop logs away from the install directory when MEDIA_MANAGER_LOG_DIR is set', () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-logs-'));
		expect(resolveLogDirectory({ MEDIA_MANAGER_LOG_DIR: dir })).toBe(dir);
		expect(resolveLogDirectory({}, 'C:\\install\\extra-resources')).toBe(join('C:\\install\\extra-resources', 'logs'));
	});

	it('keeps start-production on the shipped migrate function before spawn', async () => {
		const source = await readFile(resolve(workspaceRoot, 'scripts/start-production.ts'), 'utf8');
		expect(source).toContain('applyProductionDatabaseMigrations');
		expect(source.indexOf('applyProductionDatabaseMigrations')).toBeLessThan(source.indexOf('Bun.spawn'));
	});
});
