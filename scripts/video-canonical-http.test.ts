import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { assets, folders, mediaRoots, sourceFiles, videos } from '../src/lib/drizzle/schema';
import videosRouter from '../src/server/routes/videos.effect';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';
import { syncCanonicalMediaRoots } from '../src/services/media-core/media-root-registry.service';

const temporaryDirectories: string[] = [];
const createdFolderIds: string[] = [];
const createdRootIds: string[] = [];
const createdVideoIds: string[] = [];

afterEach(async () => {
	for (const id of createdVideoIds.splice(0)) {
		await db.delete(videos).where(eq(videos.id, id));
		await db.delete(assets).where(eq(assets.id, id));
	}
	for (const id of createdFolderIds.splice(0)) await db.delete(folders).where(eq(folders.id, id));
	for (const id of createdRootIds.splice(0)) await db.delete(mediaRoots).where(eq(mediaRoots.id, id));
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('canonical Video HTTP lifecycle', () => {
	it('creates from an opaque source, serves it, tombstones it and restores it', async () => {
		const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-video-http-'));
		temporaryDirectories.push(directory);
		const rootPath = resolve(directory, 'library');
		await mkdir(rootPath);
		const videoPath = resolve(rootPath, 'clip.mp4');
		await writeFile(videoPath, 'video');
		const rootId = `root-${crypto.randomUUID()}`;
		const folderId = crypto.randomUUID();
		createdRootIds.push(rootId);
		createdFolderIds.push(folderId);
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, label: 'HTTP video library', path: rootPath, permissions: ['read', 'index', 'write', 'delete'] },
		]);
		await syncCanonicalMediaRoots(registry);
		await db.insert(folders).values({ id: folderId, name: 'HTTP videos', path: rootPath });
		const app = express();
		app.locals.authorizedRootRegistry = registry;
		app.use(express.json());
		app.use('/api/videos', videosRouter);

		const response = await request(app)
			.post('/api/videos')
			.send({
				duration: 1,
				folderId,
				hash: 'a'.repeat(64),
				height: 1,
				name: 'clip.mp4',
				path: resolve(directory, 'attacker.mp4'),
				size: 5,
				source: { relativePath: 'clip.mp4', rootId },
				width: 1,
			});

		expect(response.status, JSON.stringify(response.body)).toBe(201);
		expect(response.body).toEqual(
			expect.objectContaining({ assetId: response.body.id, canonicalState: 'canonical', id: expect.any(String) })
		);
		expect(JSON.stringify(response.body)).not.toContain(directory);
		createdVideoIds.push(response.body.id);
		expect(await db.select().from(videos).where(eq(videos.id, response.body.id))).toEqual([
			expect.objectContaining({ assetId: response.body.id, path: videoPath }),
		]);
		expect(await db.select().from(assets).where(eq(assets.id, response.body.id))).toEqual([
			expect.objectContaining({ assetType: 'video', status: 'active' }),
		]);
		expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, response.body.id))).toEqual([
			expect.objectContaining({ relativePath: 'clip.mp4', rootId }),
		]);
		const updated = await request(app).patch(`/api/videos/${response.body.id}`).send({ name: 'renamed.mp4' });
		expect(updated.status, JSON.stringify(updated.body)).toBe(200);
		expect(updated.body.name).toBe('renamed.mp4');
		expect((await request(app).get(`/api/videos/${response.body.id}/content`)).status).toBe(200);
		await db
			.update(videos)
			.set({ thumbnail: Buffer.from('thumbnail').toString('base64'), thumbnailSize: 9 })
			.where(eq(videos.id, response.body.id));
		const thumbnail = await request(app).get(`/api/videos/${response.body.id}/thumbnail`);
		expect(thumbnail.status).toBe(200);
		expect(thumbnail.headers['content-type']).toContain('image/jpeg');
		expect(Buffer.from(thumbnail.body).toString('utf8')).toBe('thumbnail');

		const rawPath = await request(app)
			.post('/api/videos')
			.send({
				duration: 1,
				folderId,
				hash: 'b'.repeat(64),
				name: 'raw.mp4',
				path: videoPath,
				size: 5,
			});
		expect(rawPath.status).toBe(400);

		expect((await request(app).delete(`/api/videos/${response.body.id}`)).status).toBe(204);
		expect(await db.select().from(videos).where(eq(videos.id, response.body.id))).toHaveLength(1);
		expect(await db.select().from(assets).where(eq(assets.id, response.body.id))).toEqual([
			expect.objectContaining({ status: 'deleted', statusBeforeDeletion: 'active' }),
		]);
		expect((await request(app).get(`/api/videos/${response.body.id}/content`)).status).toBe(404);
		expect((await request(app).get(`/api/videos/${response.body.id}/thumbnail`)).status).toBe(404);
		expect((await request(app).get('/api/videos')).body.data).toEqual([]);
		expect((await request(app).get(`/api/videos/folder/${folderId}/count`)).body).toEqual({ count: 0 });

		const restored = await request(app).post(`/api/videos/${response.body.id}/restore`);
		expect(restored.status, JSON.stringify(restored.body)).toBe(200);
		expect(restored.body).toEqual(expect.objectContaining({ canonicalState: 'canonical', id: response.body.id }));
		expect((await request(app).get(`/api/videos/folder/${folderId}/count`)).body).toEqual({ count: 1 });

		await rm(videoPath);
		expect((await request(app).delete(`/api/videos/${response.body.id}`)).status).toBe(204);
		expect((await request(app).post(`/api/videos/${response.body.id}/restore`)).status).toBe(200);
	});
});
