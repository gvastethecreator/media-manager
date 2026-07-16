import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { assets, audios, folders, images, mediaRoots, videos } from '../src/lib/drizzle/schema';
import audiosRouter from '../src/server/routes/audios.effect';
import imagesRouter from '../src/server/routes/images.effect';
import videosRouter from '../src/server/routes/videos.effect';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';
import { syncCanonicalMediaRoots } from '../src/services/media-core/media-root-registry.service';

const temporaryDirectories: string[] = [];
const assetIds: string[] = [];
const folderIds: string[] = [];
const rootIds: string[] = [];

afterEach(async () => {
	for (const id of assetIds.splice(0)) {
		await db.delete(images).where(eq(images.id, id));
		await db.delete(videos).where(eq(videos.id, id));
		await db.delete(audios).where(eq(audios.id, id));
		await db.delete(assets).where(eq(assets.id, id));
	}
	for (const id of folderIds.splice(0)) await db.delete(folders).where(eq(folders.id, id));
	for (const id of rootIds.splice(0)) await db.delete(mediaRoots).where(eq(mediaRoots.id, id));
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('media hash lookup authorization', () => {
	it('authorizes all duplicate candidates before selecting Image, Video or Audio', async () => {
		const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-hash-auth-'));
		temporaryDirectories.push(directory);
		const blockedPath = resolve(directory, 'blocked');
		const allowedPath = resolve(directory, 'allowed');
		await Promise.all([mkdir(blockedPath), mkdir(allowedPath)]);
		const blockedRootId = `hash-root-${crypto.randomUUID()}`;
		const allowedRootId = `hash-root-${crypto.randomUUID()}`;
		const blockedFolderId = crypto.randomUUID();
		const allowedFolderId = crypto.randomUUID();
		rootIds.push(blockedRootId, allowedRootId);
		folderIds.push(blockedFolderId, allowedFolderId);
		const setupRegistry = await createAuthorizedRootRegistry([
			{ id: blockedRootId, path: blockedPath, permissions: ['read', 'index', 'write'] },
			{ id: allowedRootId, path: allowedPath, permissions: ['read', 'index', 'write'] },
		]);
		await syncCanonicalMediaRoots(setupRegistry);
		await db.insert(folders).values([
			{ id: blockedFolderId, name: 'Blocked hash folder', path: blockedPath },
			{ id: allowedFolderId, name: 'Allowed hash folder', path: allowedPath },
		]);
		for (const name of ['same.jpg', 'same.mp4', 'same.mp3']) {
			await Promise.all([writeFile(resolve(blockedPath, name), name), writeFile(resolve(allowedPath, name), name)]);
		}

		const app = express();
		app.locals.authorizedRootRegistry = setupRegistry;
		app.use(express.json());
		app.use('/api/images', imagesRouter);
		app.use('/api/videos', videosRouter);
		app.use('/api/audios', audiosRouter);
		const createImage = (folderId: string, rootId: string) =>
			request(app)
				.post('/api/images')
				.send({
					folderId,
					hash: '1'.repeat(64),
					height: 1,
					name: 'same.jpg',
					size: 8,
					source: { relativePath: 'same.jpg', rootId },
					width: 1,
				});
		const createVideo = (folderId: string, rootId: string) =>
			request(app)
				.post('/api/videos')
				.send({
					duration: 1,
					folderId,
					hash: '2'.repeat(64),
					height: 1,
					name: 'same.mp4',
					size: 8,
					source: { relativePath: 'same.mp4', rootId },
					width: 1,
				});
		const createAudio = (folderId: string, rootId: string) =>
			request(app)
				.post('/api/audios')
				.send({
					album: null,
					albumArtist: null,
					artist: null,
					bitrate: null,
					bpm: null,
					channels: null,
					codec: null,
					comment: null,
					composer: null,
					description: null,
					disc: null,
					duration: 1,
					extension: 'mp3',
					folderId,
					format: 'mp3',
					genre: null,
					hash: '3'.repeat(64),
					isArchived: false,
					isFavorite: false,
					key: null,
					lyrics: null,
					mimeType: 'audio/mpeg',
					mood: null,
					name: 'same.mp3',
					sampleRate: null,
					size: 8,
					source: { relativePath: 'same.mp3', rootId },
					title: null,
					track: null,
					year: null,
				});

		const pairs = await Promise.all([
			Promise.all([createImage(blockedFolderId, blockedRootId), createImage(allowedFolderId, allowedRootId)]),
			Promise.all([createVideo(blockedFolderId, blockedRootId), createVideo(allowedFolderId, allowedRootId)]),
			Promise.all([createAudio(blockedFolderId, blockedRootId), createAudio(allowedFolderId, allowedRootId)]),
		]);
		for (const pair of pairs) {
			for (const response of pair) {
				expect(response.status, response.text).toBe(201);
				assetIds.push(response.body.id);
			}
		}
		const [[blockedImage, allowedImage], [blockedVideo, allowedVideo], [blockedAudio, allowedAudio]] = pairs;
		await Promise.all([
			db
				.update(images)
				.set({ createdAt: new Date(0) })
				.where(eq(images.id, blockedImage.body.id)),
			db
				.update(images)
				.set({ createdAt: new Date(1) })
				.where(eq(images.id, allowedImage.body.id)),
			db
				.update(videos)
				.set({ createdAt: new Date(0) })
				.where(eq(videos.id, blockedVideo.body.id)),
			db
				.update(videos)
				.set({ createdAt: new Date(1) })
				.where(eq(videos.id, allowedVideo.body.id)),
			db
				.update(audios)
				.set({ createdAt: new Date(0) })
				.where(eq(audios.id, blockedAudio.body.id)),
			db
				.update(audios)
				.set({ createdAt: new Date(1) })
				.where(eq(audios.id, allowedAudio.body.id)),
		]);

		app.locals.authorizedRootRegistry = await createAuthorizedRootRegistry([
			{ id: allowedRootId, path: allowedPath, permissions: ['read', 'index'] },
		]);
		const imageResponse = await request(app).get(`/api/images/by-hash/${'1'.repeat(64)}`);
		const videoResponse = await request(app).get(`/api/videos/by-hash/${'2'.repeat(64)}`);
		const audioResponse = await request(app).get(`/api/audios/by-hash/${'3'.repeat(64)}`);
		expect(imageResponse.status, imageResponse.text).toBe(200);
		expect(videoResponse.status, videoResponse.text).toBe(200);
		expect(audioResponse.status, audioResponse.text).toBe(200);
		expect(imageResponse.body.id).toBe(allowedImage.body.id);
		expect(videoResponse.body.id).toBe(allowedVideo.body.id);
		expect(audioResponse.body.id).toBe(allowedAudio.body.id);
	});
});
