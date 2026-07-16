import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { inArray } from 'drizzle-orm';
import { db } from '../src/lib/drizzle';
import {
	assets,
	audios,
	documents,
	file3Ds,
	folders,
	jsonFiles,
	mediaRoots,
	sourceFiles,
	videos,
} from '../src/lib/drizzle/schema';
import { FileEntityMapperCore } from '../src/services/file-entity-mapper/core.service';
import { formatVideoDurationSeconds } from '../src/services/file-entity-mapper/processors/video.processor';
import {
	getConfiguredMediaRootRegistry,
	resetConfiguredMediaSourceCache,
} from '../src/server/security/configured-media-source';
import { ROOT_GRANTS_ENV } from '../src/server/security/authorized-roots';
import { syncCanonicalMediaRoots } from '../src/services/media-core/media-root-registry.service';

const temporaryDirectories: string[] = [];
const folderIds: string[] = [];
const rootIds: string[] = [];
const assetIds: string[] = [];
let previousRootGrants: string | undefined;

afterEach(async () => {
	if (assetIds.length > 0) {
		const ids = assetIds.splice(0);
		await db.transaction(async (transaction: typeof db) => {
			await transaction.delete(videos).where(inArray(videos.assetId, ids));
			await transaction.delete(audios).where(inArray(audios.assetId, ids));
			await transaction.delete(documents).where(inArray(documents.assetId, ids));
			await transaction.delete(jsonFiles).where(inArray(jsonFiles.assetId, ids));
			await transaction.delete(file3Ds).where(inArray(file3Ds.assetId, ids));
			await transaction.delete(assets).where(inArray(assets.id, ids));
		});
	}
	for (const folderId of folderIds.splice(0)) await db.delete(folders).where(inArray(folders.id, [folderId]));
	for (const rootId of rootIds.splice(0)) await db.delete(mediaRoots).where(inArray(mediaRoots.id, [rootId]));
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
	if (previousRootGrants === undefined) delete process.env[ROOT_GRANTS_ENV];
	else process.env[ROOT_GRANTS_ENV] = previousRootGrants;
	previousRootGrants = undefined;
	resetConfiguredMediaSourceCache();
});

describe('real canonical media ingestion', () => {
	it('derives sources for every remaining family and keeps duplicate content as distinct Assets', async () => {
		const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-ingestion-'));
		temporaryDirectories.push(directory);
		const rootPath = resolve(directory, 'library');
		await mkdir(rootPath);
		const rootId = `ingestion-root-${crypto.randomUUID()}`;
		const folderId = crypto.randomUUID();
		rootIds.push(rootId);
		folderIds.push(folderId);
		previousRootGrants = process.env[ROOT_GRANTS_ENV];
		process.env[ROOT_GRANTS_ENV] = JSON.stringify([
			{ id: rootId, label: 'Ingestion root', path: rootPath, permissions: ['read', 'index'] },
		]);
		resetConfiguredMediaSourceCache();
		await syncCanonicalMediaRoots(await getConfiguredMediaRootRegistry());
		await db.insert(folders).values({ id: folderId, name: 'Ingestion folder', path: rootPath });

		const families = [
			{ expectedType: 'video', extension: 'mp4' },
			{ expectedType: 'audio', extension: 'mp3' },
			{ expectedType: 'document', extension: 'txt' },
			{ expectedType: 'jsonFile', extension: 'json' },
			{ expectedType: 'file3d', extension: 'obj' },
		] as const;
		const mapper = FileEntityMapperCore.getInstance();
		for (const family of families) {
			const firstPath = resolve(rootPath, `${family.expectedType}-first.${family.extension}`);
			const secondPath = resolve(rootPath, `${family.expectedType}-second.${family.extension}`);
			const content = family.expectedType === 'jsonFile' ? '{"same":true}' : `same-${family.expectedType}`;
			await Promise.all([writeFile(firstPath, content), writeFile(secondPath, content)]);

			const first = await mapper.createBasicEntityFromFile(firstPath, folderId);
			const second = await mapper.createBasicEntityFromFile(secondPath, folderId);
			expect(first, first.error).toEqual(
				expect.objectContaining({ entityId: expect.any(String), entityType: family.expectedType, success: true })
			);
			expect(second, second.error).toEqual(
				expect.objectContaining({ entityId: expect.any(String), entityType: family.expectedType, success: true })
			);
			expect(second.entityId).not.toBe(first.entityId);
			assetIds.push(first.entityId!, second.entityId!);

			const repeatedLocation = await mapper.createBasicEntityFromFile(firstPath, folderId);
			expect(repeatedLocation).toEqual(
				expect.objectContaining({ entityType: family.expectedType, error: 'Entity already exists', success: true })
			);
		}

		expect(await db.select({ id: assets.id }).from(assets).where(inArray(assets.id, assetIds))).toHaveLength(10);
		expect(
			await db.select({ id: sourceFiles.id }).from(sourceFiles).where(inArray(sourceFiles.assetId, assetIds))
		).toHaveLength(10);
		expect(formatVideoDurationSeconds(120)).toBe(120);
	});
});
