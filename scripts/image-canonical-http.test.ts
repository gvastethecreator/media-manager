import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { assets, folders, images, mediaRoots, sourceFiles } from '../src/lib/drizzle/schema';
import foldersRouter from '../src/server/routes/folders.effect';
import imagesRouter from '../src/server/routes/images.effect';
import thumbnailsRouter from '../src/server/routes/thumbnails.effect';
import thumbnailsUnifiedRouter from '../src/server/routes/thumbnails-unified';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';
import { syncCanonicalMediaRoots } from '../src/services/media-core/media-root-registry.service';
import { thumbnailService } from '../src/services/image/image-thumbnail.service';

const temporaryDirectories: string[] = [];
const createdFolderIds: string[] = [];
const createdRootIds: string[] = [];
const createdImageIds: string[] = [];

afterEach(async () => {
	for (const id of createdImageIds.splice(0)) {
		await db.delete(images).where(eq(images.id, id));
		await db.delete(assets).where(eq(assets.id, id));
	}
	for (const id of createdFolderIds.splice(0)) await db.delete(folders).where(eq(folders.id, id));
	for (const id of createdRootIds.splice(0)) await db.delete(mediaRoots).where(eq(mediaRoots.id, id));
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('canonical Image HTTP create', () => {
	it('turns one authorized source reference into atomic Asset, SourceFile and Image rows', async () => {
		const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-image-http-'));
		temporaryDirectories.push(directory);
		const rootPath = resolve(directory, 'library');
		await mkdir(rootPath);
		await writeFile(resolve(rootPath, 'photo.jpg'), 'image');
		const rootId = `root-${crypto.randomUUID()}`;
		const folderId = crypto.randomUUID();
		createdRootIds.push(rootId);
		createdFolderIds.push(folderId);
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, label: 'HTTP library', path: rootPath, permissions: ['read', 'index', 'write', 'delete'] },
		]);
		await syncCanonicalMediaRoots(registry);
		await db.insert(folders).values({ id: folderId, name: 'HTTP images', path: rootPath });
		const otherFolderId = crypto.randomUUID();
		const otherFolderPath = resolve(rootPath, 'other-folder');
		await mkdir(otherFolderPath);
		await db.insert(folders).values({ id: otherFolderId, name: 'Other HTTP folder', path: otherFolderPath });
		createdFolderIds.push(otherFolderId);
		const app = express();
		app.locals.authorizedRootRegistry = registry;
		app.use(express.json());
		app.use('/api/images', imagesRouter);
		app.use('/api/folders', foldersRouter);
		app.use('/api/thumbnails', thumbnailsRouter);
		app.use('/api/thumbnails/unified', thumbnailsUnifiedRouter);

		const mismatchedPlacement = await request(app)
			.post('/api/images')
			.send({
				folderId: otherFolderId,
				hash: 'c'.repeat(64),
				height: 1,
				name: 'photo.jpg',
				size: 5,
				source: { relativePath: 'photo.jpg', rootId },
				width: 1,
			});
		expect(mismatchedPlacement.status).toBe(409);
		expect(mismatchedPlacement.body.code).toBe('ROOT_PATH_CONFLICT');
		expect(
			await db
				.select()
				.from(images)
				.where(eq(images.hash, 'c'.repeat(64)))
		).toEqual([]);
		expect(await db.select().from(assets).where(eq(assets.title, 'photo.jpg'))).toEqual([]);

		const response = await request(app)
			.post('/api/images')
			.send({
				folderId,
				hash: 'a'.repeat(64),
				height: 1,
				name: 'photo.jpg',
				path: resolve(directory, 'attacker-controlled.jpg'),
				size: 5,
				source: { relativePath: 'photo.jpg', rootId },
				width: 1,
			});

		expect(response.status, JSON.stringify(response.body)).toBe(201);
		expect(response.body).toEqual(
			expect.objectContaining({
				assetId: expect.any(String),
				canonicalDivergences: [],
				canonicalState: 'canonical',
				id: expect.any(String),
			})
		);
		expect(response.body.id).toBe(response.body.assetId);
		expect(JSON.stringify(response.body)).not.toContain(directory);
		createdImageIds.push(response.body.id);
		expect(await db.select().from(images).where(eq(images.id, response.body.id))).toEqual([
			expect.objectContaining({ assetId: response.body.id, path: resolve(rootPath, 'photo.jpg') }),
		]);
		expect(await db.select().from(assets).where(eq(assets.id, response.body.id))).toEqual([
			expect.objectContaining({ assetType: 'image', id: response.body.id, title: 'photo.jpg' }),
		]);
		expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, response.body.id))).toEqual([
			expect.objectContaining({ relativePath: 'photo.jpg', rootId }),
		]);
		const original = await request(app).get(`/api/images/${response.body.id}/content`);
		expect(original.status, original.text).toBe(200);
		expect(original.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
		expect(original.headers.vary).toContain('Cookie');
		expect(original.headers['x-content-type-options']).toBe('nosniff');
		expect(original.headers.etag).toBeDefined();
		expect(
			(await request(app).get(`/api/images/${response.body.id}/content`).set('If-None-Match', original.headers.etag))
				.status
		).toBe(304);
		const unavailableThumbnail = await request(app).get(`/api/thumbnails/unified/image/${response.body.id}`);
		expect(unavailableThumbnail.status).toBe(404);
		expect(unavailableThumbnail.headers['content-type']).toContain('image/svg+xml');
		expect(unavailableThumbnail.headers['cache-control']).toBe('private, no-store');
		expect(unavailableThumbnail.headers.vary).toContain('Cookie');
		expect(unavailableThumbnail.headers['x-content-type-options']).toBe('nosniff');
		const sharp = (await import('sharp')).default;
		const canonicalImage = await sharp({
			create: { background: { b: 0, g: 0, r: 255 }, channels: 3, height: 2, width: 2 },
		})
			.png()
			.toBuffer();
		const outsideImagePath = resolve(directory, 'outside-authorized-root.png');
		const outsideImage = await sharp({
			create: { background: { b: 255, g: 0, r: 0 }, channels: 3, height: 2, width: 2 },
		})
			.png()
			.toBuffer();
		await writeFile(resolve(rootPath, 'photo.jpg'), canonicalImage);
		await writeFile(outsideImagePath, outsideImage);
		await db.update(images).set({ path: outsideImagePath }).where(eq(images.id, response.body.id));
		await thumbnailService.generateThumbnail(response.body.id, resolve(rootPath, 'photo.jpg'));
		const [canonicalThumbnail] = await db
			.select({ thumbnail: images.thumbnail })
			.from(images)
			.where(eq(images.id, response.body.id));
		const rawCanonicalThumbnail = await sharp(Buffer.from(canonicalThumbnail.thumbnail!, 'base64')).raw().toBuffer();
		expect(rawCanonicalThumbnail[0]).toBeGreaterThan(200);
		expect(rawCanonicalThumbnail[2]).toBeLessThan(40);
		await db
			.update(images)
			.set({ path: resolve(rootPath, 'photo.jpg') })
			.where(eq(images.id, response.body.id));
		await db
			.update(images)
			.set({ thumbnail: 'thumbnail-data', thumbnailHeight: 1, thumbnailSize: 14, thumbnailWidth: 1 })
			.where(eq(images.id, response.body.id));
		const thumbnail = await request(app).get(`/api/thumbnails/unified/image/${response.body.id}`);
		expect(thumbnail.status, thumbnail.text).toBe(200);
		expect(thumbnail.headers['content-type']).toContain('image/webp');
		expect(thumbnail.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
		expect(thumbnail.headers.vary).toContain('Cookie');
		expect(thumbnail.headers['x-content-type-options']).toBe('nosniff');
		expect(thumbnail.headers.etag).toBeDefined();
		const revalidatedThumbnail = await request(app)
			.get(`/api/thumbnails/unified/image/${response.body.id}`)
			.set('If-None-Match', thumbnail.headers.etag);
		expect(revalidatedThumbnail.status).toBe(304);
		const placementMutation = await request(app)
			.patch(`/api/images/${response.body.id}`)
			.send({ folderId: crypto.randomUUID() });
		expect(placementMutation.status).toBe(410);
		expect(placementMutation.body.code).toBe('DOMAIN_OPERATION_REQUIRED');
		expect(await db.select().from(images).where(eq(images.id, response.body.id))).toEqual([
			expect.objectContaining({ folderId }),
		]);

		const rejected = await request(app)
			.post('/api/images')
			.send({
				folderId,
				hash: 'b'.repeat(64),
				height: 1,
				name: 'raw-path.jpg',
				path: resolve(rootPath, 'photo.jpg'),
				size: 5,
				width: 1,
			});
		expect(rejected.status).toBe(400);
		expect(
			await db
				.select()
				.from(images)
				.where(eq(images.hash, 'b'.repeat(64)))
		).toEqual([]);

		const deleted = await request(app).delete(`/api/images/${response.body.id}`);
		expect(deleted.status).toBe(204);
		expect(await db.select().from(images).where(eq(images.id, response.body.id))).toHaveLength(1);
		expect(await db.select().from(assets).where(eq(assets.id, response.body.id))).toEqual([
			expect.objectContaining({ status: 'deleted', statusBeforeDeletion: 'active' }),
		]);
		const hidden = await request(app).get('/api/images');
		expect(hidden.body.data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: response.body.id })]));
		expect((await request(app).get(`/api/images/folder/${folderId}/count`)).body).toEqual({ count: 0 });
		expect((await request(app).get('/api/thumbnails/unified/stats')).body.byType.image.total).toBe(0);
		const deletedFolderPreview = await request(app).get(`/api/folders/${folderId}/preview`);
		expect(deletedFolderPreview.status, deletedFolderPreview.text).toBe(200);
		const deletedFolderPreviewSvg = Buffer.isBuffer(deletedFolderPreview.body)
			? deletedFolderPreview.body.toString('utf8')
			: String(deletedFolderPreview.text ?? deletedFolderPreview.body);
		expect(deletedFolderPreview.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
		expect(deletedFolderPreview.headers.vary).toContain('Cookie');
		expect(deletedFolderPreview.headers['x-content-type-options']).toBe('nosniff');
		expect(deletedFolderPreview.headers['content-security-policy']).toContain("default-src 'none'");
		expect(deletedFolderPreviewSvg).toContain('font-size="42" font-weight="700">0</text>');
		expect(deletedFolderPreviewSvg).toContain('font-size="15">0 B</text>');
		const restored = await request(app).post(`/api/images/${response.body.id}/restore`);
		expect(restored.status, JSON.stringify(restored.body)).toBe(200);
		expect(restored.body.id).toBe(response.body.id);
		expect(await db.select().from(assets).where(eq(assets.id, response.body.id))).toEqual([
			expect.objectContaining({ deletedAt: null, status: 'active', statusBeforeDeletion: null }),
		]);
		expect((await request(app).get(`/api/images/folder/${folderId}/count`)).body).toEqual({ count: 1 });
		expect((await request(app).get('/api/thumbnails/unified/stats')).body.byType.image.total).toBe(1);
		const restoredFolderPreview = await request(app).get(`/api/folders/${folderId}/preview`);
		expect(restoredFolderPreview.status, restoredFolderPreview.text).toBe(200);
		const restoredFolderPreviewSvg = Buffer.isBuffer(restoredFolderPreview.body)
			? restoredFolderPreview.body.toString('utf8')
			: String(restoredFolderPreview.text ?? restoredFolderPreview.body);
		expect(restoredFolderPreviewSvg).toContain('font-size="42" font-weight="700">1</text>');
		expect(restoredFolderPreviewSvg).toContain('font-size="15">5 B</text>');

		const unauthorizedRootId = `root-${crypto.randomUUID()}`;
		createdRootIds.push(unauthorizedRootId);
		await db.insert(mediaRoots).values({ id: unauthorizedRootId, label: 'Not granted to this request' });
		await db.update(sourceFiles).set({ rootId: unauthorizedRootId }).where(eq(sourceFiles.assetId, response.body.id));
		const unauthorizedList = await request(app).get('/api/images');
		expect(unauthorizedList.status).toBe(200);
		expect(unauthorizedList.body.data).not.toEqual(
			expect.arrayContaining([expect.objectContaining({ id: response.body.id })])
		);

		await db.update(sourceFiles).set({ rootId }).where(eq(sourceFiles.assetId, response.body.id));
		await rm(resolve(rootPath, 'photo.jpg'));
		const missingSourceDelete = await request(app).delete(`/api/images/${response.body.id}`);
		expect(missingSourceDelete.status, JSON.stringify(missingSourceDelete.body)).toBe(204);
		const missingSourceRestore = await request(app).post(`/api/images/${response.body.id}/restore`);
		expect(missingSourceRestore.status, JSON.stringify(missingSourceRestore.body)).toBe(200);
	});
});
