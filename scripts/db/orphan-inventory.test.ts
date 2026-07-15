import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrateDatabase } from './migrations';
import { hasIntegrityFailures, inspectOrphans, RELATION_CATALOG } from './orphan-inventory';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 5, recursive: true, retryDelay: 50 });
	}
});

describe('read-only orphan inventory', () => {
	it('catalogs conceptual relations and reports only counts plus technical ids', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-orphans-'));
		temporaryDirectories.push(directory);
		const databasePath = join(directory, 'orphans.sqlite');
		await migrateDatabase({ databasePath });
		const database = new Database(databasePath);
		database.query('INSERT INTO _ImageToTag (A, B) VALUES (?, ?)').run('missing-image', 'missing-tag');
		database
			.query('INSERT INTO Profile (id, name, emoji, color, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
			.run('profile-for-orphan-test', 'Test', 'T', 'token', 0, Date.now());
		database
			.query('INSERT INTO Favorite (id, profileId, entityType, entityId, addedAt) VALUES (?, ?, ?, ?, ?)')
			.run('favorite-orphan-row', 'profile-for-orphan-test', 'image', 'raw-missing-image-id', Date.now());
		database.clearQueryCache();
		database.close();
		const before = await stat(databasePath);

		const findings = inspectOrphans(databasePath);
		const after = await stat(databasePath);
		const serialized = JSON.stringify(findings);

		expect(RELATION_CATALOG.length).toBeGreaterThan(70);
		expect(findings.map((finding) => finding.name)).toContain('_ImageToTag.A->Image.id');
		expect(findings.map((finding) => finding.name)).toContain('_ImageToTag.B->Tag.id');
		expect(findings.map((finding) => finding.name)).toContain('Favorite.entityId->entityType target');
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
			'Profile.settingsId->Settings.id',
			'Collection.parentId->Collection.id',
			'Favorite.entityId->entityType target',
			'Thumbnail.entityId->entityType target',
			'Metadata.entityId->entityType target',
			'EntityAggregates.entityId->entityType target',
		]) {
			expect(names.has(expected)).toBe(true);
		}
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
