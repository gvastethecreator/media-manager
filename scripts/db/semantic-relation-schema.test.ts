import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MIGRATIONS_DIRECTORY, migrateDatabase } from './migrations';

const temporaryDirectories: string[] = [];
const endpointTypes = [
	'asset',
	'folder',
	'album',
	'collection',
	'group',
	'character',
	'place',
	'concept',
	'world_item',
	'prompt',
	'note',
	'wildcard',
] as const;
type EndpointType = (typeof endpointTypes)[number];

async function createDatabase(): Promise<Database> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-semantic-schema-'));
	temporaryDirectories.push(directory);
	const databasePath = join(directory, 'semantic.sqlite');
	await migrateDatabase({ databasePath });
	const database = new Database(databasePath, { strict: true });
	database.exec('PRAGMA foreign_keys = ON');
	return database;
}

function insertNote(database: Database, id: string): void {
	database.query('INSERT INTO Note(id, title) VALUES (?, ?)').run(id, id);
}

function insertRelation(
	database: Database,
	input: { id: string; roleSlug?: string | null; sourceId: string; targetId: string }
): void {
	const roleSlug = input.roleSlug ?? null;
	database
		.query(
			`INSERT INTO SemanticRelation(id, sourceType, sourceId, targetType, targetId, roleSlug, roleKey)
			 VALUES (?, 'note', ?, 'note', ?, ?, ?)`
		)
		.run(input.id, input.sourceId, input.targetId, roleSlug, roleSlug ?? '');
}

function insertTypedRelation(
	database: Database,
	input: {
		id: string;
		roleSlug?: string | null;
		sourceId: string;
		sourceType: EndpointType;
		targetId: string;
		targetType: EndpointType;
	}
): void {
	const roleSlug = input.roleSlug ?? null;
	database
		.query(
			`INSERT INTO SemanticRelation(id, sourceType, sourceId, targetType, targetId, roleSlug, roleKey)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.run(input.id, input.sourceType, input.sourceId, input.targetType, input.targetId, roleSlug, roleSlug ?? '');
}

function insertAsset(database: Database, id: string, assetType: 'image' | 'video' = 'image'): void {
	database
		.query("INSERT OR IGNORE INTO MediaRoot(id, label) VALUES ('semantic-schema-root', 'Semantic schema root')")
		.run();
	database.exec('BEGIN');
	try {
		database
			.query('INSERT INTO Asset(id, assetType, primarySourceFileId) VALUES (?, ?, ?)')
			.run(id, assetType, `source-${id}`);
		database
			.query(
				`INSERT INTO SourceFile(id, assetId, rootId, relativePath, contentHash, byteSize, availability)
				 VALUES (?, ?, 'semantic-schema-root', ?, ?, 1, 'available')`
			)
			.run(`source-${id}`, id, `semantic/${id}.${assetType === 'image' ? 'png' : 'mp4'}`, 'a'.repeat(64));
		database.exec('COMMIT');
	} catch (error) {
		database.exec('ROLLBACK');
		throw error;
	}
}

function insertEndpoint(database: Database, type: EndpointType, id: string): void {
	switch (type) {
		case 'asset':
			insertAsset(database, id);
			return;
		case 'folder':
			database.query('INSERT INTO Folder(id, name, path) VALUES (?, ?, ?)').run(id, id, `/${id}`);
			return;
		case 'album':
			database.query('INSERT INTO Album(id, name) VALUES (?, ?)').run(id, id);
			return;
		case 'collection':
			database.query('INSERT INTO Collection(id, name) VALUES (?, ?)').run(id, id);
			return;
		case 'group':
			database.query('INSERT INTO `Group`(id, name) VALUES (?, ?)').run(id, id);
			return;
		case 'character':
			database.query('INSERT INTO Character(id, name) VALUES (?, ?)').run(id, id);
			return;
		case 'place':
			database.query('INSERT INTO Place(id, name) VALUES (?, ?)').run(id, id);
			return;
		case 'concept':
			database.query('INSERT INTO Concept(id, name) VALUES (?, ?)').run(id, id);
			return;
		case 'world_item':
			database.query('INSERT INTO WorldItem(id, name) VALUES (?, ?)').run(id, id);
			return;
		case 'prompt':
			database.query('INSERT INTO Prompt(id, name) VALUES (?, ?)').run(id, id);
			return;
		case 'note':
			insertNote(database, id);
			return;
		case 'wildcard':
			database.query('INSERT INTO Wildcard(id, name) VALUES (?, ?)').run(id, id);
	}
}

function deleteEndpoint(database: Database, type: EndpointType, id: string): void {
	if (type === 'asset') {
		database.exec('BEGIN');
		try {
			database.exec('PRAGMA defer_foreign_keys = ON');
			database.query('DELETE FROM Asset WHERE id = ?').run(id);
			database.query('DELETE FROM SourceFile WHERE assetId = ?').run(id);
			database.exec('COMMIT');
		} catch (error) {
			database.exec('ROLLBACK');
			throw error;
		}
		return;
	}
	const tables: Record<Exclude<EndpointType, 'asset'>, string> = {
		album: 'Album',
		character: 'Character',
		collection: 'Collection',
		concept: 'Concept',
		folder: 'Folder',
		group: 'Group',
		note: 'Note',
		place: 'Place',
		prompt: 'Prompt',
		wildcard: 'Wildcard',
		world_item: 'WorldItem',
	};
	database.query(`DELETE FROM \`${tables[type]}\` WHERE id = ?`).run(id);
}

async function writeJournal(migrationDirectory: string, tags: string[]): Promise<void> {
	await mkdir(join(migrationDirectory, 'meta'), { recursive: true });
	await writeFile(
		join(migrationDirectory, 'meta', '_journal.json'),
		JSON.stringify({ dialect: 'sqlite', entries: tags.map((tag, idx) => ({ idx, tag })), version: '7' }),
		'utf8'
	);
}

afterEach(async () => {
	Bun.gc(true);
	await Bun.sleep(50);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('SemanticRelation migration contract', () => {
	it('seeds the complete governed vocabulary and enforces normalized logical identity', async () => {
		const database = await createDatabase();
		try {
			expect(
				database
					.query(
						`SELECT slug, forwardLabel, inverseLabel, isSymmetric, allowSelf, deprecatedAt, replacementSlug
						 FROM RelationRole ORDER BY slug`
					)
					.all()
			).toEqual([
				{
					allowSelf: 0,
					deprecatedAt: null,
					forwardLabel: 'derived_from',
					inverseLabel: 'source_for',
					isSymmetric: 0,
					replacementSlug: null,
					slug: 'derived_from',
				},
				{
					allowSelf: 0,
					deprecatedAt: null,
					forwardLabel: 'inspired_by',
					inverseLabel: 'inspires',
					isSymmetric: 0,
					replacementSlug: null,
					slug: 'inspired_by',
				},
				{
					allowSelf: 0,
					deprecatedAt: null,
					forwardLabel: 'references',
					inverseLabel: 'referenced_by',
					isSymmetric: 0,
					replacementSlug: null,
					slug: 'references',
				},
				{
					allowSelf: 0,
					deprecatedAt: null,
					forwardLabel: 'variant_of',
					inverseLabel: 'variant_of',
					isSymmetric: 1,
					replacementSlug: null,
					slug: 'variant_of',
				},
			]);
			const applicability = database
				.query(
					`SELECT roleSlug, sourceFamily, targetFamily FROM RelationRoleApplicability
					 ORDER BY roleSlug, sourceFamily, targetFamily`
				)
				.all() as Array<{ roleSlug: string; sourceFamily: string; targetFamily: string }>;
			const families = ['asset', 'narrative_entity', 'note', 'organizer', 'prompt', 'wildcard'];
			const expectedApplicability: typeof applicability = [];
			for (const roleSlug of ['derived_from', 'inspired_by', 'references']) {
				for (const sourceFamily of families) {
					for (const targetFamily of families) expectedApplicability.push({ roleSlug, sourceFamily, targetFamily });
				}
			}
			for (const family of families) {
				expectedApplicability.push({ roleSlug: 'variant_of', sourceFamily: family, targetFamily: family });
			}
			expect(applicability).toHaveLength(114);
			expect(applicability).toEqual(expectedApplicability);
			expect(
				database
					.query('SELECT leftRoleSlug, rightRoleSlug FROM RelationRoleConflict ORDER BY leftRoleSlug, rightRoleSlug')
					.all()
			).toEqual([{ leftRoleSlug: 'derived_from', rightRoleSlug: 'variant_of' }]);
			insertNote(database, 'note-a');
			insertNote(database, 'note-c');
			insertNote(database, 'note-d');
			insertNote(database, 'note-z');
			insertNote(database, 'Z');
			insertNote(database, 'a');
			database.query('INSERT INTO Prompt(id, name) VALUES (?, ?)').run('prompt-a', 'Prompt A');
			expect(() =>
				database
					.query(
						`INSERT INTO SemanticRelation(id, sourceType, sourceId, targetType, targetId, roleSlug, roleKey)
						 VALUES ('rel-cross-variant', 'note', 'note-a', 'prompt', 'prompt-a', 'variant_of', 'variant_of')`
					)
					.run()
			).toThrow();
			expect(() =>
				database
					.query(
						`INSERT INTO SemanticRelation(id, sourceType, sourceId, targetType, targetId, roleSlug, roleKey)
						 VALUES ('rel-missing', 'note', 'note-a', 'note', 'missing', 'references', 'references')`
					)
					.run()
			).toThrow();
			expect(() =>
				insertRelation(database, {
					id: 'rel-reversed',
					roleSlug: 'variant_of',
					sourceId: 'note-z',
					targetId: 'note-a',
				})
			).toThrow();
			insertRelation(database, { id: 'rel-bare', sourceId: 'note-a', targetId: 'note-z' });
			insertRelation(database, { id: 'rel-bare-reverse', sourceId: 'note-z', targetId: 'note-a' });
			insertRelation(database, { id: 'rel-bare-directed', sourceId: 'note-c', targetId: 'note-d' });
			insertRelation(database, {
				id: 'rel-role-opposite-direction',
				roleSlug: 'references',
				sourceId: 'note-d',
				targetId: 'note-c',
			});
			expect(() =>
				insertRelation(database, {
					id: 'rel-role-same-direction',
					roleSlug: 'references',
					sourceId: 'note-c',
					targetId: 'note-d',
				})
			).toThrow();
			expect(() =>
				database.query("UPDATE SemanticRelation SET targetId = 'missing' WHERE id = 'rel-bare'").run()
			).toThrow();
			expect(() =>
				insertRelation(database, { id: 'rel-bare-duplicate', sourceId: 'note-a', targetId: 'note-z' })
			).toThrow();
			insertRelation(database, { id: 'rel-binary', roleSlug: 'variant_of', sourceId: 'Z', targetId: 'a' });
			expect(() =>
				insertRelation(database, { id: 'rel-binary-reversed', roleSlug: 'variant_of', sourceId: 'a', targetId: 'Z' })
			).toThrow();
			expect(database.query('PRAGMA foreign_key_check').all()).toEqual([]);
		} finally {
			database.close();
		}
	});

	it('enforces concrete Asset variants, tombstone revalidation and governed symmetric self-links', async () => {
		const database = await createDatabase();
		try {
			insertAsset(database, 'asset-image-a', 'image');
			insertAsset(database, 'asset-image-b', 'image');
			insertAsset(database, 'asset-video', 'video');
			insertNote(database, 'asset-anchor');
			expect(() =>
				insertTypedRelation(database, {
					id: 'rel-cross-media-variant',
					roleSlug: 'variant_of',
					sourceId: 'asset-image-a',
					sourceType: 'asset',
					targetId: 'asset-video',
					targetType: 'asset',
				})
			).toThrow();
			insertTypedRelation(database, {
				id: 'rel-image-variant',
				roleSlug: 'variant_of',
				sourceId: 'asset-image-a',
				sourceType: 'asset',
				targetId: 'asset-image-b',
				targetType: 'asset',
			});
			insertTypedRelation(database, {
				id: 'rel-tombstone',
				roleSlug: 'references',
				sourceId: 'asset-video',
				sourceType: 'asset',
				targetId: 'asset-anchor',
				targetType: 'note',
			});
			database
				.query(
					"UPDATE Asset SET status = 'deleted', statusBeforeDeletion = 'active', deletedAt = createdAt WHERE id = 'asset-video'"
				)
				.run();
			expect(() =>
				database
					.query(
						"UPDATE SemanticRelation SET roleSlug = 'inspired_by', roleKey = 'inspired_by' WHERE id = 'rel-tombstone'"
					)
					.run()
			).toThrow();

			database
				.query(
					`INSERT INTO RelationRole(slug, forwardLabel, inverseLabel, isSymmetric, allowSelf)
					 VALUES ('test_symmetric_self', 'same_as', 'same_as', 1, 1)`
				)
				.run();
			database
				.query(
					`INSERT INTO RelationRoleApplicability(roleSlug, sourceFamily, targetFamily)
					 VALUES ('test_symmetric_self', 'note', 'note')`
				)
				.run();
			insertTypedRelation(database, {
				id: 'rel-self-allowed',
				roleSlug: 'test_symmetric_self',
				sourceId: 'asset-anchor',
				sourceType: 'note',
				targetId: 'asset-anchor',
				targetType: 'note',
			});
			expect(database.query("SELECT id FROM SemanticRelation WHERE id = 'rel-self-allowed'").all()).toEqual([
				{ id: 'rel-self-allowed' },
			]);
		} finally {
			database.close();
		}
	});

	it('rejects role policy mutations after the role has stored relations', async () => {
		const database = await createDatabase();
		try {
			for (const id of ['note-a', 'note-b', 'note-c', 'note-z']) insertNote(database, id);
			insertRelation(database, {
				id: 'rel-inverse-direction',
				roleSlug: 'references',
				sourceId: 'note-z',
				targetId: 'note-a',
			});
			expect(() =>
				database.query("UPDATE RelationRole SET slug = 'renamed_references' WHERE slug = 'references'").run()
			).toThrow('SEMANTIC_RELATION_ROLE_SLUG_IMMUTABLE');
			expect(() => database.query("UPDATE RelationRole SET isSymmetric = 1 WHERE slug = 'references'").run()).toThrow(
				'SEMANTIC_RELATION_ROLE_POLICY_IN_USE'
			);

			database
				.query(
					`INSERT INTO RelationRole(slug, forwardLabel, inverseLabel, isSymmetric, allowSelf)
					 VALUES ('test_policy_self', 'self', 'self', 1, 1)`
				)
				.run();
			database
				.query(
					`INSERT INTO RelationRoleApplicability(roleSlug, sourceFamily, targetFamily)
					 VALUES ('test_policy_self', 'note', 'note')`
				)
				.run();
			insertRelation(database, {
				id: 'rel-self-policy',
				roleSlug: 'test_policy_self',
				sourceId: 'note-b',
				targetId: 'note-b',
			});
			expect(() =>
				database.query("UPDATE RelationRole SET allowSelf = 0 WHERE slug = 'test_policy_self'").run()
			).toThrow('SEMANTIC_RELATION_ROLE_POLICY_IN_USE');

			database
				.query(
					`INSERT INTO RelationRole(slug, forwardLabel, inverseLabel, isSymmetric, allowSelf)
					 VALUES ('test_policy_applicability', 'applicable_to', 'applicable_from', 0, 0)`
				)
				.run();
			database
				.query(
					`INSERT INTO RelationRoleApplicability(roleSlug, sourceFamily, targetFamily)
					 VALUES ('test_policy_applicability', 'note', 'note')`
				)
				.run();
			insertRelation(database, {
				id: 'rel-applicability-policy',
				roleSlug: 'test_policy_applicability',
				sourceId: 'note-a',
				targetId: 'note-c',
			});
			expect(() =>
				database
					.query(
						"UPDATE RelationRoleApplicability SET targetFamily = 'prompt' WHERE roleSlug = 'test_policy_applicability' AND sourceFamily = 'note' AND targetFamily = 'note'"
					)
					.run()
			).toThrow('SEMANTIC_RELATION_ROLE_POLICY_IN_USE');
			expect(() =>
				database
					.query(
						"DELETE FROM RelationRoleApplicability WHERE roleSlug = 'test_policy_applicability' AND sourceFamily = 'note' AND targetFamily = 'note'"
					)
					.run()
			).toThrow('SEMANTIC_RELATION_ROLE_POLICY_IN_USE');

			expect(() =>
				database
					.query(
						"INSERT INTO RelationRoleConflict(leftRoleSlug, rightRoleSlug) VALUES ('references', 'test_policy_applicability')"
					)
					.run()
			).toThrow('SEMANTIC_RELATION_ROLE_POLICY_IN_USE');
		} finally {
			database.close();
		}
	});

	it('enforces existence and physical cleanup for every one of the 12 endpoint types', async () => {
		const database = await createDatabase();
		try {
			insertNote(database, 'existence-anchor');
			insertNote(database, 'cleanup-source-anchor');
			insertNote(database, 'cleanup-target-anchor');
			for (const type of endpointTypes) {
				expect(() =>
					insertTypedRelation(database, {
						id: `missing-source-${type}`,
						roleSlug: 'references',
						sourceId: `missing-${type}`,
						sourceType: type,
						targetId: 'existence-anchor',
						targetType: 'note',
					})
				).toThrow();
				expect(() =>
					insertTypedRelation(database, {
						id: `missing-target-${type}`,
						roleSlug: 'references',
						sourceId: 'existence-anchor',
						sourceType: 'note',
						targetId: `missing-${type}`,
						targetType: type,
					})
				).toThrow();

				const endpointId = `cleanup-${type}`;
				insertEndpoint(database, type, endpointId);
				insertTypedRelation(database, {
					id: `cleanup-source-${type}`,
					roleSlug: 'references',
					sourceId: endpointId,
					sourceType: type,
					targetId: 'cleanup-target-anchor',
					targetType: 'note',
				});
				insertTypedRelation(database, {
					id: `cleanup-target-${type}`,
					roleSlug: 'inspired_by',
					sourceId: 'cleanup-source-anchor',
					sourceType: 'note',
					targetId: endpointId,
					targetType: type,
				});
				deleteEndpoint(database, type, endpointId);
				expect(
					database
						.query('SELECT id FROM SemanticRelation WHERE sourceId = ? OR targetId = ?')
						.all(endpointId, endpointId)
				).toEqual([]);
			}
			expect(database.query('PRAGMA foreign_key_check').all()).toEqual([]);
		} finally {
			database.close();
		}
	});

	it('durably upgrades a populated 0009 database through 0010 without rebuilding legacy rows', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-semantic-upgrade-'));
		temporaryDirectories.push(directory);
		const migrationDirectory = join(directory, 'migrations');
		const databasePath = join(directory, 'upgrade.sqlite');
		await mkdir(migrationDirectory);
		const tags = [
			'0000_baseline',
			'0001_relational_integrity',
			'0002_queue_idempotency',
			'0003_epoch_ms_normalization',
			'0004_canonical_asset_source',
			'0005_image_asset_link',
			'0006_media_specialization_asset_links',
			'0007_media_folder_created_indexes',
			'0008_taxonomy_artifact_projection',
			'0009_wildcard_shortcut_projection',
		];
		for (const tag of tags) {
			await copyFile(join(MIGRATIONS_DIRECTORY, `${tag}.sql`), join(migrationDirectory, `${tag}.sql`));
		}
		await writeJournal(migrationDirectory, tags);
		await migrateDatabase({ databasePath, migrationsDirectory: migrationDirectory, validateSchema: false });
		const legacy = new Database(databasePath, { strict: true });
		insertNote(legacy, 'pre-0010-note');
		legacy.query('INSERT INTO MediaRoot(id, label) VALUES (?, ?)').run('pre-0010-root', 'Pre-0010 taxonomy');
		legacy
			.query(
				`INSERT INTO TaxonomyArtifact(
					entityType, entityId, rootId, relativePath, contentHash, byteSize,
					syncStatus, indexedTitle, indexedSummary, indexedBody
				) VALUES ('note', 'pre-0010-note', 'pre-0010-root', 'taxonomy/notes/pre-0010-note.md', ?, 4,
					'synced', 'Pre-0010 note', 'Legacy summary', 'Body')`
			)
			.run('a'.repeat(64));
		legacy.close();

		const finalTag = '0010_semantic_relation_model';
		await copyFile(join(MIGRATIONS_DIRECTORY, `${finalTag}.sql`), join(migrationDirectory, `${finalTag}.sql`));
		await writeJournal(migrationDirectory, [...tags, finalTag]);
		const result = await migrateDatabase({
			allowExistingPending: true,
			databasePath,
			migrationsDirectory: migrationDirectory,
		});
		expect(result.applied).toEqual([`${finalTag}.sql`]);
		expect(result.skipped).toHaveLength(10);
		const upgraded = new Database(databasePath, { readonly: true, strict: true });
		try {
			expect(upgraded.query("SELECT id, title FROM Note WHERE id = 'pre-0010-note'").get()).toEqual({
				id: 'pre-0010-note',
				title: 'pre-0010-note',
			});
			expect(upgraded.query('SELECT count(*) AS count FROM RelationRole').get()).toEqual({ count: 4 });
			expect(upgraded.query('SELECT count(*) AS count FROM RelationRoleApplicability').get()).toEqual({ count: 114 });
			expect(
				upgraded
					.query('SELECT authoredMetadata, indexedSummary FROM TaxonomyArtifact WHERE entityId = ?')
					.get('pre-0010-note')
			).toEqual({ authoredMetadata: '{}', indexedSummary: 'Legacy summary' });
			expect(upgraded.query('PRAGMA user_version').get()).toEqual({ user_version: 11 });
			expect(upgraded.query('PRAGMA foreign_key_check').all()).toEqual([]);
		} finally {
			upgraded.close();
		}
	});

	it('rejects derived cycles and physically cleans relations when an endpoint is purged', async () => {
		const database = await createDatabase();
		try {
			for (const id of ['note-a', 'note-b', 'note-c']) insertNote(database, id);
			insertRelation(database, { id: 'rel-ab', roleSlug: 'derived_from', sourceId: 'note-a', targetId: 'note-b' });
			insertRelation(database, { id: 'rel-bc', roleSlug: 'derived_from', sourceId: 'note-b', targetId: 'note-c' });
			expect(() =>
				insertRelation(database, { id: 'rel-ca', roleSlug: 'derived_from', sourceId: 'note-c', targetId: 'note-a' })
			).toThrow();
			database.query("DELETE FROM Note WHERE id = 'note-b'").run();
			expect(database.query('SELECT id FROM SemanticRelation').all()).toEqual([]);
		} finally {
			database.close();
		}
	});
});
