import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import express, { type Router } from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { assets, file3Ds, folders, jsonFiles, mediaRoots, sourceFiles } from '../src/lib/drizzle/schema';
import { file3dsEffectRouter, jsonFilesEffectRouter } from '../src/server/routes/file-services.effect';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';
import { syncCanonicalMediaRoots } from '../src/services/media-core/media-root-registry.service';

const temporaryDirectories: string[] = [];
const createdFolderIds: string[] = [];
const createdRootIds: string[] = [];
const createdAssetIds: string[] = [];

afterEach(async () => {
	for (const id of createdAssetIds.splice(0)) {
		await db.delete(jsonFiles).where(eq(jsonFiles.id, id));
		await db.delete(file3Ds).where(eq(file3Ds.id, id));
		await db.delete(assets).where(eq(assets.id, id));
	}
	for (const id of createdFolderIds.splice(0)) await db.delete(folders).where(eq(folders.id, id));
	for (const id of createdRootIds.splice(0)) await db.delete(mediaRoots).where(eq(mediaRoots.id, id));
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

type CanonicalHttpCase = {
	extension: string;
	hash: string;
	mimeType: string;
	mount: string;
	name: string;
	previewPath: (id: string) => string;
	persistPreview: (id: string, svgBase64: string) => Promise<void>;
	router: Router;
	table: typeof jsonFiles | typeof file3Ds;
};

const exerciseCanonicalHttpLifecycle = async (testCase: CanonicalHttpCase) => {
	const directory = await mkdtemp(resolve(tmpdir(), `media-manager-${testCase.extension}-http-`));
	temporaryDirectories.push(directory);
	const rootPath = resolve(directory, 'library');
	await mkdir(rootPath);
	const filePath = resolve(rootPath, testCase.name);
	await writeFile(filePath, testCase.extension);
	const rootId = `root-${crypto.randomUUID()}`;
	const folderId = crypto.randomUUID();
	createdRootIds.push(rootId);
	createdFolderIds.push(folderId);
	const registry = await createAuthorizedRootRegistry([
		{
			id: rootId,
			label: `HTTP ${testCase.extension} library`,
			path: rootPath,
			permissions: ['read', 'index', 'write', 'delete'],
		},
	]);
	await syncCanonicalMediaRoots(registry);
	await db.insert(folders).values({ id: folderId, name: `HTTP ${testCase.extension}`, path: rootPath });
	const app = express();
	app.locals.authorizedRootRegistry = registry;
	app.use(express.json());
	app.use(testCase.mount, testCase.router);

	const response = await request(app)
		.post(testCase.mount)
		.send({
			extension: testCase.extension,
			folderId,
			hash: testCase.hash.repeat(64),
			mimeType: testCase.mimeType,
			name: testCase.name,
			path: resolve(directory, `attacker.${testCase.extension}`),
			size: testCase.extension.length,
			source: { relativePath: testCase.name, rootId },
		});

	expect(response.status, JSON.stringify(response.body)).toBe(201);
	expect(response.body).toEqual(
		expect.objectContaining({ assetId: response.body.id, canonicalState: 'canonical', id: expect.any(String) })
	);
	expect(JSON.stringify(response.body)).not.toContain(directory);
	createdAssetIds.push(response.body.id);
	const rows = await db
		.select({ assetId: testCase.table.assetId, path: testCase.table.path })
		.from(testCase.table as any)
		.where(eq(testCase.table.id, response.body.id));
	expect(rows).toEqual([expect.objectContaining({ assetId: response.body.id, path: filePath })]);
	expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, response.body.id))).toEqual([
		expect.objectContaining({ relativePath: testCase.name, rootId }),
	]);
	const persistedSvg = `<svg xmlns="http://www.w3.org/2000/svg"><text>persisted-${testCase.extension}</text></svg>`;
	await testCase.persistPreview(response.body.id, Buffer.from(persistedSvg).toString('base64'));
	const persistedPreview = await request(app).get(testCase.previewPath(response.body.id));
	expect(persistedPreview.status).toBe(200);
	expect(persistedPreview.type).toBe('image/svg+xml');
	expect(Buffer.from(persistedPreview.body).toString('utf8')).toBe(persistedSvg);
	expect(persistedPreview.headers['x-content-type-options']).toBe('nosniff');

	const rawPath = await request(app)
		.post(testCase.mount)
		.send({
			extension: testCase.extension,
			folderId,
			hash: (testCase.hash === 'a' ? 'b' : 'a').repeat(64),
			mimeType: testCase.mimeType,
			name: `raw.${testCase.extension}`,
			path: filePath,
			size: 1,
		});
	expect(rawPath.status).toBe(400);

	expect((await request(app).delete(`${testCase.mount}/${response.body.id}`)).status).toBe(204);
	expect((await request(app).get(testCase.previewPath(response.body.id))).status).toBe(404);
	const deletedList = (await request(app).get(testCase.mount)).body;
	expect(Array.isArray(deletedList) ? deletedList : deletedList.data).toEqual([]);

	const restored = await request(app).post(`${testCase.mount}/${response.body.id}/restore`);
	expect(restored.status, JSON.stringify(restored.body)).toBe(200);
	expect(restored.body).toEqual(expect.objectContaining({ canonicalState: 'canonical', id: response.body.id }));
	const restoredList = (await request(app).get(testCase.mount)).body;
	expect(Array.isArray(restoredList) ? restoredList : restoredList.data).toHaveLength(1);

	await rm(filePath);
	expect((await request(app).delete(`${testCase.mount}/${response.body.id}`)).status).toBe(204);
	expect((await request(app).post(`${testCase.mount}/${response.body.id}/restore`)).status).toBe(200);
};

describe('canonical JSON and File3D HTTP lifecycles', () => {
	it('protects JSON creation, preview, deletion and restoration', async () => {
		await exerciseCanonicalHttpLifecycle({
			extension: 'json',
			hash: '1',
			mimeType: 'application/json',
			mount: '/api/json-files',
			name: 'config.json',
			previewPath: (id) => `/api/json-files/${id}/preview`,
			persistPreview: async (id, data) => {
				await db
					.update(jsonFiles)
					.set({ metadata: JSON.stringify({ thumbnail: { data, format: 'svg' } }) })
					.where(eq(jsonFiles.id, id));
			},
			router: jsonFilesEffectRouter,
			table: jsonFiles,
		});
	});

	it('protects File3D creation, thumbnail, deletion and restoration', async () => {
		await exerciseCanonicalHttpLifecycle({
			extension: 'glb',
			hash: '2',
			mimeType: 'model/gltf-binary',
			mount: '/api/file3ds',
			name: 'model.glb',
			previewPath: (id) => `/api/file3ds/${id}/thumbnail`,
			persistPreview: async (id, data) => {
				await db
					.update(file3Ds)
					.set({ metadata: JSON.stringify({ thumbnail: { data, format: 'svg' } }) })
					.where(eq(file3Ds.id, id));
			},
			router: file3dsEffectRouter,
			table: file3Ds,
		});
	});
});
