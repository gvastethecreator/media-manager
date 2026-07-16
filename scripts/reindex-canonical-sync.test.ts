import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { createAuthorizedPathInput } from '../src/lib/filesystem/authorized-path-proof';
import { fileSyncService } from '../src/lib/filesystem/file-sync.service';
import { assets, folders, jsonFiles, mediaRoots, sourceFiles } from '../src/lib/drizzle/schema';
import foldersRouter from '../src/server/routes/folders.effect';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';
import { create as createJsonFile } from '../src/services/json-file/json-file.service.effect';
import { syncCanonicalMediaRoots } from '../src/services/media-core/media-root-registry.service';
import { FolderReindexService } from '../src/services/folder/reindex/folder-reindex.service';

const temporaryDirectories: string[] = [];
const assetIds: string[] = [];
const folderIds: string[] = [];
const rootIds: string[] = [];

afterEach(async () => {
	for (const id of assetIds.splice(0)) {
		await db.delete(jsonFiles).where(eq(jsonFiles.id, id));
		await db.delete(assets).where(eq(assets.id, id));
	}
	for (const id of folderIds.splice(0)) await db.delete(folders).where(eq(folders.id, id));
	for (const id of rootIds.splice(0)) await db.delete(mediaRoots).where(eq(mediaRoots.id, id));
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('canonical public Folder reindex', () => {
	it('uses the request registry, records missing sources and fails closed on an offline root race', async () => {
		const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-reindex-sync-'));
		temporaryDirectories.push(directory);
		const rootPath = resolve(directory, 'library');
		await mkdir(rootPath);
		const filePath = resolve(rootPath, 'catalog.json');
		await writeFile(filePath, '{}');
		const rootId = `reindex-root-${crypto.randomUUID()}`;
		const folderId = crypto.randomUUID();
		rootIds.push(rootId);
		folderIds.push(folderId);
		const authorizedRootRegistry = await createAuthorizedRootRegistry([
			{ id: rootId, label: 'Reindex root', path: rootPath, permissions: ['read', 'index'] },
		]);
		await syncCanonicalMediaRoots(authorizedRootRegistry);
		await db.insert(folders).values({ id: folderId, name: 'Reindex folder', path: rootPath });

		const created = await Effect.runPromise(
			createJsonFile({
				extension: 'json',
				folderId,
				hash: '9'.repeat(64),
				mimeType: 'application/json',
				name: 'catalog.json',
				path: filePath,
				size: 2,
				source: createAuthorizedPathInput({ absolutePath: filePath, relativePath: 'catalog.json', rootId }),
			})
		);
		assetIds.push(created.id);

		const app = express();
		app.locals.authorizedRootRegistry = authorizedRootRegistry;
		app.use(express.json());
		app.use('/api/folders', foldersRouter);

		await rm(filePath);
		const response = await request(app).post(`/api/folders/${folderId}/reindex`).send({ includeSubfolders: false });
		expect(response.status, response.text).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({ folderId, success: true, summary: expect.objectContaining({ foldersProcessed: 1 }) })
		);
		expect(response.body.summary).not.toHaveProperty('metadataExtracted');
		expect(response.body.summary).not.toHaveProperty('thumbnailsGenerated');
		const unsupported = await request(app).post(`/api/folders/${folderId}/reindex`).send({ skipMetadata: true });
		expect(unsupported.status).toBe(400);
		expect(unsupported.body.code).toBe('UNSUPPORTED_REINDEX_OPTION');
		expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, created.id))).toEqual([
			expect.objectContaining({ availability: 'missing', folderId }),
		]);

		const discoveredPath = resolve(rootPath, 'discovered');
		await mkdir(discoveredPath);
		const originalSync = fileSyncService.syncFolderFiles.bind(fileSyncService);
		fileSyncService.syncFolderFiles = async () => {
			throw new Error('synthetic sync failure');
		};
		try {
			await expect(
				FolderReindexService.getInstance().executeStructuredReindex(
					{ emitEvents: false, folderId, includeSubfolders: true },
					{ authorizedRootRegistry }
				)
			).rejects.toThrow('synthetic sync failure');
		} finally {
			fileSyncService.syncFolderFiles = originalSync;
		}
		expect(await db.select().from(folders).where(eq(folders.path, discoveredPath))).toEqual([]);

		await writeFile(filePath, '{}');
		let removedAfterAuthorization = false;
		await expect(
			FolderReindexService.getInstance().executeStructuredReindex(
				{ emitEvents: false, folderId, includeSubfolders: false },
				{
					afterFolderAuthorization: async (authorizedFolderId) => {
						if (authorizedFolderId !== folderId || removedAfterAuthorization) return;
						await rm(rootPath, { force: true, recursive: true });
						removedAfterAuthorization = true;
					},
					authorizedRootRegistry,
				}
			)
		).rejects.toThrow('El recurso solicitado no existe.');
		expect(removedAfterAuthorization).toBe(true);
		expect(await db.select().from(folders).where(eq(folders.id, folderId))).toHaveLength(1);
		expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, created.id))).toEqual([
			expect.objectContaining({ availability: 'missing', folderId }),
		]);

		const offlineResponse = await request(app)
			.post(`/api/folders/${folderId}/reindex`)
			.send({ includeSubfolders: false });
		expect(offlineResponse.status).toBe(404);
	});
});
