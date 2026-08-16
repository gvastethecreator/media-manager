import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrateDatabase } from './migrations';

const temporaryDirectories: string[] = [];

async function createDatabase(): Promise<Database> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-image-asset-link-'));
	temporaryDirectories.push(directory);
	const databasePath = join(directory, 'test.sqlite');
	await migrateDatabase({ databasePath });
	const database = new Database(databasePath, { strict: true });
	database.exec('PRAGMA foreign_keys = ON');
	return database;
}

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('Image to Asset expand-contract link', () => {
	it('adds a nullable, unique Asset identity link without rewriting legacy rows', async () => {
		const database = await createDatabase();
		try {
			const columns = database.query('PRAGMA table_info("Image")').all() as Array<{
				name: string;
				notnull: number;
			}>;
			const assetId = columns.find((column) => column.name === 'assetId');
			expect(assetId).toEqual(expect.objectContaining({ name: 'assetId', notnull: 0 }));

			const foreignKeys = database.query('PRAGMA foreign_key_list("Image")').all() as Array<{
				from: string;
				on_delete: string;
				on_update: string;
				table: string;
				to: string;
			}>;
			expect(foreignKeys).toContainEqual(
				expect.objectContaining({
					from: 'assetId',
					on_delete: 'RESTRICT',
					on_update: 'CASCADE',
					table: 'Asset',
					to: 'id',
				})
			);

			const indexes = database.query('PRAGMA index_list("Image")').all() as Array<{
				name: string;
				unique: number;
			}>;
			expect(indexes).toContainEqual(expect.objectContaining({ name: 'Image_assetId_key', unique: 1 }));

			database.exec(`
				INSERT INTO Folder(id, name, path) VALUES ('folder-legacy', 'Legacy', '/legacy');
				INSERT INTO Image(id, name, path, hash, size, width, height, folderId)
				VALUES ('image-legacy', 'Legacy', '/legacy/image.png', '${'a'.repeat(64)}', 1, 1, 1, 'folder-legacy');
			`);
			expect(database.query('SELECT assetId FROM Image WHERE id = ?').get('image-legacy')).toEqual({ assetId: null });
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('enforces one linked Image per Asset and exact Image/Asset identity', async () => {
		const database = await createDatabase();
		try {
			database.exec(`
				INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library');
				INSERT INTO Folder(id, name, path) VALUES ('folder-images', 'Images', '/library/images');
				BEGIN IMMEDIATE;
				INSERT INTO SourceFile(id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability)
				VALUES ('source-image', 'asset-image', 'root-library', 'images/example.png', 'folder-images', '${'b'.repeat(64)}', 10, 'available');
				INSERT INTO Asset(id, assetType, title, primarySourceFileId)
				VALUES ('asset-image', 'image', 'Example', 'source-image');
				INSERT INTO Image(id, assetId, name, path, hash, size, width, height, folderId)
				VALUES ('asset-image', 'asset-image', 'Example', '/library/images/example.png', '${'b'.repeat(64)}', 10, 1, 1, 'folder-images');
				COMMIT;
			`);

			const insertLinkedImage = database.query(`
				INSERT INTO Image(id, assetId, name, path, hash, size, width, height, folderId)
				VALUES (?, ?, ?, ?, ?, ?, 1, 1, 'folder-images')
			`);
			expect(() =>
				insertLinkedImage.run(
					'another-image',
					'asset-image',
					'Duplicate link',
					'/library/images/other.png',
					'c'.repeat(64),
					11
				)
			).toThrow();

			expect(() =>
				insertLinkedImage.run(
					'different-image-id',
					'asset-image',
					'Wrong identity',
					'/library/images/wrong.png',
					'd'.repeat(64),
					12
				)
			).toThrow();
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});
});
