import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { assets, documents, folders, mediaRoots, metadatas, sourceFiles } from '../src/lib/drizzle/schema';
import { documentsEffectRouter } from '../src/server/routes/file-services.effect';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';
import { syncCanonicalMediaRoots } from '../src/services/media-core/media-root-registry.service';

const temporaryDirectories: string[] = [];
const createdFolderIds: string[] = [];
const createdRootIds: string[] = [];
const createdDocumentIds: string[] = [];

afterEach(async () => {
	for (const id of createdDocumentIds.splice(0)) {
		await db.delete(metadatas).where(eq(metadatas.id, `${id}-thumbnail`));
		await db.delete(documents).where(eq(documents.id, id));
		await db.delete(assets).where(eq(assets.id, id));
	}
	for (const id of createdFolderIds.splice(0)) await db.delete(folders).where(eq(folders.id, id));
	for (const id of createdRootIds.splice(0)) await db.delete(mediaRoots).where(eq(mediaRoots.id, id));
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('canonical Document HTTP lifecycle', () => {
	it('creates an authorized Document, protects its preview and restores its catalog identity', async () => {
		const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-document-http-'));
		temporaryDirectories.push(directory);
		const rootPath = resolve(directory, 'library');
		await mkdir(rootPath);
		const documentPath = resolve(rootPath, 'report.pdf');
		await writeFile(documentPath, 'document');
		const rootId = `root-${crypto.randomUUID()}`;
		const folderId = crypto.randomUUID();
		createdRootIds.push(rootId);
		createdFolderIds.push(folderId);
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, label: 'HTTP document library', path: rootPath, permissions: ['read', 'index', 'write', 'delete'] },
		]);
		await syncCanonicalMediaRoots(registry);
		await db.insert(folders).values({ id: folderId, name: 'HTTP documents', path: rootPath });
		const app = express();
		app.locals.authorizedRootRegistry = registry;
		app.use(express.json());
		app.use('/api/documents', documentsEffectRouter);

		const response = await request(app)
			.post('/api/documents')
			.send({
				extension: 'pdf',
				folderId,
				hash: 'e'.repeat(64),
				mimeType: 'application/pdf',
				name: 'report.pdf',
				path: resolve(directory, 'attacker.pdf'),
				size: 8,
				source: { relativePath: 'report.pdf', rootId },
				title: 'Report',
			});

		expect(response.status, JSON.stringify(response.body)).toBe(201);
		expect(response.body).toEqual(
			expect.objectContaining({ assetId: response.body.id, canonicalState: 'canonical', id: expect.any(String) })
		);
		expect(JSON.stringify(response.body)).not.toContain(directory);
		createdDocumentIds.push(response.body.id);
		expect(await db.select().from(documents).where(eq(documents.id, response.body.id))).toEqual([
			expect.objectContaining({ assetId: response.body.id, path: documentPath }),
		]);
		expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, response.body.id))).toEqual([
			expect.objectContaining({ relativePath: 'report.pdf', rootId }),
		]);
		const persistedSvg = '<svg xmlns="http://www.w3.org/2000/svg"><text>persisted-document</text></svg>';
		await db.insert(metadatas).values({
			id: `${response.body.id}-thumbnail`,
			category: 'preview',
			entityId: response.body.id,
			entityType: 'document',
			key: 'thumbnail',
			type: 'base64',
			value: Buffer.from(persistedSvg).toString('base64'),
		});
		const persistedPreview = await request(app).get(`/api/documents/${response.body.id}/preview`);
		expect(persistedPreview.status).toBe(200);
		expect(persistedPreview.type).toBe('image/svg+xml');
		expect(Buffer.from(persistedPreview.body).toString('utf8')).toBe(persistedSvg);
		expect(persistedPreview.headers['x-content-type-options']).toBe('nosniff');

		const rawPath = await request(app)
			.post('/api/documents')
			.send({
				extension: 'pdf',
				folderId,
				hash: 'f'.repeat(64),
				mimeType: 'application/pdf',
				name: 'raw.pdf',
				path: documentPath,
				size: 8,
			});
		expect(rawPath.status).toBe(400);

		expect((await request(app).delete(`/api/documents/${response.body.id}`)).status).toBe(204);
		expect(await db.select().from(documents).where(eq(documents.id, response.body.id))).toHaveLength(1);
		expect((await request(app).get(`/api/documents/${response.body.id}/preview`)).status).toBe(404);
		expect((await request(app).get('/api/documents')).body).toEqual([]);

		const restored = await request(app).post(`/api/documents/${response.body.id}/restore`);
		expect(restored.status, JSON.stringify(restored.body)).toBe(200);
		expect(restored.body).toEqual(expect.objectContaining({ canonicalState: 'canonical', id: response.body.id }));
		expect((await request(app).get('/api/documents')).body).toHaveLength(1);

		await rm(documentPath);
		expect((await request(app).delete(`/api/documents/${response.body.id}`)).status).toBe(204);
		expect((await request(app).post(`/api/documents/${response.body.id}/restore`)).status).toBe(200);
	});
});
