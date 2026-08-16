import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrateDatabase } from './migrations';

const temporaryDirectories: string[] = [];

const specializations = [
	{
		assetType: 'video',
		legacyInsert: `INSERT INTO Video(id, name, path, hash, size, duration, folderId)
			VALUES ('video-legacy', 'Legacy video', '/legacy/video.mp4', '${'a'.repeat(64)}', 1, 1, 'folder-legacy')`,
		linkedInsert: `INSERT INTO Video(id, assetId, name, path, hash, size, duration, folderId)
			VALUES (?, ?, 'Linked video', '/library/video.mp4', '${'b'.repeat(64)}', 10, 1, 'folder-library')`,
		table: 'Video',
	},
	{
		assetType: 'audio',
		legacyInsert: `INSERT INTO Audio(id, name, path, size, hash, mimeType, extension, folderId)
			VALUES ('audio-legacy', 'Legacy audio', '/legacy/audio.mp3', 1, '${'a'.repeat(64)}', 'audio/mpeg', 'mp3', 'folder-legacy')`,
		linkedInsert: `INSERT INTO Audio(id, assetId, name, path, size, hash, mimeType, extension, folderId)
			VALUES (?, ?, 'Linked audio', '/library/audio.mp3', 10, '${'b'.repeat(64)}', 'audio/mpeg', 'mp3', 'folder-library')`,
		table: 'Audio',
	},
	{
		assetType: 'document',
		legacyInsert: `INSERT INTO Document(id, name, path, size, hash, mimeType, extension, folderId)
			VALUES ('document-legacy', 'Legacy document', '/legacy/document.pdf', 1, '${'a'.repeat(64)}', 'application/pdf', 'pdf', 'folder-legacy')`,
		linkedInsert: `INSERT INTO Document(id, assetId, name, path, size, hash, mimeType, extension, folderId)
			VALUES (?, ?, 'Linked document', '/library/document.pdf', 10, '${'b'.repeat(64)}', 'application/pdf', 'pdf', 'folder-library')`,
		table: 'Document',
	},
	{
		assetType: 'json',
		legacyInsert: `INSERT INTO JsonFile(id, name, path, size, hash, mimeType, extension, folderId)
			VALUES ('json-legacy', 'Legacy JSON', '/legacy/data.json', 1, '${'a'.repeat(64)}', 'application/json', 'json', 'folder-legacy')`,
		linkedInsert: `INSERT INTO JsonFile(id, assetId, name, path, size, hash, mimeType, extension, folderId)
			VALUES (?, ?, 'Linked JSON', '/library/data.json', 10, '${'b'.repeat(64)}', 'application/json', 'json', 'folder-library')`,
		table: 'JsonFile',
	},
	{
		assetType: 'file3d',
		legacyInsert: `INSERT INTO File3D(id, name, path, size, hash, mimeType, extension, folderId)
			VALUES ('file3d-legacy', 'Legacy 3D file', '/legacy/model.glb', 1, '${'a'.repeat(64)}', 'model/gltf-binary', 'glb', 'folder-legacy')`,
		linkedInsert: `INSERT INTO File3D(id, assetId, name, path, size, hash, mimeType, extension, folderId)
			VALUES (?, ?, 'Linked 3D file', '/library/model.glb', 10, '${'b'.repeat(64)}', 'model/gltf-binary', 'glb', 'folder-library')`,
		table: 'File3D',
	},
] as const;

async function createDatabase(): Promise<Database> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-specialization-links-'));
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

describe('remaining media specialization to Asset expand-contract links', () => {
	it('adds nullable, unique, restrictive Asset links without rewriting legacy rows', async () => {
		const database = await createDatabase();
		try {
			database.exec("INSERT INTO Folder(id, name, path) VALUES ('folder-legacy', 'Legacy', '/legacy')");

			for (const specialization of specializations) {
				const columns = database.query(`PRAGMA table_info("${specialization.table}")`).all() as Array<{
					name: string;
					notnull: number;
				}>;
				expect(columns.find((column) => column.name === 'assetId')).toEqual(
					expect.objectContaining({ name: 'assetId', notnull: 0 })
				);

				const foreignKeys = database.query(`PRAGMA foreign_key_list("${specialization.table}")`).all() as Array<{
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

				const indexes = database.query(`PRAGMA index_list("${specialization.table}")`).all() as Array<{
					name: string;
					unique: number;
				}>;
				expect(indexes).toContainEqual(
					expect.objectContaining({ name: `${specialization.table}_assetId_key`, unique: 1 })
				);

				database.exec(specialization.legacyInsert);
				expect(
					database
						.query(`SELECT assetId FROM "${specialization.table}" WHERE id = ?`)
						.get(`${specialization.assetType}-legacy`)
				).toEqual({ assetId: null });
			}
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('enforces exact specialization and Asset identity for every linked row', async () => {
		const database = await createDatabase();
		try {
			database.exec(`
				INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library');
				INSERT INTO Folder(id, name, path) VALUES ('folder-library', 'Library', '/library');
			`);

			for (const [index, specialization] of specializations.entries()) {
				const assetId = `asset-${specialization.assetType}`;
				const sourceId = `source-${specialization.assetType}`;
				database.exec(`
					BEGIN IMMEDIATE;
					INSERT INTO SourceFile(id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability)
					VALUES ('${sourceId}', '${assetId}', 'root-library', '${index}/${specialization.assetType}', 'folder-library', '${'b'.repeat(64)}', 10, 'available');
					INSERT INTO Asset(id, assetType, title, primarySourceFileId)
					VALUES ('${assetId}', '${specialization.assetType}', 'Linked media', '${sourceId}');
					COMMIT;
				`);

				const insertLinked = database.query(specialization.linkedInsert);
				insertLinked.run(assetId, assetId);
				expect(() => insertLinked.run(`wrong-${specialization.assetType}`, assetId)).toThrow();
			}
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});
});
