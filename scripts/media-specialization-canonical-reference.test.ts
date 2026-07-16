import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
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
} from '../src/lib/drizzle/schema';
import {
	getMediaAssetLocation,
	MediaAssetLocationConflictError,
	resolveMediaAssetReference,
	type MediaAssetReference,
	updateMediaAssetLocation,
} from '../src/server/security/media-asset-reference';
import { createAuthorizedRootRegistry, RootAuthorizationError } from '../src/server/security/authorized-roots';

type Specialization = MediaAssetReference['assetType'] & ('audio' | 'document' | 'json' | 'file3d');
type Fixture = Awaited<ReturnType<typeof createFixture>>;

const cases: Array<{ extension: string; mimeType: string; type: Specialization }> = [
	{ extension: 'mp3', mimeType: 'audio/mpeg', type: 'audio' },
	{ extension: 'pdf', mimeType: 'application/pdf', type: 'document' },
	{ extension: 'json', mimeType: 'application/json', type: 'json' },
	{ extension: 'glb', mimeType: 'model/gltf-binary', type: 'file3d' },
];
const temporaryDirectories: string[] = [];
const fixtures: Fixture[] = [];

const deleteSpecialization = async (type: Specialization, id: string) => {
	switch (type) {
		case 'audio':
			await db.delete(audios).where(eq(audios.id, id));
			break;
		case 'document':
			await db.delete(documents).where(eq(documents.id, id));
			break;
		case 'json':
			await db.delete(jsonFiles).where(eq(jsonFiles.id, id));
			break;
		case 'file3d':
			await db.delete(file3Ds).where(eq(file3Ds.id, id));
			break;
	}
};

const insertSpecialization = async (
	type: Specialization,
	row: {
		assetId: string;
		extension: string;
		folderId: string;
		id: string;
		mimeType: string;
		name: string;
		path: string;
	},
	database: typeof db = db
) => {
	const common = { ...row, hash: 'a'.repeat(64), size: 8 };
	switch (type) {
		case 'audio':
			await database.insert(audios).values(common);
			break;
		case 'document':
			await database.insert(documents).values(common);
			break;
		case 'json':
			await database.insert(jsonFiles).values(common);
			break;
		case 'file3d':
			await database.insert(file3Ds).values(common);
			break;
	}
};

const getSpecializationLocation = async (type: Specialization, id: string) => {
	switch (type) {
		case 'audio':
			return (
				await db
					.select({ assetId: audios.assetId, name: audios.name, path: audios.path })
					.from(audios)
					.where(eq(audios.id, id))
			)[0];
		case 'document':
			return (
				await db
					.select({ assetId: documents.assetId, name: documents.name, path: documents.path })
					.from(documents)
					.where(eq(documents.id, id))
			)[0];
		case 'json':
			return (
				await db
					.select({ assetId: jsonFiles.assetId, name: jsonFiles.name, path: jsonFiles.path })
					.from(jsonFiles)
					.where(eq(jsonFiles.id, id))
			)[0];
		case 'file3d':
			return (
				await db
					.select({ assetId: file3Ds.assetId, name: file3Ds.name, path: file3Ds.path })
					.from(file3Ds)
					.where(eq(file3Ds.id, id))
			)[0];
	}
};

afterEach(async () => {
	for (const fixture of fixtures.splice(0)) {
		await deleteSpecialization(fixture.type, fixture.id);
		await db.delete(assets).where(eq(assets.id, fixture.id));
		await db.delete(folders).where(eq(folders.id, fixture.folderId));
		await db.delete(mediaRoots).where(eq(mediaRoots.id, fixture.rootId));
	}
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

async function createFixture(testCase: (typeof cases)[number]) {
	const id = crypto.randomUUID();
	const container = await mkdtemp(join(tmpdir(), `media-manager-${testCase.type}-reference-`));
	temporaryDirectories.push(container);
	const rootPath = resolve(container, 'library');
	const folderPath = resolve(rootPath, testCase.type);
	await mkdir(folderPath, { recursive: true });
	const originalName = `original.${testCase.extension}`;
	const destinationName = `renamed.${testCase.extension}`;
	const originalPath = resolve(folderPath, originalName);
	const destinationPath = resolve(folderPath, destinationName);
	await Promise.all([writeFile(originalPath, 'original'), writeFile(destinationPath, 'renamed!')]);
	const rootId = `root-${id}`;
	const folderId = `folder-${id}`;
	const sourceId = `source-${id}`;
	await db.insert(mediaRoots).values({ id: rootId, label: `Canonical ${testCase.type} reference root` });
	await db.insert(folders).values({ id: folderId, name: testCase.type, path: folderPath });
	await db.transaction(async (transaction: typeof db) => {
		await transaction.insert(sourceFiles).values({
			assetId: id,
			availability: 'available',
			byteSize: 8,
			contentHash: 'a'.repeat(64),
			folderId,
			id: sourceId,
			relativePath: `${testCase.type}/${originalName}`,
			rootId,
		});
		await transaction.insert(assets).values({
			assetType: testCase.type,
			id,
			primarySourceFileId: sourceId,
			title: originalName,
		});
		await insertSpecialization(
			testCase.type,
			{
				assetId: id,
				extension: testCase.extension,
				folderId,
				id,
				mimeType: testCase.mimeType,
				name: originalName,
				path: originalPath,
			},
			transaction
		);
	});
	const registry = await createAuthorizedRootRegistry([
		{ id: rootId, path: rootPath, permissions: ['read', 'index', 'write', 'delete'] },
	]);
	const fixture = {
		destinationName,
		destinationPath,
		folderId,
		id,
		originalName,
		originalPath,
		registry,
		rootId,
		sourceId,
		type: testCase.type,
	};
	fixtures.push(fixture);
	return fixture;
}

describe('canonical Audio, Document, JSON and File3D media references', () => {
	it('resolves and atomically updates every specialization through SourceFile', async () => {
		for (const testCase of cases) {
			const fixture = await createFixture(testCase);
			const reference = { assetId: fixture.id, assetType: fixture.type };
			expect(await resolveMediaAssetReference(fixture.registry, reference, 'read')).toEqual(
				expect.objectContaining({ relativePath: `${fixture.type}/${fixture.originalName}`, rootId: fixture.rootId })
			);

			await updateMediaAssetLocation(reference, fixture.originalPath, {
				name: fixture.destinationName,
				path: fixture.destinationPath,
				source: { relativePath: `${fixture.type}/${fixture.destinationName}`, rootId: fixture.rootId },
			});
			expect(await getMediaAssetLocation(reference)).toEqual({
				folderId: fixture.folderId,
				name: fixture.destinationName,
				path: fixture.destinationPath,
				source: { relativePath: `${fixture.type}/${fixture.destinationName}`, rootId: fixture.rootId },
			});
			expect(await getSpecializationLocation(fixture.type, fixture.id)).toEqual(
				expect.objectContaining({ assetId: fixture.id, name: fixture.destinationName, path: fixture.destinationPath })
			);
			expect(await db.select().from(assets).where(eq(assets.id, fixture.id))).toEqual([
				expect.objectContaining({ title: fixture.destinationName }),
			]);
			await expect(
				updateMediaAssetLocation(reference, fixture.destinationPath, {
					name: 'incompatible.txt',
					path: `${fixture.destinationPath}.txt`,
					source: { relativePath: `${fixture.type}/incompatible.txt`, rootId: fixture.rootId },
				})
			).rejects.toBeInstanceOf(MediaAssetLocationConflictError);
			expect(await getMediaAssetLocation(reference)).toEqual(
				expect.objectContaining({ name: fixture.destinationName, path: fixture.destinationPath })
			);
		}
	});

	it('fails closed on divergence and hides tombstones for every specialization', async () => {
		for (const testCase of cases) {
			const fixture = await createFixture(testCase);
			const reference = { assetId: fixture.id, assetType: fixture.type };
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
			).resolves.toEqual(expect.objectContaining({ relativePath: `${fixture.type}/${fixture.originalName}` }));
		}
	});
});
