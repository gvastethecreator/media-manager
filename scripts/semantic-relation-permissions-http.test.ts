import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { inArray } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { assets, mediaRoots, sourceFiles } from '../src/lib/drizzle/schema/media-core/assets';
import { images } from '../src/lib/drizzle/schema/files/images';
import { folders } from '../src/lib/drizzle/schema/organization/folders';
import { semanticRelations } from '../src/lib/drizzle/schema/relations/semantic';
import { notes } from '../src/lib/drizzle/schema/taxonomy/notes';
import { taxonomyArtifacts } from '../src/lib/drizzle/schema/taxonomy/artifacts';
import semanticRelationsRouter from '../src/server/routes/semantic-relations';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';

const entityIds: string[] = [];
const assetIds: string[] = [];
const folderIds: string[] = [];
const relationIds: string[] = [];
const rootIds: string[] = [];
const temporaryDirectories: string[] = [];

function createApp(registry: Awaited<ReturnType<typeof createAuthorizedRootRegistry>>) {
	const app = express();
	app.locals.authorizedRootRegistry = registry;
	app.use(express.json());
	app.use('/api/semantic-relations', semanticRelationsRouter);
	return app;
}

async function createMixedEndpointFixture(label: string) {
	const rootPath = await mkdtemp(join(tmpdir(), 'media-manager-semantic-mixed-permissions-'));
	temporaryDirectories.push(rootPath);
	const suffix = crypto.randomUUID();
	const rootId = `semantic-mixed-root-${suffix}`;
	const folderId = `semantic-mixed-folder-${suffix}`;
	const assetId = `semantic-mixed-asset-${suffix}`;
	const sourceId = `semantic-mixed-source-${suffix}`;
	const noteId = `semantic-mixed-note-${suffix}`;
	const assetName = 'asset.png';
	const assetPath = resolve(rootPath, assetName);
	rootIds.push(rootId);
	folderIds.push(folderId);
	assetIds.push(assetId);
	entityIds.push(noteId);
	await writeFile(assetPath, 'asset');
	await db.insert(mediaRoots).values({ id: rootId, label });
	await db.insert(folders).values({ id: folderId, name: label, path: rootPath });
	await db.transaction(async (transaction: typeof db) => {
		await transaction.insert(sourceFiles).values({
			assetId,
			availability: 'available',
			byteSize: 5,
			contentHash: 'a'.repeat(64),
			folderId,
			id: sourceId,
			relativePath: assetName,
			rootId,
		});
		await transaction.insert(assets).values({
			assetType: 'image',
			id: assetId,
			primarySourceFileId: sourceId,
			title: assetName,
		});
		await transaction.insert(images).values({
			assetId,
			folderId,
			hash: 'a'.repeat(64),
			height: 1,
			id: assetId,
			name: assetName,
			path: assetPath,
			size: 5,
			width: 1,
		});
	});
	await db.insert(notes).values({ id: noteId, title: `${label} note` });
	await db.insert(taxonomyArtifacts).values({
		byteSize: 5,
		contentHash: 'b'.repeat(64),
		entityId: noteId,
		entityType: 'note',
		indexedBody: label,
		indexedTitle: label,
		relativePath: `taxonomy/notes/${noteId}.md`,
		rootId,
	});
	return { assetId, folderId, noteId, rootId, rootPath };
}

afterEach(async () => {
	if (relationIds.length > 0) await db.delete(semanticRelations).where(inArray(semanticRelations.id, relationIds));
	if (entityIds.length > 0) {
		await db.delete(taxonomyArtifacts).where(inArray(taxonomyArtifacts.entityId, entityIds));
		await db.delete(notes).where(inArray(notes.id, entityIds));
	}
	if (assetIds.length > 0) {
		await db.delete(images).where(inArray(images.id, assetIds));
		await db.delete(assets).where(inArray(assets.id, assetIds));
	}
	if (folderIds.length > 0) await db.delete(folders).where(inArray(folders.id, folderIds));
	assetIds.splice(0);
	folderIds.splice(0);
	if (rootIds.length > 0) await db.delete(mediaRoots).where(inArray(mediaRoots.id, rootIds));
	entityIds.splice(0);
	relationIds.splice(0);
	rootIds.splice(0);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('semantic relation root permissions', () => {
	it('permits reads, requires write for mutations and delete for relation removal', async () => {
		const rootPath = await mkdtemp(join(tmpdir(), 'media-manager-semantic-permissions-'));
		temporaryDirectories.push(rootPath);
		const rootId = `semantic-root-${crypto.randomUUID()}`;
		const sourceId = `semantic-source-${crypto.randomUUID()}`;
		const targetId = `semantic-target-${crypto.randomUUID()}`;
		const relationId = `semantic-rel-${crypto.randomUUID()}`;
		rootIds.push(rootId);
		entityIds.push(sourceId, targetId);
		relationIds.push(relationId);
		await db.insert(mediaRoots).values({ id: rootId, label: 'Semantic permission root' });
		await db.insert(notes).values([
			{ id: sourceId, title: `Source ${sourceId}` },
			{ id: targetId, title: `Target ${targetId}` },
		]);
		await db.insert(taxonomyArtifacts).values(
			[sourceId, targetId].map((entityId) => ({
				byteSize: 10,
				contentHash: 'f'.repeat(64),
				entityId,
				entityType: 'note' as const,
				indexedBody: 'Semantic body',
				indexedTitle: entityId,
				relativePath: `taxonomy/notes/${entityId}.md`,
				rootId,
			}))
		);
		await db.insert(semanticRelations).values({
			id: relationId,
			roleKey: 'references',
			roleSlug: 'references',
			sourceId,
			sourceType: 'note',
			targetId,
			targetType: 'note',
		});
		const input = {
			roleSlug: null,
			source: { id: sourceId, type: 'note' },
			target: { id: targetId, type: 'note' },
		};

		const readOnlyApp = createApp(
			await createAuthorizedRootRegistry([{ id: rootId, path: rootPath, permissions: ['read', 'index'] }])
		);
		expect((await request(readOnlyApp).get(`/api/semantic-relations/${relationId}`)).status).toBe(200);
		for (const response of [
			await request(readOnlyApp).post('/api/semantic-relations').send(input),
			await request(readOnlyApp).put(`/api/semantic-relations/${relationId}`).send(input),
			await request(readOnlyApp).delete(`/api/semantic-relations/${relationId}`),
		]) {
			expect(response.status, JSON.stringify(response.body)).toBe(403);
			expect(response.body).toMatchObject({ code: 'ROOT_PERMISSION_DENIED' });
		}
		await db.delete(semanticRelations).where(inArray(semanticRelations.id, [relationId]));

		const writeOnlyDeleteDeniedApp = createApp(
			await createAuthorizedRootRegistry([{ id: rootId, path: rootPath, permissions: ['read', 'index', 'write'] }])
		);
		const created = await request(writeOnlyDeleteDeniedApp).post('/api/semantic-relations').send(input);
		expect(created.status, JSON.stringify(created.body)).toBe(201);
		relationIds.push(created.body.id);
		const deniedDelete = await request(writeOnlyDeleteDeniedApp).delete(`/api/semantic-relations/${created.body.id}`);
		expect(deniedDelete.status).toBe(403);
		expect(deniedDelete.body).toMatchObject({ code: 'ROOT_PERMISSION_DENIED' });
	});

	it('hides stored relations when a taxonomy root is withdrawn', async () => {
		const rootId = `semantic-withdrawn-root-${crypto.randomUUID()}`;
		const sourceId = `semantic-withdrawn-source-${crypto.randomUUID()}`;
		const targetId = `semantic-withdrawn-target-${crypto.randomUUID()}`;
		const relationId = `semantic-withdrawn-rel-${crypto.randomUUID()}`;
		rootIds.push(rootId);
		entityIds.push(sourceId, targetId);
		relationIds.push(relationId);
		await db.insert(mediaRoots).values({ id: rootId, label: 'Withdrawn semantic root' });
		await db.insert(notes).values([
			{ id: sourceId, title: `Source ${sourceId}` },
			{ id: targetId, title: `Target ${targetId}` },
		]);
		await db.insert(taxonomyArtifacts).values(
			[sourceId, targetId].map((entityId) => ({
				byteSize: 10,
				contentHash: '1'.repeat(64),
				entityId,
				entityType: 'note' as const,
				indexedBody: 'Withdrawn body',
				indexedTitle: entityId,
				relativePath: `taxonomy/notes/${entityId}.md`,
				rootId,
			}))
		);
		await db.insert(semanticRelations).values({
			id: relationId,
			roleKey: 'references',
			roleSlug: 'references',
			sourceId,
			sourceType: 'note',
			targetId,
			targetType: 'note',
		});
		const app = createApp(await createAuthorizedRootRegistry([]));
		const withdrawn = await request(app).get(`/api/semantic-relations/${relationId}`);
		const missing = await request(app).get('/api/semantic-relations/missing-relation');
		expect(withdrawn.status).toBe(404);
		expect(withdrawn.body).toEqual(missing.body);
		expect((await request(app).delete(`/api/semantic-relations/${relationId}`)).status).toBe(404);
	});

	it('denies mutations for stored Asset and Folder relations when their root lacks write or delete', async () => {
		const fixture = await createMixedEndpointFixture('Mixed endpoint permissions');
		const assetRelationId = `semantic-asset-relation-${crypto.randomUUID()}`;
		const folderRelationId = `semantic-folder-relation-${crypto.randomUUID()}`;
		relationIds.push(assetRelationId, folderRelationId);
		await db.insert(semanticRelations).values([
			{
				id: assetRelationId,
				roleKey: 'references',
				roleSlug: 'references',
				sourceId: fixture.assetId,
				sourceType: 'asset',
				targetId: fixture.noteId,
				targetType: 'note',
			},
			{
				id: folderRelationId,
				roleKey: 'references',
				roleSlug: 'references',
				sourceId: fixture.folderId,
				sourceType: 'folder',
				targetId: fixture.noteId,
				targetType: 'note',
			},
		]);
		const app = createApp(
			await createAuthorizedRootRegistry([
				{ id: fixture.rootId, path: fixture.rootPath, permissions: ['read', 'index'] },
			])
		);

		for (const [relationId, source] of [
			[assetRelationId, { id: fixture.assetId, type: 'asset' }],
			[folderRelationId, { id: fixture.folderId, type: 'folder' }],
		] as const) {
			expect((await request(app).get(`/api/semantic-relations/${relationId}`)).status).toBe(200);
			for (const response of [
				await request(app)
					.post('/api/semantic-relations')
					.send({ roleSlug: null, source, target: { id: fixture.noteId, type: 'note' } }),
				await request(app)
					.put(`/api/semantic-relations/${relationId}`)
					.send({ roleSlug: null, source, target: { id: fixture.noteId, type: 'note' } }),
				await request(app).delete(`/api/semantic-relations/${relationId}`),
			]) {
				expect(response.status, JSON.stringify(response.body)).toBe(403);
				expect(response.body).toMatchObject({ code: 'ROOT_PERMISSION_DENIED' });
			}
		}
	});

	it('hides stored Asset and Folder relations when their root is withdrawn', async () => {
		const fixture = await createMixedEndpointFixture('Mixed endpoint withdrawal');
		const assetRelationId = `semantic-withdrawn-asset-${crypto.randomUUID()}`;
		const folderRelationId = `semantic-withdrawn-folder-${crypto.randomUUID()}`;
		relationIds.push(assetRelationId, folderRelationId);
		await db.insert(semanticRelations).values([
			{
				id: assetRelationId,
				roleKey: 'references',
				roleSlug: 'references',
				sourceId: fixture.assetId,
				sourceType: 'asset',
				targetId: fixture.noteId,
				targetType: 'note',
			},
			{
				id: folderRelationId,
				roleKey: 'references',
				roleSlug: 'references',
				sourceId: fixture.folderId,
				sourceType: 'folder',
				targetId: fixture.noteId,
				targetType: 'note',
			},
		]);
		const app = createApp(await createAuthorizedRootRegistry([]));
		const missing = await request(app).get('/api/semantic-relations/missing-relation');
		for (const relationId of [assetRelationId, folderRelationId]) {
			const withdrawn = await request(app).get(`/api/semantic-relations/${relationId}`);
			expect(withdrawn.status).toBe(404);
			expect(withdrawn.body).toEqual(missing.body);
			expect((await request(app).delete(`/api/semantic-relations/${relationId}`)).status).toBe(404);
		}
	});

	it('hides Asset, Folder and Note relations when an active root does not grant read', async () => {
		const fixture = await createMixedEndpointFixture('Write-only endpoint root');
		const assetRelationId = `semantic-write-only-asset-${crypto.randomUUID()}`;
		const folderRelationId = `semantic-write-only-folder-${crypto.randomUUID()}`;
		const noteRelationId = `semantic-write-only-note-${crypto.randomUUID()}`;
		relationIds.push(assetRelationId, folderRelationId, noteRelationId);
		await db.insert(semanticRelations).values([
			{
				id: assetRelationId,
				roleKey: 'references',
				roleSlug: 'references',
				sourceId: fixture.assetId,
				sourceType: 'asset',
				targetId: fixture.noteId,
				targetType: 'note',
			},
			{
				id: folderRelationId,
				roleKey: 'references',
				roleSlug: 'references',
				sourceId: fixture.folderId,
				sourceType: 'folder',
				targetId: fixture.noteId,
				targetType: 'note',
			},
			{
				id: noteRelationId,
				roleKey: 'references',
				roleSlug: 'references',
				sourceId: fixture.noteId,
				sourceType: 'note',
				targetId: fixture.folderId,
				targetType: 'folder',
			},
		]);
		const app = createApp(
			await createAuthorizedRootRegistry([{ id: fixture.rootId, path: fixture.rootPath, permissions: ['write'] }])
		);
		const missingGet = await request(app).get('/api/semantic-relations/missing-relation');
		const missingDelete = await request(app).delete('/api/semantic-relations/missing-relation');
		for (const relationId of [assetRelationId, folderRelationId, noteRelationId]) {
			const existingGet = await request(app).get(`/api/semantic-relations/${relationId}`);
			expect(existingGet.status).toBe(404);
			expect(existingGet.body).toEqual(missingGet.body);
			const existingDelete = await request(app).delete(`/api/semantic-relations/${relationId}`);
			expect(existingDelete.status).toBe(404);
			expect(existingDelete.body).toEqual(missingDelete.body);
		}
	});
});
