import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrateDatabase } from './migrations';

const temporaryDirectories: string[] = [];

async function createDatabase(): Promise<Database> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-canonical-asset-'));
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

describe('canonical Asset persistence', () => {
	it('creates one stable Asset around its primary Source File in a single transaction', async () => {
		const database = await createDatabase();
		try {
			database.exec(`
			INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library');
			INSERT INTO Folder(id, name, path) VALUES ('folder-images', 'Images', '/legacy/images');
			BEGIN IMMEDIATE;
			INSERT INTO SourceFile(
				id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability
			) VALUES (
				'source-image-1', 'asset-image-1', 'root-library', 'images/example.png', 'folder-images',
				'${'a'.repeat(64)}', 1024, 'available'
			);
			INSERT INTO Asset(id, assetType, primarySourceFileId)
			VALUES ('asset-image-1', 'image', 'source-image-1');
			COMMIT;
		`);

			expect(
				database
					.query(`
					SELECT Asset.id, Asset.assetType, SourceFile.rootId, SourceFile.relativePath
					FROM Asset
					JOIN SourceFile ON SourceFile.id = Asset.primarySourceFileId
				`)
					.get()
			).toEqual({
				assetType: 'image',
				id: 'asset-image-1',
				relativePath: 'images/example.png',
				rootId: 'root-library',
			});
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('rejects a primary Source File owned by a different Asset', async () => {
		const database = await createDatabase();
		try {
			database.exec(`
				INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library');
				INSERT INTO Folder(id, name, path) VALUES ('folder-images', 'Images', '/legacy/images');
				BEGIN IMMEDIATE;
				INSERT INTO SourceFile(
					id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability
				) VALUES (
					'source-image-1', 'asset-image-1', 'root-library', 'images/one.png', 'folder-images',
					'${'a'.repeat(64)}', 100, 'available'
				);
				INSERT INTO Asset(id, assetType, primarySourceFileId)
				VALUES ('asset-image-1', 'image', 'source-image-1');
				INSERT INTO SourceFile(
					id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability
				) VALUES (
					'source-image-2', 'asset-image-1', 'root-library', 'images/two.png', 'folder-images',
					'${'b'.repeat(64)}', 200, 'available'
				);
			`);

			database.exec(`
				INSERT INTO Asset(id, assetType, primarySourceFileId)
				VALUES ('asset-image-2', 'image', 'source-image-2');
			`);
			expect(database.query('PRAGMA foreign_key_check').all()).toHaveLength(1);
			expect(() => database.exec('COMMIT')).toThrow();
			database.exec('ROLLBACK');
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('keeps lifecycle state singular, timestamped and restorable', async () => {
		const database = await createDatabase();
		try {
			database.exec(`
				INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library');
				INSERT INTO Folder(id, name, path) VALUES ('folder-images', 'Images', '/legacy/images');
				BEGIN IMMEDIATE;
				INSERT INTO SourceFile(
					id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability
				) VALUES (
					'source-image-1', 'asset-image-1', 'root-library', 'images/one.png', 'folder-images',
					'${'a'.repeat(64)}', 100, 'available'
				);
				INSERT INTO Asset(id, assetType, primarySourceFileId)
				VALUES ('asset-image-1', 'image', 'source-image-1');
				COMMIT;
			`);

			const initial = database
				.query(`
					SELECT status, statusBeforeDeletion, archivedAt, deletedAt,
						typeof(createdAt) AS createdType, typeof(updatedAt) AS updatedType
					FROM Asset WHERE id = 'asset-image-1'
				`)
				.get();
			expect(initial).toEqual({
				archivedAt: null,
				createdType: 'integer',
				deletedAt: null,
				status: 'active',
				statusBeforeDeletion: null,
				updatedType: 'integer',
			});
			expect(() => database.exec("UPDATE Asset SET status = 'archived' WHERE id = 'asset-image-1'")).toThrow();

			const now = Date.now();
			database
				.query("UPDATE Asset SET status = 'archived', archivedAt = ?, updatedAt = ? WHERE id = 'asset-image-1'")
				.run(now, now);
			database
				.query(
					"UPDATE Asset SET status = 'deleted', statusBeforeDeletion = 'archived', deletedAt = ?, updatedAt = ? WHERE id = 'asset-image-1'"
				)
				.run(now + 1, now + 1);
			expect(() =>
				database.exec(
					"UPDATE Asset SET archivedAt = NULL WHERE id = 'asset-image-1'"
				)
			).toThrow();
			expect(database.query("SELECT status, statusBeforeDeletion FROM Asset WHERE id = 'asset-image-1'").get()).toEqual({
				status: 'deleted',
				statusBeforeDeletion: 'archived',
			});
			database.exec(
				"UPDATE Asset SET status = 'archived', statusBeforeDeletion = NULL, deletedAt = NULL WHERE id = 'asset-image-1'"
			);
			expect(
				database.query("SELECT status, statusBeforeDeletion, deletedAt FROM Asset WHERE id = 'asset-image-1'").get()
			).toEqual({ deletedAt: null, status: 'archived', statusBeforeDeletion: null });
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('rejects invalid source fingerprints, sizes, availability and relative locations', async () => {
		const database = await createDatabase();
		try {
			database.exec(`
				INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library');
				INSERT INTO Folder(id, name, path) VALUES ('folder-images', 'Images', '/legacy/images');
				BEGIN IMMEDIATE;
				INSERT INTO SourceFile(
					id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability
				) VALUES (
					'source-primary', 'asset-image-1', 'root-library', 'images/primary.png', 'folder-images',
					'${'a'.repeat(64)}', 100, 'available'
				);
				INSERT INTO Asset(id, assetType, primarySourceFileId)
				VALUES ('asset-image-1', 'image', 'source-primary');
				COMMIT;
			`);

			expect(() =>
				database.exec(`
					INSERT INTO SourceFile(id, assetId, rootId, relativePath, contentHash, byteSize, availability)
					VALUES ('source-bad-hash', 'asset-image-1', 'root-library', 'images/hash.png', 'short', 1, 'available')
				`)
			).toThrow();
			expect(() =>
				database.exec(`
					INSERT INTO SourceFile(id, assetId, rootId, relativePath, contentHash, byteSize, availability)
					VALUES ('source-bad-size', 'asset-image-1', 'root-library', 'images/size.png', '${'b'.repeat(64)}', -1, 'available')
				`)
			).toThrow();
			expect(() =>
				database.exec(`
					INSERT INTO SourceFile(id, assetId, rootId, relativePath, contentHash, byteSize, availability)
					VALUES ('source-bad-state', 'asset-image-1', 'root-library', 'images/state.png', '${'c'.repeat(64)}', 1, 'invented')
				`)
			).toThrow();
			expect(() =>
				database.exec(`
					INSERT INTO SourceFile(id, assetId, rootId, relativePath, contentHash, byteSize, availability)
					VALUES ('source-bad-path', 'asset-image-1', 'root-library', '../escape.png', '${'d'.repeat(64)}', 1, 'available')
				`)
			).toThrow();
			for (const invalidValues of [
				`'source-absolute', 'asset-image-1', 'root-library', 'C:/library/file.png', '${'e'.repeat(64)}', 1, 'available'`,
				`'source-nul', 'asset-image-1', 'root-library', 'safe' || char(0) || '/../escape.png', '${'e'.repeat(64)}', 1, 'available'`,
				`'source-blob-path', 'asset-image-1', 'root-library', CAST('images/blob.png' AS BLOB), '${'e'.repeat(64)}', 1, 'available'`,
				`'source-blob-hash', 'asset-image-1', 'root-library', 'images/blob-hash.png', zeroblob(64), 1, 'available'`,
				`'source-real-size', 'asset-image-1', 'root-library', 'images/real-size.png', '${'e'.repeat(64)}', 1.5, 'available'`,
				`'source-upper-hash', 'asset-image-1', 'root-library', 'images/upper-hash.png', '${'E'.repeat(64)}', 1, 'available'`,
			]) {
				expect(() =>
					database.exec(`
						INSERT INTO SourceFile(id, assetId, rootId, relativePath, contentHash, byteSize, availability)
						VALUES (${invalidValues})
					`)
				).toThrow();
			}
			expect(() =>
				database.exec(`
					INSERT INTO SourceFile(id, assetId, rootId, relativePath, contentHash, byteSize, availability)
					VALUES ('source-case-alias', 'asset-image-1', 'root-library', 'Images/Primary.PNG', '${'e'.repeat(64)}', 1, 'available')
				`)
			).toThrow();
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('keeps duplicate content as distinct Assets and preserves identity across moves', async () => {
		const database = await createDatabase();
		try {
			const duplicateHash = 'e'.repeat(64);
			database.exec(`
				INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library');
				INSERT INTO Folder(id, name, path) VALUES ('folder-images', 'Images', '/legacy/images');
				BEGIN IMMEDIATE;
				INSERT INTO SourceFile(id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability)
				VALUES ('source-one', 'asset-one', 'root-library', 'images/one.png', 'folder-images', '${duplicateHash}', 10, 'available');
				INSERT INTO Asset(id, assetType, primarySourceFileId) VALUES ('asset-one', 'image', 'source-one');
				INSERT INTO SourceFile(id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability)
				VALUES ('source-two', 'asset-two', 'root-library', 'images/two.png', 'folder-images', '${duplicateHash}', 10, 'available');
				INSERT INTO Asset(id, assetType, primarySourceFileId) VALUES ('asset-two', 'image', 'source-two');
				COMMIT;
				UPDATE SourceFile SET relativePath = 'moved/one.png' WHERE id = 'source-one';
			`);

			expect(database.query('SELECT count(*) AS count FROM Asset').get()).toEqual({ count: 2 });
			expect(database.query('SELECT count(*) AS count FROM SourceFile WHERE contentHash = ?').get(duplicateHash)).toEqual({
				count: 2,
			});
			expect(database.query("SELECT id FROM Asset WHERE primarySourceFileId = 'source-one'").get()).toEqual({
				id: 'asset-one',
			});
			expect(database.query("SELECT relativePath FROM SourceFile WHERE id = 'source-one'").get()).toEqual({
				relativePath: 'moved/one.png',
			});
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('governs root lifecycle and the supported Asset specialization set', async () => {
		const database = await createDatabase();
		try {
			database.exec("INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library')");
			expect(
				database
					.query(
						"SELECT status, typeof(createdAt) AS createdType, typeof(updatedAt) AS updatedType FROM MediaRoot WHERE id = 'root-library'"
					)
					.get()
			).toEqual({ createdType: 'integer', status: 'active', updatedType: 'integer' });
			expect(() =>
				database.exec("INSERT INTO MediaRoot(id, label, status) VALUES ('root-invalid', 'Invalid', 'offline')")
			).toThrow();

			database.exec(`
				INSERT INTO Folder(id, name, path) VALUES ('folder-images', 'Images', '/legacy/images');
				BEGIN IMMEDIATE;
				INSERT INTO SourceFile(id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability)
				VALUES ('source-invalid', 'asset-invalid', 'root-library', 'images/invalid.png', 'folder-images', '${'f'.repeat(64)}', 1, 'available');
			`);
			expect(() =>
				database.exec(
					"INSERT INTO Asset(id, assetType, primarySourceFileId) VALUES ('asset-invalid', 'spreadsheet', 'source-invalid')"
				)
			).toThrow();
			database.exec('ROLLBACK');
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('preserves the Asset and authored title when its observed source becomes missing', async () => {
		const database = await createDatabase();
		try {
			const modifiedAt = Date.now() - 10_000;
			database.exec(`
				INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library');
				INSERT INTO Folder(id, name, path) VALUES ('folder-images', 'Images', '/legacy/images');
				BEGIN IMMEDIATE;
				INSERT INTO SourceFile(
					id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability,
					fileIdentity, mimeType, extension, fileModifiedAt
				) VALUES (
					'source-image-1', 'asset-image-1', 'root-library', 'images/one.png', 'folder-images',
					'${'a'.repeat(64)}', 100, 'available', 'volume-1:file-42', 'image/png', 'png', ${modifiedAt}
				);
				INSERT INTO Asset(id, assetType, title, primarySourceFileId)
				VALUES ('asset-image-1', 'image', 'Curated title', 'source-image-1');
				COMMIT;
			`);
			database
				.query("UPDATE SourceFile SET availability = 'missing', updatedAt = ? WHERE id = 'source-image-1'")
				.run(Date.now());

			expect(
				database
					.query(`
						SELECT Asset.id, Asset.title, Asset.status, SourceFile.availability, SourceFile.fileIdentity,
							typeof(SourceFile.observedAt) AS observedType, SourceFile.fileModifiedAt
						FROM Asset JOIN SourceFile ON SourceFile.id = Asset.primarySourceFileId
					`)
					.get()
			).toEqual({
				availability: 'missing',
				fileIdentity: 'volume-1:file-42',
				fileModifiedAt: modifiedAt,
				id: 'asset-image-1',
				observedType: 'integer',
				status: 'active',
				title: 'Curated title',
			});
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('switches the primary placement explicitly and cascades sources only on Asset purge', async () => {
		const database = await createDatabase();
		try {
			database.exec(`
				INSERT INTO MediaRoot(id, label) VALUES ('root-library', 'Library');
				INSERT INTO Folder(id, name, path) VALUES ('folder-images', 'Images', '/legacy/images');
				BEGIN IMMEDIATE;
				INSERT INTO SourceFile(id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability)
				VALUES ('source-primary', 'asset-image-1', 'root-library', 'images/primary.png', 'folder-images', '${'a'.repeat(64)}', 100, 'available');
				INSERT INTO Asset(id, assetType, primarySourceFileId)
				VALUES ('asset-image-1', 'image', 'source-primary');
				COMMIT;
				INSERT INTO SourceFile(id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability)
				VALUES ('source-secondary', 'asset-image-1', 'root-library', 'copies/secondary.png', 'folder-images', '${'a'.repeat(64)}', 100, 'available');
			`);

			expect(() => database.exec("DELETE FROM SourceFile WHERE id = 'source-primary'")).toThrow();
			database.exec(`
				UPDATE Asset SET primarySourceFileId = 'source-secondary' WHERE id = 'asset-image-1';
				DELETE FROM SourceFile WHERE id = 'source-primary';
			`);
			expect(database.query("SELECT primarySourceFileId FROM Asset WHERE id = 'asset-image-1'").get()).toEqual({
				primarySourceFileId: 'source-secondary',
			});
			database.exec("DELETE FROM Asset WHERE id = 'asset-image-1'");
			expect(database.query('SELECT count(*) AS count FROM SourceFile').get()).toEqual({ count: 0 });
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('ships lookup indexes for type, lifecycle, source, hash, availability and placement', async () => {
		const database = await createDatabase();
		try {
			const assetIndexes = new Set(
				(database.query("PRAGMA index_list('Asset')").all() as Array<{ name: string }>).map((row) => row.name)
			);
			const sourceIndexes = new Set(
				(database.query("PRAGMA index_list('SourceFile')").all() as Array<{ name: string }>).map((row) => row.name)
			);
			for (const name of ['Asset_assetType_idx', 'Asset_status_idx', 'Asset_primarySourceFileId_key']) {
				expect(assetIndexes.has(name)).toBe(true);
			}
			for (const name of [
				'SourceFile_assetId_idx',
				'SourceFile_availability_idx',
				'SourceFile_contentHash_idx',
				'SourceFile_folderId_idx',
				'SourceFile_rootId_idx',
				'SourceFile_rootId_relativePath_key',
			]) {
				expect(sourceIndexes.has(name)).toBe(true);
			}
			const locationKeyColumns = database
				.query("PRAGMA index_xinfo('SourceFile_rootId_relativePath_key')")
				.all() as Array<{ coll: string; key: number; name: string }>;
			expect(locationKeyColumns.find((column) => column.name === 'relativePath' && column.key === 1)?.coll).toBe(
				'NOCASE'
			);
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});
});
