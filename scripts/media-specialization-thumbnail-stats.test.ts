import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eq, inArray } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import {
	assets,
	audios,
	documents,
	folders,
	jsonFiles,
	mediaRoots,
	metadatas,
	sourceFiles,
	videos,
} from '../src/lib/drizzle/schema';
import { documentsEffectRouter } from '../src/server/routes/file-services.effect';
import audiosEffectRouter from '../src/server/routes/audios.effect';
import thumbnailsUnifiedRouter from '../src/server/routes/thumbnails-unified';
import videosEffectRouter from '../src/server/routes/videos.effect';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';
import { syncCanonicalMediaRoots } from '../src/services/media-core/media-root-registry.service';
import { thumbnailUnifiedService } from '../src/services/thumbnail/thumbnail-unified.service';

const ids: string[] = [];
const folderIds: string[] = [];
const rootIds: string[] = [];
const temporaryDirectories: string[] = [];

afterEach(async () => {
	if (ids.length > 0) await db.delete(metadatas).where(inArray(metadatas.entityId, ids));
	for (const folderId of folderIds) {
		await db.delete(audios).where(eq(audios.folderId, folderId));
		await db.delete(documents).where(eq(documents.folderId, folderId));
		await db.delete(jsonFiles).where(eq(jsonFiles.folderId, folderId));
		await db.delete(videos).where(eq(videos.folderId, folderId));
	}
	for (const id of ids.splice(0)) await db.delete(assets).where(eq(assets.id, id));
	for (const folderId of folderIds.splice(0)) await db.delete(folders).where(eq(folders.id, folderId));
	for (const rootId of rootIds.splice(0)) await db.delete(mediaRoots).where(eq(mediaRoots.id, rootId));
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

const insertCanonical = async (input: {
	folderId: string;
	metadata?: string;
	contents?: string;
	path: string;
	rootId: string;
	type: 'audio' | 'document' | 'json' | 'video';
}) => {
	const id = crypto.randomUUID();
	ids.push(id);
	const sourceId = `source-${id}`;
	await writeFile(input.path, input.contents || '12345678');
	await db.transaction(async (transaction: typeof db) => {
		await transaction.insert(sourceFiles).values({
			assetId: id,
			availability: 'available',
			byteSize: 8,
			contentHash: 'a'.repeat(64),
			folderId: input.folderId,
			id: sourceId,
			relativePath: input.path.split(/[\\/]/).pop()!,
			rootId: input.rootId,
		});
		await transaction.insert(assets).values({ assetType: input.type, id, primarySourceFileId: sourceId, title: id });
		if (input.type === 'video') {
			await transaction.insert(videos).values({
				assetId: id,
				duration: 1,
				folderId: input.folderId,
				hash: 'a'.repeat(64),
				id,
				name: id,
				path: input.path,
				size: 8,
				thumbnail: input.metadata,
			});
			return;
		}
		if (input.type === 'json') {
			await transaction.insert(jsonFiles).values({
				assetId: id,
				content: input.contents,
				extension: 'json',
				folderId: input.folderId,
				hash: 'a'.repeat(64),
				id,
				mimeType: 'application/json',
				name: id,
				path: input.path,
				size: 8,
			});
			return;
		}
		const common = {
			assetId: id,
			extension: input.type === 'audio' ? 'mp3' : 'pdf',
			folderId: input.folderId,
			hash: 'a'.repeat(64),
			id,
			mimeType: input.type === 'audio' ? 'audio/mpeg' : 'application/pdf',
			name: id,
			path: input.path,
			size: 8,
		};
		if (input.type === 'audio') await transaction.insert(audios).values({ ...common, metadata: input.metadata });
		else await transaction.insert(documents).values({ ...common, thumbnail: input.metadata });
	});
	return id;
};

describe('media specialization thumbnail stats', () => {
	it('counts only request-authorized roots, real derived data and visible lifecycle rows', async () => {
		const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-thumbnail-stats-'));
		temporaryDirectories.push(directory);
		const allowedPath = resolve(directory, 'allowed');
		const blockedPath = resolve(directory, 'blocked');
		await Promise.all([mkdir(allowedPath), mkdir(blockedPath)]);
		const allowedRootId = `thumbnail-stats-root-${crypto.randomUUID()}`;
		const blockedRootId = `thumbnail-stats-root-${crypto.randomUUID()}`;
		const allowedFolderId = `thumbnail-stats-folder-${crypto.randomUUID()}`;
		const blockedFolderId = `thumbnail-stats-folder-${crypto.randomUUID()}`;
		rootIds.push(allowedRootId, blockedRootId);
		folderIds.push(allowedFolderId, blockedFolderId);
		const registry = await createAuthorizedRootRegistry([
			{ id: allowedRootId, label: 'Allowed stats root', path: allowedPath, permissions: ['read', 'index'] },
		]);
		await syncCanonicalMediaRoots(registry);
		await db.insert(mediaRoots).values({ id: blockedRootId, label: 'Blocked stats root' });
		await db.insert(folders).values([
			{ id: allowedFolderId, name: 'Allowed stats', path: allowedPath },
			{ id: blockedFolderId, name: 'Blocked stats', path: blockedPath },
		]);
		const audioId = await insertCanonical({
			folderId: allowedFolderId,
			metadata: JSON.stringify({ waveform: { data: 'AA==' } }),
			path: resolve(allowedPath, 'waveform.mp3'),
			rootId: allowedRootId,
			type: 'audio',
		});
		const audioBase64Id = await insertCanonical({
			folderId: allowedFolderId,
			metadata: JSON.stringify({ waveformBase64: 'AA==' }),
			path: resolve(allowedPath, 'waveform-base64.mp3'),
			rootId: allowedRootId,
			type: 'audio',
		});
		const documentId = await insertCanonical({
			folderId: allowedFolderId,
			metadata: 'c3Zn',
			path: resolve(allowedPath, 'document.pdf'),
			rootId: allowedRootId,
			type: 'document',
		});
		const metadataDocumentId = await insertCanonical({
			folderId: allowedFolderId,
			path: resolve(allowedPath, 'metadata-document.pdf'),
			rootId: allowedRootId,
			type: 'document',
		});
		const videoId = await insertCanonical({
			folderId: allowedFolderId,
			metadata: Buffer.from('video-thumbnail').toString('base64'),
			path: resolve(allowedPath, 'video.mp4'),
			rootId: allowedRootId,
			type: 'video',
		});
		const canonicalJsonPath = resolve(allowedPath, 'canonical.json');
		const jsonId = await insertCanonical({
			contents: '{"canonicalValue":true}',
			folderId: allowedFolderId,
			path: canonicalJsonPath,
			rootId: allowedRootId,
			type: 'json',
		});
		const outsideJsonPath = resolve(directory, 'outside.json');
		await writeFile(outsideJsonPath, '{"attackerValue":true}');
		await db.update(jsonFiles).set({ path: outsideJsonPath }).where(eq(jsonFiles.id, jsonId));
		await db.insert(metadatas).values({
			entityId: metadataDocumentId,
			entityType: 'document',
			id: `${metadataDocumentId}-thumbnail`,
			key: 'thumbnail',
			value: 'c3Zn',
		});
		await insertCanonical({
			folderId: blockedFolderId,
			metadata: JSON.stringify({ waveformBase64: 'blocked' }),
			path: resolve(blockedPath, 'blocked.mp3'),
			rootId: blockedRootId,
			type: 'audio',
		});
		const malformedId = crypto.randomUUID();
		const malformedPath = resolve(allowedPath, 'malformed.mp3');
		await writeFile(malformedPath, 'x');
		await db.insert(audios).values({
			extension: 'mp3',
			folderId: allowedFolderId,
			hash: 'b'.repeat(64),
			id: malformedId,
			metadata: '{',
			mimeType: 'audio/mpeg',
			name: 'malformed.mp3',
			path: malformedPath,
			size: 1,
		});

		const app = express();
		app.locals.authorizedRootRegistry = registry;
		app.use('/api/audio', audiosEffectRouter);
		app.use('/api/documents', documentsEffectRouter);
		app.use('/api/videos', videosEffectRouter);
		app.use('/api/thumbnails/unified', thumbnailsUnifiedRouter);
		const visible = await request(app).get('/api/thumbnails/unified/stats');
		expect(visible.status, JSON.stringify(visible.body)).toBe(200);
		expect(visible.body.byType.audio).toEqual({ total: 3, withWaveform: 2 });
		expect(visible.body.byType.document).toEqual({ total: 2, withThumbnail: 2 });

		const unifiedWaveform = await request(app).get(`/api/thumbnails/unified/audio/${audioId}`);
		expect(unifiedWaveform.status, unifiedWaveform.text).toBe(200);
		expect(unifiedWaveform.headers['content-type']).toContain('image/png');
		expect(unifiedWaveform.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
		expect(unifiedWaveform.headers.vary).toContain('Cookie');
		expect(unifiedWaveform.headers['x-content-type-options']).toBe('nosniff');

		const legacyWaveform = await request(app).get(`/api/audio/${audioId}/waveform`);
		expect(legacyWaveform.status, legacyWaveform.text).toBe(200);
		expect(legacyWaveform.headers['content-type']).toContain('image/png');
		expect(legacyWaveform.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
		expect(legacyWaveform.headers.vary).toContain('Cookie');
		expect(legacyWaveform.headers['x-content-type-options']).toBe('nosniff');
		expect(legacyWaveform.headers.etag).toBeDefined();
		expect(
			(await request(app).get(`/api/audio/${audioId}/waveform`).set('If-None-Match', legacyWaveform.headers.etag))
				.status
		).toBe(304);

		const documentFallback = await request(app).get(`/api/documents/${documentId}/preview`);
		expect(documentFallback.status, documentFallback.text).toBe(200);
		expect(documentFallback.headers['content-type']).toContain('image/svg+xml');
		expect(documentFallback.headers['cache-control']).toBe('private, no-store');
		expect(documentFallback.headers.vary).toContain('Cookie');
		expect(documentFallback.headers['x-content-type-options']).toBe('nosniff');
		expect(documentFallback.headers['content-security-policy']).toContain("default-src 'none'");

		const missingSourceHandoff = await thumbnailUnifiedService.getThumbnail('jsonFile', jsonId, { force: true });
		expect(missingSourceHandoff).toEqual(expect.objectContaining({ success: false }));
		const canonicalJsonThumbnail = await thumbnailUnifiedService.getThumbnail(
			'jsonFile',
			jsonId,
			{ force: true },
			canonicalJsonPath
		);
		expect(canonicalJsonThumbnail.success).toBe(true);
		const canonicalJsonSvg = canonicalJsonThumbnail.data?.toString('utf8') || '';
		expect(canonicalJsonSvg).toContain('canonicalValue');
		expect(canonicalJsonSvg).not.toContain('attackerValue');

		const videoThumbnail = await request(app).get(`/api/videos/${videoId}/thumbnail`);
		expect(videoThumbnail.status, videoThumbnail.text).toBe(200);
		expect(videoThumbnail.headers['content-type']).toContain('image/jpeg');
		expect(videoThumbnail.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
		expect(videoThumbnail.headers.vary).toContain('Cookie');
		expect(videoThumbnail.headers['x-content-type-options']).toBe('nosniff');
		expect(videoThumbnail.headers.etag).toBeDefined();
		expect(
			(await request(app).get(`/api/videos/${videoId}/thumbnail`).set('If-None-Match', videoThumbnail.headers.etag))
				.status
		).toBe(304);

		await db
			.update(sourceFiles)
			.set({ relativePath: 'missing-waveform.mp3' })
			.where(eq(sourceFiles.assetId, audioBase64Id));
		const unresolvedCanonicalLocation = await request(app).get('/api/thumbnails/unified/stats');
		expect(unresolvedCanonicalLocation.body.byType.audio).toEqual({ total: 2, withWaveform: 1 });

		const unconfigured = express();
		unconfigured.use('/api/thumbnails/unified', thumbnailsUnifiedRouter);
		expect((await request(unconfigured).get('/api/thumbnails/unified/stats')).status).toBe(503);

		await db
			.update(assets)
			.set({ deletedAt: new Date(), status: 'deleted', statusBeforeDeletion: 'active' })
			.where(inArray(assets.id, [audioId, audioBase64Id, documentId, metadataDocumentId]));
		const deleted = await request(app).get('/api/thumbnails/unified/stats');
		expect(deleted.body.byType.audio).toEqual({ total: 1, withWaveform: 0 });
		expect(deleted.body.byType.document).toEqual({ total: 0, withThumbnail: 0 });
	});
});
