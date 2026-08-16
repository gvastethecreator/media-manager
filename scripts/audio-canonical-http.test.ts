import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { assets, audios, folders, mediaRoots, sourceFiles } from '../src/lib/drizzle/schema';
import audiosRouter from '../src/server/routes/audios.effect';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';
import { syncCanonicalMediaRoots } from '../src/services/media-core/media-root-registry.service';

const temporaryDirectories: string[] = [];
const createdFolderIds: string[] = [];
const createdRootIds: string[] = [];
const createdAudioIds: string[] = [];

afterEach(async () => {
	for (const id of createdAudioIds.splice(0)) {
		await db.delete(audios).where(eq(audios.id, id));
		await db.delete(assets).where(eq(assets.id, id));
	}
	for (const id of createdFolderIds.splice(0)) await db.delete(folders).where(eq(folders.id, id));
	for (const id of createdRootIds.splice(0)) await db.delete(mediaRoots).where(eq(mediaRoots.id, id));
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('canonical Audio HTTP lifecycle', () => {
	it('creates through an opaque source and protects waveform, lifecycle and missing files', async () => {
		const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-audio-http-'));
		temporaryDirectories.push(directory);
		const rootPath = resolve(directory, 'library');
		await mkdir(rootPath);
		const audioPath = resolve(rootPath, 'track.mp3');
		await writeFile(audioPath, 'audio');
		const rootId = `root-${crypto.randomUUID()}`;
		const folderId = crypto.randomUUID();
		createdRootIds.push(rootId);
		createdFolderIds.push(folderId);
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, label: 'HTTP audio library', path: rootPath, permissions: ['read', 'index', 'write', 'delete'] },
		]);
		await syncCanonicalMediaRoots(registry);
		await db.insert(folders).values({ id: folderId, name: 'HTTP audios', path: rootPath });
		const app = express();
		app.locals.authorizedRootRegistry = registry;
		app.use(express.json());
		app.use('/api/audios', audiosRouter);

		const response = await request(app)
			.post('/api/audios')
			.send({
				album: null,
				albumArtist: null,
				artist: null,
				bitrate: 320_000,
				bpm: null,
				channels: 2,
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
				hash: 'c'.repeat(64),
				isArchived: false,
				isFavorite: false,
				key: null,
				lyrics: null,
				mimeType: 'audio/mpeg',
				mood: null,
				name: 'track.mp3',
				path: resolve(directory, 'attacker.mp3'),
				sampleRate: 44_100,
				size: 5,
				source: { relativePath: 'track.mp3', rootId },
				title: 'Track',
				track: null,
				year: null,
			});

		expect(response.status, JSON.stringify(response.body)).toBe(201);
		expect(response.body).toEqual(
			expect.objectContaining({ assetId: response.body.id, canonicalState: 'canonical', id: expect.any(String) })
		);
		expect(JSON.stringify(response.body)).not.toContain(directory);
		createdAudioIds.push(response.body.id);
		expect(await db.select().from(audios).where(eq(audios.id, response.body.id))).toEqual([
			expect.objectContaining({ assetId: response.body.id, path: audioPath }),
		]);
		expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, response.body.id))).toEqual([
			expect.objectContaining({ relativePath: 'track.mp3', rootId }),
		]);
		const updated = await request(app).patch(`/api/audios/${response.body.id}`).send({ title: 'Renamed track' });
		expect(updated.status, JSON.stringify(updated.body)).toBe(200);
		expect(updated.body.title).toBe('Renamed track');
		expect((await request(app).get(`/api/audios/${response.body.id}/waveform`)).status).toBe(200);

		const rawPath = await request(app)
			.post('/api/audios')
			.send({
				extension: 'mp3',
				folderId,
				hash: 'd'.repeat(64),
				mimeType: 'audio/mpeg',
				name: 'raw.mp3',
				path: audioPath,
				size: 5,
			});
		expect(rawPath.status).toBe(400);

		expect((await request(app).delete(`/api/audios/${response.body.id}`)).status).toBe(204);
		expect(await db.select().from(audios).where(eq(audios.id, response.body.id))).toHaveLength(1);
		expect((await request(app).get(`/api/audios/${response.body.id}/waveform`)).status).toBe(404);
		expect((await request(app).get('/api/audios')).body).toEqual([]);
		expect((await request(app).get(`/api/audios/folder/${folderId}/count`)).body).toEqual({ count: 0 });

		const restored = await request(app).post(`/api/audios/${response.body.id}/restore`);
		expect(restored.status, JSON.stringify(restored.body)).toBe(200);
		expect(restored.body).toEqual(expect.objectContaining({ canonicalState: 'canonical', id: response.body.id }));
		expect((await request(app).get(`/api/audios/folder/${folderId}/count`)).body).toEqual({ count: 1 });

		await rm(audioPath);
		expect((await request(app).delete(`/api/audios/${response.body.id}`)).status).toBe(204);
		expect((await request(app).post(`/api/audios/${response.body.id}/restore`)).status).toBe(200);
		const batchDelete = await request(app)
			.delete('/api/audios/batch')
			.send({ ids: [response.body.id] });
		expect(batchDelete.status, JSON.stringify(batchDelete.body)).toBe(200);
		expect(batchDelete.body).toEqual({ deletedCount: 1 });
	});
});
