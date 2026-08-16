import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/drizzle';
import { assets, folders, mediaRoots, sourceFiles, videos } from '../src/lib/drizzle/schema';
import {
	getMediaAssetLocation,
	resolveMediaAssetReference,
	updateMediaAssetLocation,
} from '../src/server/security/media-asset-reference';
import { createAuthorizedRootRegistry, RootAuthorizationError } from '../src/server/security/authorized-roots';

const temporaryDirectories: string[] = [];
const createdIds: string[] = [];

afterEach(async () => {
	for (const id of createdIds.splice(0)) {
		await db.delete(videos).where(eq(videos.id, id));
		await db.delete(assets).where(eq(assets.id, id));
		await db.delete(folders).where(eq(folders.id, `folder-${id}`));
		await db.delete(mediaRoots).where(eq(mediaRoots.id, `root-${id}`));
	}
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

async function createFixture() {
	const id = crypto.randomUUID();
	createdIds.push(id);
	const container = await mkdtemp(join(tmpdir(), 'media-manager-video-reference-'));
	temporaryDirectories.push(container);
	const rootPath = resolve(container, 'library');
	await mkdir(resolve(rootPath, 'videos'), { recursive: true });
	const originalPath = resolve(rootPath, 'videos', 'original.mp4');
	const destinationPath = resolve(rootPath, 'videos', 'renamed.mp4');
	await Promise.all([writeFile(originalPath, 'original'), writeFile(destinationPath, 'renamed!')]);
	const rootId = `root-${id}`;
	const folderId = `folder-${id}`;
	const sourceId = `source-${id}`;
	await db.insert(mediaRoots).values({ id: rootId, label: 'Canonical Video reference root' });
	await db.insert(folders).values({ id: folderId, name: 'Videos', path: resolve(rootPath, 'videos') });
	await db.transaction(async (transaction: typeof db) => {
		await transaction.insert(sourceFiles).values({
			id: sourceId,
			assetId: id,
			rootId,
			relativePath: 'videos/original.mp4',
			folderId,
			contentHash: 'a'.repeat(64),
			byteSize: 8,
			availability: 'available',
		});
		await transaction.insert(assets).values({
			id,
			assetType: 'video',
			title: 'original.mp4',
			primarySourceFileId: sourceId,
		});
		await transaction.insert(videos).values({
			id,
			assetId: id,
			name: 'original.mp4',
			path: originalPath,
			hash: 'a'.repeat(64),
			size: 8,
			duration: 1,
			folderId,
		});
	});
	const registry = await createAuthorizedRootRegistry([
		{ id: rootId, path: rootPath, permissions: ['read', 'index', 'write', 'delete'] },
	]);
	return { destinationPath, folderId, id, originalPath, registry, rootId, sourceId };
}

describe('canonical Video media references', () => {
	it('authorizes through SourceFile and atomically updates canonical plus compatibility locations', async () => {
		const fixture = await createFixture();
		const reference = { assetId: fixture.id, assetType: 'video' as const };

		const resolved = await resolveMediaAssetReference(fixture.registry, reference, 'read');
		expect(resolved).toEqual(expect.objectContaining({ relativePath: 'videos/original.mp4', rootId: fixture.rootId }));

		await updateMediaAssetLocation(reference, fixture.originalPath, {
			name: 'renamed.mp4',
			path: fixture.destinationPath,
			source: { relativePath: 'videos/renamed.mp4', rootId: fixture.rootId },
		});
		expect(await getMediaAssetLocation(reference)).toEqual({
			folderId: fixture.folderId,
			name: 'renamed.mp4',
			path: fixture.destinationPath,
			source: { relativePath: 'videos/renamed.mp4', rootId: fixture.rootId },
		});
		expect(await db.select().from(sourceFiles).where(eq(sourceFiles.id, fixture.sourceId))).toEqual([
			expect.objectContaining({ relativePath: 'videos/renamed.mp4', rootId: fixture.rootId }),
		]);
		expect(await db.select().from(assets).where(eq(assets.id, fixture.id))).toEqual([
			expect.objectContaining({ title: 'renamed.mp4' }),
		]);
	});

	it('fails closed on canonical divergence and hides tombstones unless explicitly allowed', async () => {
		const fixture = await createFixture();
		const reference = { assetId: fixture.id, assetType: 'video' as const };
		await db.update(sourceFiles).set({ byteSize: 9 }).where(eq(sourceFiles.assetId, fixture.id));
		await expect(resolveMediaAssetReference(fixture.registry, reference, 'read')).rejects.toMatchObject<
			Partial<RootAuthorizationError>
		>({ code: 'ROOT_PATH_CONFLICT', status: 409 });

		await db.update(sourceFiles).set({ byteSize: 8 }).where(eq(sourceFiles.assetId, fixture.id));
		await db
			.update(assets)
			.set({ deletedAt: new Date(), status: 'deleted', statusBeforeDeletion: 'active' })
			.where(eq(assets.id, fixture.id));
		await expect(resolveMediaAssetReference(fixture.registry, reference, 'read')).rejects.toMatchObject<
			Partial<RootAuthorizationError>
		>({ code: 'ROOT_PATH_NOT_FOUND', status: 404 });
		await expect(
			resolveMediaAssetReference(fixture.registry, reference, 'read', { allowDeleted: true })
		).resolves.toEqual(expect.objectContaining({ relativePath: 'videos/original.mp4' }));
	});
});
