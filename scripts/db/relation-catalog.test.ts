import { afterEach, describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FLEXIBLE_RELATION_CATALOG, STRONG_RELATION_CATALOG } from "../../src/lib/drizzle/schema/relations/catalog";
import { migrateDatabase } from "./migrations";

const temporaryDirectories: string[] = [];

afterEach(async () => {
	Bun.gc(true);
	await Bun.sleep(50);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

async function createDatabase(): Promise<Database> {
	const directory = await mkdtemp(join(tmpdir(), "media-manager-relation-catalog-"));
	temporaryDirectories.push(directory);
	const databasePath = join(directory, "catalog.sqlite");
	await migrateDatabase({ databasePath });
	return new Database(databasePath, { strict: true });
}

describe("canonical relation catalog", () => {
	it("covers every live authored junction exactly once", async () => {
		const database = await createDatabase();
		const liveJunctions = (
			database
				.query("SELECT name FROM sqlite_master WHERE type='table' AND name GLOB '_*To*' ORDER BY name")
				.all() as Array<{ name: string }>
		).map((row) => row.name);
		const catalogJunctions = STRONG_RELATION_CATALOG.map((relation) => relation.tableName).sort();

		expect(catalogJunctions).toEqual(liveJunctions);
		expect(new Set(catalogJunctions).size).toBe(catalogJunctions.length);
		database.close();
	});

	it("enforces typed endpoints, cascade cleanup, pair uniqueness and inverse indexes", async () => {
		const database = await createDatabase();

		for (const relation of STRONG_RELATION_CATALOG) {
			const foreignKeys = database.query(`PRAGMA foreign_key_list('${relation.tableName}')`).all() as Array<{
				from: string;
				on_delete: string;
				on_update: string;
				table: string;
			}>;
			expect(foreignKeys).toContainEqual(
				expect.objectContaining({
					from: "A",
					on_delete: "CASCADE",
					on_update: "CASCADE",
					table: relation.leftTable,
				}),
			);
			expect(foreignKeys).toContainEqual(
				expect.objectContaining({
					from: "B",
					on_delete: "CASCADE",
					on_update: "CASCADE",
					table: relation.rightTable,
				}),
			);

			const indexes = database.query(`PRAGMA index_list('${relation.tableName}')`).all() as Array<{
				name: string;
				unique: number;
			}>;
			const pairIndex = indexes.find((index) => index.name === `${relation.tableName}_AB_unique`);
			const inverseIndex = indexes.find((index) => index.name === `${relation.tableName}_B_index`);
			expect(pairIndex?.unique).toBe(1);
			expect(inverseIndex?.unique).toBe(0);
			expect(
				(database.query(`PRAGMA index_info('${pairIndex?.name}')`).all() as Array<{ name: string }>).map(
					(column) => column.name,
				),
			).toEqual(["A", "B"]);
			expect(
				(database.query(`PRAGMA index_info('${inverseIndex?.name}')`).all() as Array<{ name: string }>).map(
					(column) => column.name,
				),
			).toEqual(["B"]);
		}

		expect(database.query("PRAGMA foreign_key_check").all()).toEqual([]);
		database.close();
	});

	it("limits flexible targets to an explicit operational catalog", async () => {
		const database = await createDatabase();
		const catalogNames = FLEXIBLE_RELATION_CATALOG.map((relation) => relation.tableName).sort();
		expect(catalogNames).toEqual([
			"Activity",
			"EntityAggregates",
			"Favorite",
			"Metadata",
			"TaxonomyArtifact",
			"Thumbnail",
		]);
		for (const tableName of catalogNames) {
			expect(database.query("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName)).toEqual({
				name: tableName,
			});
		}
		database.close();
	});
});
