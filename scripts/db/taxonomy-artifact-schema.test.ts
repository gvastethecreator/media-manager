import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrateDatabase } from './migrations';

const temporaryDirectories: string[] = [];

async function createDatabase(): Promise<Database> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-taxonomy-schema-'));
	temporaryDirectories.push(directory);
	const databasePath = join(directory, 'taxonomy.sqlite');
	await migrateDatabase({ databasePath });
	const database = new Database(databasePath, { strict: true });
	database.exec('PRAGMA foreign_keys = ON');
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
	}
): void {
	database
		.query(
			`INSERT INTO TaxonomyArtifact(
				entityType, entityId, rootId, relativePath, contentHash, byteSize,
				syncStatus, indexedTitle, indexedBody
			) VALUES (?, ?, ?, ?, ?, 4, 'synced', 'Title', 'Body')`
		)
		.run(
			values.entityType ?? 'note',
			values.entityId ?? crypto.randomUUID(),
			values.rootId ?? 'taxonomy-root',
			values.relativePath ?? `taxonomy/notes/${crypto.randomUUID()}.md`,
			values.contentHash ?? 'a'.repeat(64)
		);
}

afterEach(async () => {
	Bun.gc(true);
	await Bun.sleep(50);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('TaxonomyArtifact migration contract', () => {
	it('creates the operational projection with a restrictive root and case-insensitive location identity', async () => {
		const database = await createDatabase();
		try {
			expect(
				(database.query("PRAGMA table_info('Wildcard')").all() as Array<{ name: string }>).map((column) => column.name)
			).toContain('shortcut');
			database.query('INSERT INTO MediaRoot(id, label) VALUES (?, ?)').run('taxonomy-root', 'Taxonomy');
			insertArtifact(database, { entityId: 'note-1', relativePath: 'taxonomy/notes/Case.md' });
			expect(database.query('SELECT authoredMetadata FROM TaxonomyArtifact WHERE entityId = ?').get('note-1')).toEqual({
				authoredMetadata: '{}',
			});
			expect(() => insertArtifact(database, { entityId: 'note-2', relativePath: 'taxonomy/notes/case.md' })).toThrow();
			expect(() => database.query('DELETE FROM MediaRoot WHERE id = ?').run('taxonomy-root')).toThrow();
			database.query('UPDATE MediaRoot SET id = ? WHERE id = ?').run('taxonomy-renamed', 'taxonomy-root');
			expect(database.query('SELECT rootId FROM TaxonomyArtifact WHERE entityId = ?').get('note-1')).toEqual({
				rootId: 'taxonomy-renamed',
			});
			database.query('INSERT INTO MediaRoot(id, label) VALUES (?, ?)').run('taxonomy-ledger-root', 'Ledger');
			database
				.query(
					`INSERT INTO TaxonomyArtifactDeletionLedger(
						rootId, relativePath, entityType, entityId, contentHash, nonce
					) VALUES (?, ?, 'note', 'deleted-note', ?, ?)`
				)
				.run(
					'taxonomy-ledger-root',
					'taxonomy/notes/deleted-note.md',
					'b'.repeat(64),
					'123e4567-e89b-42d3-a456-426614174000'
				);
			database.query('UPDATE MediaRoot SET id = ? WHERE id = ?').run('taxonomy-ledger-renamed', 'taxonomy-ledger-root');
			expect(database.query('SELECT rootId FROM TaxonomyArtifactDeletionLedger').get()).toEqual({
				rootId: 'taxonomy-ledger-renamed',
			});
			database.query('DELETE FROM MediaRoot WHERE id = ?').run('taxonomy-ledger-renamed');
			expect(database.query('SELECT count(*) AS count FROM TaxonomyArtifactDeletionLedger').get()).toEqual({
				count: 0,
			});
			expect(database.query('PRAGMA foreign_key_check').all()).toEqual([]);
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('rejects invalid polymorphic types, hashes, paths and storage classes', async () => {
		const database = await createDatabase();
		try {
			database.query('INSERT INTO MediaRoot(id, label) VALUES (?, ?)').run('taxonomy-root', 'Taxonomy');
			expect(() => insertArtifact(database, { entityType: 'image' })).toThrow();
			expect(() => insertArtifact(database, { contentHash: 'not-a-hash' })).toThrow();
			expect(() => insertArtifact(database, { relativePath: '../escape.md' })).toThrow();
			expect(() => insertArtifact(database, { relativePath: 'taxonomy/prompts/wrong-family.md' })).toThrow();
			expect(() => insertArtifact(database, { relativePath: 'taxonomy/notes/nested/file.md' })).toThrow();
			expect(() => insertArtifact(database, { relativePath: 'taxonomy/notes/con.md' })).toThrow();
			expect(() => insertArtifact(database, { relativePath: 'taxonomy/notes/con.backup.md' })).toThrow();
			expect(() => insertArtifact(database, { relativePath: 'taxonomy/notes/lpt1.foo.md' })).toThrow();
			expect(() => insertArtifact(database, { relativePath: 'taxonomy/notes/.md' })).toThrow();
			expect(() => insertArtifact(database, { relativePath: 'taxonomy/notes/-bad.md' })).toThrow();
			expect(() => insertArtifact(database, { relativePath: `taxonomy/notes/${'a'.repeat(129)}.md` })).toThrow();
			insertArtifact(database, {
				entityId: 'note-max-portable',
				relativePath: `taxonomy/notes/${'a'.repeat(128)}.md`,
			});
			expect(() => insertArtifact(database, { entityId: '../invalid' })).toThrow();
			expect(() =>
				database
					.query(
						`INSERT INTO TaxonomyArtifact(
							entityType, entityId, rootId, relativePath, contentHash, byteSize,
							syncStatus, indexedTitle, indexedBody, authoredMetadata
						) VALUES ('note', 'note-invalid-metadata', 'taxonomy-root', 'taxonomy/notes/metadata.md', ?, 4,
							'synced', 'Title', 'Body', '[]')`
					)
					.run('c'.repeat(64))
			).toThrow();
			expect(() =>
				database
					.query(
						`INSERT INTO TaxonomyArtifact(
							entityType, entityId, rootId, relativePath, contentHash, byteSize,
							syncStatus, indexedTitle, indexedBody
						) VALUES ('note', 'note-real-size', 'taxonomy-root', 'taxonomy/notes/real.md', ?, 1.5,
							'synced', 'Title', 'Body')`
					)
					.run('b'.repeat(64))
			).toThrow();
			expect(() =>
				database
					.query(
						`INSERT INTO TaxonomyArtifactDeletionLedger(
							rootId, relativePath, entityType, entityId, contentHash, nonce
						) VALUES ('taxonomy-root', 'taxonomy/notes/deleted.md', 'image', 'deleted-note', ?, ?)`
					)
					.run('d'.repeat(64), '123e4567-e89b-42d3-a456-426614174000')
			).toThrow();
			expect(() =>
				database
					.query(
						`INSERT INTO TaxonomyArtifactDeletionLedger(
							rootId, relativePath, entityType, entityId, contentHash, nonce
						) VALUES ('taxonomy-root', '../escape.md', 'note', 'deleted-note', ?, ?)`
					)
					.run('d'.repeat(64), '123e4567-e89b-42d3-a456-426614174000')
			).toThrow();
			expect(() =>
				database
					.query(
						`INSERT INTO TaxonomyArtifactDeletionLedger(
							rootId, relativePath, entityType, entityId, contentHash, nonce
						) VALUES ('taxonomy-root', 'taxonomy/notes/deleted.md', 'note', 'deleted-note', ?, 'not-a-nonce')`
					)
					.run('d'.repeat(64))
			).toThrow();
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('blocks inline entity updates and deletes unless the canonical transaction owns an explicit permit', async () => {
		const database = await createDatabase();
		try {
			database.query('INSERT INTO MediaRoot(id, label) VALUES (?, ?)').run('taxonomy-root', 'Taxonomy');
			const families = [
				{ entityType: 'note', table: 'Note', titleColumn: 'title', directory: 'notes' },
				{ entityType: 'prompt', table: 'Prompt', titleColumn: 'name', directory: 'prompts' },
				{ entityType: 'wildcard', table: 'Wildcard', titleColumn: 'name', directory: 'wildcards' },
			] as const;
			for (const family of families) {
				const entityId = `${family.entityType}-guarded`;
				database.query(`INSERT INTO ${family.table}(id, ${family.titleColumn}) VALUES (?, ?)`).run(entityId, 'Guarded');
				insertArtifact(database, {
					entityId,
					entityType: family.entityType,
					relativePath: `taxonomy/${family.directory}/${entityId}.md`,
				});
				expect(() =>
					database.query(`UPDATE ${family.table} SET ${family.titleColumn} = ? WHERE id = ?`).run('Bypass', entityId)
				).toThrow(/ARTIFACT_FILE_BACKED/);
				expect(() => database.query(`DELETE FROM ${family.table} WHERE id = ?`).run(entityId)).toThrow(
					/ARTIFACT_FILE_BACKED/
				);
			}

			database
				.query(
					"INSERT INTO TaxonomyArtifactMutationPermit(entityType, entityId, operation) VALUES ('note', 'note-guarded', 'update')"
				)
				.run();
			database.query("UPDATE Note SET title = 'Canonical' WHERE id = 'note-guarded'").run();
			expect(database.query("SELECT title FROM Note WHERE id = 'note-guarded'").get()).toEqual({
				title: 'Canonical',
			});
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});
});
