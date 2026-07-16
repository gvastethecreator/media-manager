import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/drizzle';
import { assets, folders, images, mediaRoots, sourceFiles } from '../src/lib/drizzle/schema';
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
		await db.delete(images).where(eq(images.id, id));
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
	const container = await mkdtemp(join(tmpdir(), 'media-manager-canonical-reference-'));
	temporaryDirectories.push(container);
	const rootPath = resolve(container, 'library');
	await mkdir(resolve(rootPath, 'images'), { recursive: true });
	const originalPath = resolve(rootPath, 'images', 'original.jpg');
	const destinationPath = resolve(rootPath, 'images', 'renamed.jpg');
	await Promise.all([writeFile(originalPath, 'original'), writeFile(destinationPath, 'destination')]);
	const rootId = `root-${id}`;
	const folderId = `folder-${id}`;
	const sourceId = `source-${id}`;
	await db.insert(mediaRoots).values({ id: rootId, label: 'Canonical reference root' });
	await db.insert(folders).values({ id: folderId, name: 'Images', path: resolve(rootPath, 'images') });
	await db.transaction(async (transaction: typeof db) => {
		await transaction.insert(sourceFiles).values({
			id: sourceId,
			assetId: id,
			rootId,
			relativePath: 'images/original.jpg',
			folderId,
			contentHash: 'a'.repeat(64),
			byteSize: 8,
			availability: 'available',
		});
		await transaction.insert(assets).values({
			id,
			assetType: 'image',
			title: 'original.jpg',
			primarySourceFileId: sourceId,
		});
		await transaction.insert(images).values({
			id,
			assetId: id,
			name: 'original.jpg',
			path: originalPath,
			hash: 'a'.repeat(64),
			size: 8,
			width: 1,
			height: 1,
			folderId,
		});
	});
	const registry = await createAuthorizedRootRegistry([
		{ id: rootId, path: rootPath, permissions: ['read', 'index', 'write', 'delete'] },
	]);
	return { destinationPath, folderId, id, originalPath, registry, rootId, sourceId };
}

describe('canonical Image media references', () => {
	it('authorizes through SourceFile and atomically updates canonical plus legacy locations', async () => {
		const fixture = await createFixture();
		const reference = { assetId: fixture.id, assetType: 'image' as const };

		const resolved = await resolveMediaAssetReference(fixture.registry, reference, 'read');
		expect(resolved).toEqual(expect.objectContaining({ relativePath: 'images/original.jpg', rootId: fixture.rootId }));

		await updateMediaAssetLocation(reference, fixture.originalPath, {
			name: 'renamed.jpg',
			path: fixture.destinationPath,
			source: { relativePath: 'images/renamed.jpg', rootId: fixture.rootId },
		});
		const location = await getMediaAssetLocation(reference);
		expect(location).toEqual({
			folderId: fixture.folderId,
			name: 'renamed.jpg',
			path: fixture.destinationPath,
			source: { relativePath: 'images/renamed.jpg', rootId: fixture.rootId },
		});
		expect(await db.select().from(sourceFiles).where(eq(sourceFiles.id, fixture.sourceId))).toEqual([
			expect.objectContaining({ relativePath: 'images/renamed.jpg', rootId: fixture.rootId }),
		]);
		expect(await db.select().from(assets).where(eq(assets.id, fixture.id))).toEqual([
			expect.objectContaining({ title: 'renamed.jpg' }),
		]);
	});

	it('fails closed when canonical and legacy paths diverge', async () => {
		const fixture = await createFixture();
		await db.update(images).set({ path: fixture.destinationPath }).where(eq(images.id, fixture.id));

		await expect(
			resolveMediaAssetReference(fixture.registry, { assetId: fixture.id, assetType: 'image' }, 'read')
		).rejects.toMatchObject<Partial<RootAuthorizationError>>({ code: 'ROOT_PATH_CONFLICT', status: 409 });
	});

	it('fails closed when canonical content metadata diverges even if both paths still match', async () => {
		const fixture = await createFixture();
		await db.update(sourceFiles).set({ byteSize: 9 }).where(eq(sourceFiles.assetId, fixture.id));

		await expect(
			resolveMediaAssetReference(fixture.registry, { assetId: fixture.id, assetType: 'image' }, 'read')
		).rejects.toMatchObject<Partial<RootAuthorizationError>>({ code: 'ROOT_PATH_CONFLICT', status: 409 });
	});
});
