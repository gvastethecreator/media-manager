import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MIGRATIONS_DIRECTORY, migrateDatabase } from './migrations';

const temporaryDirectories: string[] = [];

async function createDatabase(): Promise<{ database: Database; databasePath: string }> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-relational-integrity-'));
	temporaryDirectories.push(directory);
	const databasePath = join(directory, 'test.sqlite');
	await migrateDatabase({ databasePath });
	const database = new Database(databasePath, { strict: true });
	database.exec('PRAGMA foreign_keys = ON');
	return { database, databasePath };
}

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) await rm(directory, { force: true, recursive: true });
});

describe('relational SQLite integrity', () => {
	it('enforces restrict, set-null and cascade policies with numeric millisecond defaults', async () => {
		const { database } = await createDatabase();
		const now = Date.now();
		database.exec(`
			INSERT INTO Folder(id, name, path) VALUES ('asset-root', 'Assets', '/assets');
			INSERT INTO Folder(id, name, path) VALUES ('tree-root', 'Tree', '/tree');
			INSERT INTO Folder(id, name, path, parentId) VALUES ('tree-child', 'Child', '/tree/child', 'tree-root');
			INSERT INTO Image(id, name, path, hash, size, width, height, folderId)
			VALUES ('image-1', 'Image', '/assets/image.png', '${'a'.repeat(64)}', 100, 10, 10, 'asset-root');
			INSERT INTO Album(id, name) VALUES ('album-1', 'Album');
			INSERT INTO _ImageToAlbum(A, B) VALUES ('image-1', 'album-1');
			INSERT INTO UploadedImage(id, name, path, size, hash, imageId)
			VALUES ('upload-1', 'Upload', '/uploads/image.png', 100, '${'b'.repeat(64)}', 'image-1');
			INSERT INTO FileStats(id, fileId) VALUES ('stats-1', 'image-1');
			INSERT INTO Profile(id, name) VALUES ('profile-1', 'Profile');
			INSERT INTO Settings(id, data, profileId) VALUES ('settings-1', '{}', 'profile-1');
			INSERT INTO Favorite(id, profileId, entityType, entityId)
			VALUES ('favorite-1', 'profile-1', 'image', 'image-1');
		`);

		const createdAt = database
			.query("SELECT createdAt, typeof(createdAt) AS type FROM Image WHERE id='image-1'")
			.get() as {
			createdAt: number;
			type: string;
		};
		expect(createdAt.type).toBe('integer');
		expect(createdAt.createdAt).toBeGreaterThanOrEqual(now - 1_000);
		expect(createdAt.createdAt).toBeLessThanOrEqual(Date.now() + 1_000);

		expect(() => database.exec("DELETE FROM Folder WHERE id='asset-root'")).toThrow();
		database.exec("DELETE FROM Folder WHERE id='tree-root'");
		expect(database.query("SELECT parentId FROM Folder WHERE id='tree-child'").get()).toEqual({ parentId: null });

		database.exec("DELETE FROM Image WHERE id='image-1'");
		expect(database.query('SELECT count(*) AS count FROM _ImageToAlbum').get()).toEqual({ count: 0 });
		expect(database.query('SELECT count(*) AS count FROM UploadedImage').get()).toEqual({ count: 0 });
		expect(database.query('SELECT count(*) AS count FROM FileStats').get()).toEqual({ count: 0 });
		database.exec("DELETE FROM Folder WHERE id='asset-root'");

		database.exec("DELETE FROM Profile WHERE id='profile-1'");
		expect(database.query('SELECT count(*) AS count FROM Settings').get()).toEqual({ count: 0 });
		expect(database.query('SELECT count(*) AS count FROM Favorite').get()).toEqual({ count: 0 });
		expect(database.query('PRAGMA foreign_key_check').all()).toEqual([]);
		database.close();
	});

	it('rejects invalid enum, range, hash and parent references at the database boundary', async () => {
		const { database } = await createDatabase();
		database.exec("INSERT INTO Folder(id, name, path) VALUES ('folder-1', 'Folder', '/folder')");

		expect(() =>
			database.exec(
				"INSERT INTO Audio(id, name, path, size, hash, mimeType, extension, folderId) VALUES ('bad-audio', 'Bad', '/bad', -1, 'short', 'audio/mpeg', 'mp3', 'folder-1')"
			)
		).toThrow();
		expect(() =>
			database.exec(
				"INSERT INTO QueueJob(id, queue, data, status, progress) VALUES ('bad-job', 'default', '{}', 'invented', 101)"
			)
		).toThrow();
		expect(() =>
			database.exec(
				"INSERT INTO Image(id, name, path, hash, size, width, height, folderId) VALUES ('missing-parent', 'Image', '/missing.png', '${'a'.repeat(64)}', 1, 1, 1, 'missing-folder')"
			)
		).toThrow();
		database.close();
	});

	it('deletes only orphaned bridge links and normalizes evidenced legacy timestamp formats', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'media-manager-relational-upgrade-'));
		temporaryDirectories.push(directory);
		const baselineDirectory = join(directory, 'baseline');
		const databasePath = join(directory, 'legacy.sqlite');
		await mkdir(join(baselineDirectory, 'meta'), { recursive: true });
		await copyFile(join(MIGRATIONS_DIRECTORY, '0000_baseline.sql'), join(baselineDirectory, '0000_baseline.sql'));
		await writeFile(
			join(baselineDirectory, 'meta', '_journal.json'),
			JSON.stringify({
				dialect: 'sqlite',
				entries: [{ breakpoints: true, idx: 0, tag: '0000_baseline', version: '6', when: 0 }],
				version: '7',
			})
		);
		await migrateDatabase({ databasePath, migrationsDirectory: baselineDirectory });
		const legacy = new Database(databasePath, { strict: true });
		legacy.exec(`
			INSERT INTO _ImageToWorldItem(A, B) VALUES ('missing-image', 'missing-world-item');
			INSERT INTO Album(id, name, createdAt) VALUES ('legacy-album', 'Legacy Album', CURRENT_TIMESTAMP);
			INSERT INTO Metadata(id, entityType, entityId, key, createdAt)
			VALUES ('manual-metadata', 'image', 'missing-image', 'legacy', CURRENT_TIMESTAMP);
			INSERT INTO Profile(id, name, createdAt) VALUES ('legacy-profile', 'Legacy', CURRENT_TIMESTAMP);
		`);
		legacy.close();

		await migrateDatabase({ allowExistingPending: true, databasePath });
		const upgraded = new Database(databasePath, { strict: true });
		expect(upgraded.query('SELECT count(*) AS count FROM _ImageToWorldItem').get()).toEqual({ count: 0 });
		expect(upgraded.query("SELECT count(*) AS count FROM Metadata WHERE id='manual-metadata'").get()).toEqual({
			count: 1,
		});
		expect(upgraded.query("SELECT typeof(createdAt) AS type FROM Metadata WHERE id='manual-metadata'").get()).toEqual({
			type: 'integer',
		});
		expect(upgraded.query("SELECT typeof(createdAt) AS type FROM Profile WHERE id='legacy-profile'").get()).toEqual({
			type: 'integer',
		});
		expect(upgraded.query("SELECT typeof(createdAt) AS type FROM Album WHERE id='legacy-album'").get()).toEqual({
			type: 'integer',
		});
		upgraded.exec("INSERT INTO Album(id, name) VALUES ('new-album', 'New Album')");
		expect(upgraded.query('SELECT id FROM Album ORDER BY createdAt DESC LIMIT 1').get()).toEqual({ id: 'new-album' });
		expect(upgraded.query('PRAGMA foreign_key_check').all()).toEqual([]);
		upgraded.close();
	});
});
