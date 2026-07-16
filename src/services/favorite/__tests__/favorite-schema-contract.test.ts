import { beforeEach, describe, expect, it } from 'vitest';
import { getDbClient } from '@/lib/drizzle';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { favoriteService } from '../favorite.service';

describe('Favorite schema contract', () => {
	beforeEach(async () => {
		const client = getDbClient();
		if (!client) {
			throw new Error('Expected an initialized test database client.');
		}
		await client.execute('DROP TABLE IF EXISTS "Favorite"');
		await client.execute(`
			CREATE TABLE "Favorite" (
				"id" text PRIMARY KEY NOT NULL,
				"profileId" text NOT NULL,
				"entityType" text NOT NULL,
				"entityId" text NOT NULL,
				"addedAt" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
			)
		`);
		await client.execute(`
			CREATE UNIQUE INDEX "Favorite_profileId_entityType_entityId_key"
			ON "Favorite" ("profileId", "entityType", "entityId")
		`);
	});

	it('rejects a legacy schema from a read without mutating or assigning ownership', async () => {
		const client = getDbClient();
		expect(client).not.toBeNull();
		await client!.execute('DROP TABLE "Favorite"');
		await client!.execute(`
			CREATE TABLE "Favorite" (
				"id" text PRIMARY KEY NOT NULL,
				"entityType" text NOT NULL,
				"entityId" text NOT NULL,
				"addedAt" integer NOT NULL
			)
		`);
		await client!.execute(
			`INSERT INTO "Profile" ("id", "name", "isActive", "createdAt") VALUES
			 ('legacy-profile-a', 'A', 1, 1),
			 ('legacy-profile-b', 'B', 1, 1)`
		);
		await client!.execute(
			`INSERT INTO "Favorite" ("id", "entityType", "entityId", "addedAt")
			 VALUES ('legacy-favorite', 'image', 'legacy-image', 1)`
		);
		const schemaBefore = await client!.execute(
			`SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = 'Favorite'`
		);

		await expect(favoriteService.getFavoriteEntityIds(FavoriteEntityType.IMAGE)).rejects.toThrow(
			'El schema Favorite no es canónico'
		);

		const [schemaAfter, columnsAfter, rowsAfter] = await Promise.all([
			client!.execute(`SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = 'Favorite'`),
			client!.execute('PRAGMA table_info("Favorite")'),
			client!.execute('SELECT count(*) AS count FROM "Favorite"'),
		]);
		expect(schemaAfter.rows).toEqual(schemaBefore.rows);
		expect(columnsAfter.rows.some((row) => (row as { name?: string }).name === 'profileId')).toBe(false);
		expect(Number((rowsAfter.rows[0] as unknown as { count: number }).count)).toBe(1);
	});

	it('rejects a canonically named unique index when its columns are not canonical', async () => {
		const client = getDbClient();
		expect(client).not.toBeNull();
		await client!.execute('DROP INDEX "Favorite_profileId_entityType_entityId_key"');
		await client!.execute(`
			CREATE UNIQUE INDEX "Favorite_profileId_entityType_entityId_key"
			ON "Favorite" ("entityId")
		`);
		const indexBefore = await client!.execute('PRAGMA index_xinfo("Favorite_profileId_entityType_entityId_key")');

		await expect(favoriteService.getFavoriteEntityIds(FavoriteEntityType.IMAGE)).rejects.toThrow(
			'El schema Favorite no es canónico'
		);

		const indexAfter = await client!.execute('PRAGMA index_xinfo("Favorite_profileId_entityType_entityId_key")');
		expect(indexAfter.rows).toEqual(indexBefore.rows);
		expect(
			indexAfter.rows
				.filter((row) => Number((row as { key?: number }).key) === 1)
				.map((row) => (row as { name?: string }).name)
		).toEqual(['entityId']);
	});
});
