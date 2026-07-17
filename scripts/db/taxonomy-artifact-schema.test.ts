import { afterEach, describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrateDatabase } from "./migrations";

const temporaryDirectories: string[] = [];

async function createDatabase(): Promise<Database> {
	const directory = await mkdtemp(join(tmpdir(), "media-manager-taxonomy-schema-"));
	temporaryDirectories.push(directory);
	const databasePath = join(directory, "taxonomy.sqlite");
	await migrateDatabase({ databasePath });
	const database = new Database(databasePath, { strict: true });
	database.exec("PRAGMA foreign_keys = ON");
	return database;
}

function insertArtifact(
	database: Database,
	values: {
		contentHash?: string;
		entityId?: string;
		entityType?: string;
		relativePath?: string;
		rootId?: string;
	},
): void {
	database
		.query(
			`INSERT INTO TaxonomyArtifact(
				entityType, entityId, rootId, relativePath, contentHash, byteSize,
				syncStatus, indexedTitle, indexedBody
			) VALUES (?, ?, ?, ?, ?, 4, 'synced', 'Title', 'Body')`,
		)
		.run(
			values.entityType ?? "note",
			values.entityId ?? crypto.randomUUID(),
			values.rootId ?? "taxonomy-root",
			values.relativePath ?? `taxonomy/notes/${crypto.randomUUID()}.md`,
			values.contentHash ?? "a".repeat(64),
		);
}

afterEach(async () => {
	Bun.gc(true);
	await Bun.sleep(50);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe("TaxonomyArtifact migration contract", () => {
	it("creates the operational projection with a restrictive root and case-insensitive location identity", async () => {
		const database = await createDatabase();
		try {
			expect(
				(database.query("PRAGMA table_info('Wildcard')").all() as Array<{ name: string }>).map((column) => column.name),
			).toContain("shortcut");
			database.query("INSERT INTO MediaRoot(id, label) VALUES (?, ?)").run("taxonomy-root", "Taxonomy");
			insertArtifact(database, { entityId: "note-1", relativePath: "taxonomy/notes/Case.md" });
			expect(() => insertArtifact(database, { entityId: "note-2", relativePath: "taxonomy/notes/case.md" })).toThrow();
			expect(() => database.query("DELETE FROM MediaRoot WHERE id = ?").run("taxonomy-root")).toThrow();
			database.query("UPDATE MediaRoot SET id = ? WHERE id = ?").run("taxonomy-renamed", "taxonomy-root");
			expect(database.query("SELECT rootId FROM TaxonomyArtifact WHERE entityId = ?").get("note-1")).toEqual({
				rootId: "taxonomy-renamed",
			});
			expect(database.query("PRAGMA foreign_key_check").all()).toEqual([]);
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it("rejects invalid polymorphic types, hashes, paths and storage classes", async () => {
		const database = await createDatabase();
		try {
			database.query("INSERT INTO MediaRoot(id, label) VALUES (?, ?)").run("taxonomy-root", "Taxonomy");
			expect(() => insertArtifact(database, { entityType: "image" })).toThrow();
			expect(() => insertArtifact(database, { contentHash: "not-a-hash" })).toThrow();
			expect(() => insertArtifact(database, { relativePath: "../escape.md" })).toThrow();
			expect(() =>
				database
					.query(
						`INSERT INTO TaxonomyArtifact(
							entityType, entityId, rootId, relativePath, contentHash, byteSize,
							syncStatus, indexedTitle, indexedBody
						) VALUES ('note', 'note-real-size', 'taxonomy-root', 'taxonomy/notes/real.md', ?, 1.5,
							'synced', 'Title', 'Body')`,
					)
					.run("b".repeat(64)),
			).toThrow();
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});
});
