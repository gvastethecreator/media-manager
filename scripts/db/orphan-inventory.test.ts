import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { migrateDatabase } from './migrations';
import { hasIntegrityFailures, inspectOrphans, RELATION_CATALOG } from './orphan-inventory';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 5, recursive: true, retryDelay: 50 });
	}
});

describe('read-only orphan inventory', () => {
	it('keeps the exact executable catalog cardinality synchronized with its documentation', async () => {
		const direct = RELATION_CATALOG.filter((relation) => relation.kind === 'direct');
		const composite = RELATION_CATALOG.filter((relation) => relation.kind === 'composite');
		const polymorphic = RELATION_CATALOG.filter((relation) => relation.kind === 'polymorphic');
		const junctionEndpoints = direct.filter(
			(relation) => relation.childTable.startsWith('_') && ['A', 'B'].includes(relation.childColumn)
		);
		const junctions = new Set(junctionEndpoints.map((relation) => relation.childTable));
		const expectedMarker = `<!-- relation-catalog-counts: total=${RELATION_CATALOG.length} direct=${direct.length} composite=${composite.length} polymorphic=${polymorphic.length} junctions=${junctions.size} endpoints=${junctionEndpoints.length} -->`;
		const documentation = await readFile(resolve(import.meta.dir, '../../docs/database/RELATION-INVENTORY.md'), 'utf8');

		expect(RELATION_CATALOG).toHaveLength(93);
		expect(direct).toHaveLength(84);
		expect(composite).toHaveLength(1);
		expect(polymorphic).toHaveLength(8);
		expect(junctions.size).toBe(28);
		expect(junctionEndpoints).toHaveLength(56);
		expect(documentation).toContain(expectedMarker);
	});

	it('catalogs conceptual relations and reports only counts plus technical ids', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-orphans-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'orphans.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.query('INSERT INTO _ImageToTag (A, B) VALUES (?, ?)').run('missing-image', 'missing-tag');
		database
			.query('INSERT INTO Profile (id, name, emoji, color, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
			.run('profile-for-orphan-test', 'Test', 'T', '#000000', 0, Date.now());
		database
			.query('INSERT INTO Favorite (id, profileId, entityType, entityId, addedAt) VALUES (?, ?, ?, ?, ?)')
			.run('favorite-orphan-row', 'profile-for-orphan-test', 'image', 'raw-missing-image-id', Date.now());
		database.query('INSERT INTO Note (id, title) VALUES (?, ?)').run('semantic-anchor', 'Semantic anchor');
		database.exec(`
			DROP TRIGGER IF EXISTS SemanticRelation_endpoint_contract_insert;
			DROP TRIGGER IF EXISTS SemanticRelation_role_contract_insert;
		`);
		database
			.query(
				`INSERT INTO SemanticRelation(id, sourceType, sourceId, targetType, targetId, roleSlug, roleKey)
				 VALUES (?, 'note', ?, 'note', 'semantic-anchor', NULL, '')`
			)
			.run('semantic-source-orphan', 'missing-semantic-source');
		database
			.query(
				`INSERT INTO SemanticRelation(id, sourceType, sourceId, targetType, targetId, roleSlug, roleKey)
				 VALUES (?, 'note', 'semantic-anchor', 'note', ?, NULL, '')`
			)
			.run('semantic-target-orphan', 'missing-semantic-target');
		database.clearQueryCache();
		database.close();
		const before = await stat(databasePath);

		const findings = inspectOrphans(databasePath);
		const after = await stat(databasePath);
		const serialized = JSON.stringify(findings);

		expect(RELATION_CATALOG).toHaveLength(93);
		expect(findings.map((finding) => finding.name)).toContain('_ImageToTag.A->Image.id');
		expect(findings.map((finding) => finding.name)).toContain('_ImageToTag.B->Tag.id');
		expect(findings.map((finding) => finding.name)).toContain('Favorite.entityId->entityType target');
		expect(findings.map((finding) => finding.name)).toContain('SemanticRelation.sourceId->sourceType target');
		expect(findings.map((finding) => finding.name)).toContain('SemanticRelation.targetId->targetType target');
		expect(findings.every((finding) => finding.status === 'orphaned')).toBe(true);
		expect(findings.every((finding) => finding.count > 0 && finding.technicalIds.length > 0)).toBe(true);
		expect(findings.every((finding) => finding.technicalIds.every((id) => /^[a-f0-9]{24}$/.test(id)))).toBe(true);
		expect(hasIntegrityFailures(findings)).toBe(true);
		expect(serialized).not.toContain('path');
		expect(serialized).not.toContain('missing-image');
		expect(serialized).not.toContain('missing-tag');
		expect(serialized).not.toContain('raw-missing-image-id');
		expect(after.size).toBe(before.size);
		expect(after.mtimeMs).toBe(before.mtimeMs);
	});

	it('reports missing catalog tables as uninspectable and fails the integrity gate', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-uninspectable-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'uninspectable.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.query('DROP TABLE Tag').run();
		database.clearQueryCache();
		database.close();

		const findings = inspectOrphans(databasePath);
		const uninspectable = findings.filter((finding) => finding.status === 'uninspectable');

		expect(uninspectable.length).toBeGreaterThan(0);
		expect(uninspectable.some((finding) => finding.reason === 'missing-parent-table:Tag')).toBe(true);
		expect(hasIntegrityFailures(findings)).toBe(true);
	});

	it('covers direct, hierarchical and polymorphic relations required by the canonical schema', () => {
		const names = new Set(RELATION_CATALOG.map((relation) => relation.name));
		for (const expected of [
			'FileStats.fileId->Image.id',
			'UploadedImage.imageId->Image.id',
			'Image.noteId->Note.id',
			'Image.assetId->Asset.id',
			'Profile.settingsId->Settings.id',
			'SourceFile.assetId->Asset.id',
			'SourceFile.rootId->MediaRoot.id',
			'SourceFile.folderId->Folder.id',
			'Asset.primarySourceFileId->SourceFile.id',
			'Asset.(id,primarySourceFileId)->SourceFile.(assetId,id)',
			'Collection.parentId->Collection.id',
			'Favorite.entityId->entityType target',
			'Thumbnail.entityId->entityType target',
			'Metadata.entityId->entityType target',
			'EntityAggregates.entityId->entityType target',
			'SemanticRelation.sourceId->sourceType target',
			'SemanticRelation.targetId->targetType target',
			'_AlbumToPlace.A->Album.id',
			'_AlbumToPlace.B->Place.id',
			'_CharacterToPlace.A->Character.id',
			'_CharacterToPlace.B->Place.id',
		]) {
			expect(names.has(expected)).toBe(true);
		}
	});

	it('finds corrupt canonical Album/Character place bridges when foreign keys were disabled', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-canonical-bridges-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'canonical-bridges.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.exec('PRAGMA foreign_keys = OFF');
		database.exec(`
			INSERT INTO _AlbumToPlace(A, B) VALUES ('missing-album', 'missing-place');
			INSERT INTO _CharacterToPlace(A, B) VALUES ('missing-character', 'missing-place');
		`);
		database.clearQueryCache();
		database.close();

		const findings = inspectOrphans(databasePath);
		const names = new Set(findings.map((finding) => finding.name));
		for (const expected of [
			'_AlbumToPlace.A->Album.id',
			'_AlbumToPlace.B->Place.id',
			'_CharacterToPlace.A->Character.id',
			'_CharacterToPlace.B->Place.id',
		]) {
			expect(names.has(expected)).toBe(true);
		}
	});

	it('detects canonical source ownership corruption even when foreign keys were disabled', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-source-ownership-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'source-ownership.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.exec('PRAGMA foreign_keys = OFF');
		database.exec(`
			INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library');
			INSERT INTO Asset(id, assetType, primarySourceFileId) VALUES ('asset-one', 'image', 'source-two');
			INSERT INTO Asset(id, assetType, primarySourceFileId) VALUES ('asset-two', 'image', 'source-one');
			INSERT INTO SourceFile(id, assetId, rootId, relativePath, contentHash, byteSize, availability)
			VALUES ('source-one', 'asset-one', 'root-library', 'one.png', '${'a'.repeat(64)}', 1, 'available');
			INSERT INTO SourceFile(id, assetId, rootId, relativePath, contentHash, byteSize, availability)
			VALUES ('source-two', 'asset-two', 'root-library', 'two.png', '${'b'.repeat(64)}', 1, 'available');
		`);
		database.clearQueryCache();
		database.close();

		const findings = inspectOrphans(databasePath);
		const ownership = findings.find(
			(finding) => finding.name === 'Asset.(id,primarySourceFileId)->SourceFile.(assetId,id)'
		);

		expect(ownership?.status).toBe('orphaned');
		expect(ownership?.count).toBe(2);
		expect(ownership?.technicalIds).toHaveLength(2);
		expect(findings.some((finding) => finding.name === 'Asset.primarySourceFileId->SourceFile.id')).toBe(false);
	});

	it('finds Image.noteId orphans but ignores route-valid general activities', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-orphans-coverage-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'coverage.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database
			.query('INSERT INTO Folder (id, name, path, createdAt) VALUES (?, ?, ?, ?)')
			.run('coverage-folder', 'Coverage', '/coverage', Date.now());
		database
			.query(
				'INSERT INTO Image (id, name, path, hash, size, width, height, folderId, noteId, createdAt, addedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
			)
			.run(
				'coverage-image',
				'Coverage',
				'/coverage/image.png',
				'a'.repeat(64),
				1,
				1,
				1,
				'coverage-folder',
				'missing-note',
				Date.now(),
				Date.now()
			);
		database
			.query('INSERT INTO Activity (id, type, entityType, entityId, action, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
			.run('general-activity', 'system', 'general', '', 'create', Date.now());
		database.clearQueryCache();
		database.close();

		const findings = inspectOrphans(databasePath);
		expect(findings).toContainEqual(
			expect.objectContaining({ count: 1, name: 'Image.noteId->Note.id', status: 'orphaned' })
		);
		expect(findings.some((finding) => finding.name.startsWith('Activity.'))).toBe(false);
	});
});
