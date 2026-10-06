import { Effect } from 'effect';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { createAuthorizedPathInput } from '@/lib/filesystem/authorized-path-proof';
import { assets, documents, favorites, file3Ds, folders, jsonFiles, mediaRoots, profiles } from '@/lib/drizzle/schema';
import {
	create as createDocument,
	getAll as getDocuments,
	update as updateDocument,
} from '@/services/document/document.service.effect';
import { favoriteService } from '@/services/favorite/favorite.service';
import {
	create as createFile3D,
	getAll as getFile3Ds,
	update as updateFile3D,
} from '@/services/file3d/file3d.service.effect';
import {
	create as createJsonFile,
	getAll as getJsonFiles,
	update as updateJsonFile,
} from '@/services/json-file/json-file.service.effect';
import { FavoriteEntityType } from '@/types/entities/favorite';

let createdActiveProfileId: string | null = null;
const testFolderId = `file-favorites-legacy-folder-${crypto.randomUUID()}`;
const testRootId = `file-favorites-root-${crypto.randomUUID()}`;

const createTestHash = () => crypto.randomUUID().replaceAll('-', '').repeat(2);

const buildUniqueLabel = (label: string) => {
	const token = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
	return `${token}-${label}`;
};

const ensureActiveProfile = async () => {
	const [activeProfile] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.isActive, true))
		.limit(1);

	if (activeProfile) {
		return activeProfile.id;
	}

	const profileId = `legacy-file-favorites-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Legacy File Favorites Test Profile',
		emoji: '📁',
		color: '#3b82f6',
		description: 'Perfil activo para tests legacy de favoritos en servicios de archivos',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createTestDocument = async (label: string, input?: { isFavorite?: boolean }) => {
	const unique = buildUniqueLabel(label);

	return Effect.runPromise(
		createDocument({
			name: unique,
			path: `C:/tests/${unique}.pdf`,
			size: 1024,
			hash: createTestHash(),
			mimeType: 'application/pdf',
			extension: 'pdf',
			folderId: testFolderId,
			isFavorite: input?.isFavorite ?? false,
			isArchived: false,
			pageCount: 1,
			wordCount: 10,
			language: 'es',
			title: unique,
			author: 'Copilot',
			subject: null,
			keywords: null,
			creator: null,
			producer: null,
			creationDate: null,
			modificationDate: null,
			encrypted: false,
			version: null,
			content: 'hola mundo',
			summary: null,
			source: createAuthorizedPathInput({
				absolutePath: `C:/tests/${unique}.pdf`,
				relativePath: `${unique}.pdf`,
				rootId: testRootId,
			}),
		})
	);
};

const createTestFile3D = async (label: string, input?: { isFavorite?: boolean }) => {
	const unique = buildUniqueLabel(label);

	return Effect.runPromise(
		createFile3D({
			name: unique,
			path: `C:/tests/${unique}.glb`,
			size: 2048,
			hash: createTestHash(),
			mimeType: 'model/gltf-binary',
			extension: 'glb',
			folderId: testFolderId,
			isFavorite: input?.isFavorite ?? false,
			isArchived: false,
			format: 'glb',
			version: '2.0',
			vertices: 12,
			faces: 6,
			triangles: 12,
			materials: 1,
			textures: 0,
			animations: 0,
			bones: 0,
			scenes: 1,
			cameras: 1,
			lights: 0,
			hasUV: true,
			hasNormals: true,
			hasColors: false,
			boundingBox: null,
			source: createAuthorizedPathInput({
				absolutePath: `C:/tests/${unique}.glb`,
				relativePath: `${unique}.glb`,
				rootId: testRootId,
			}),
		})
	);
};

const createTestJsonFile = async (label: string, input?: { isFavorite?: boolean }) => {
	const unique = buildUniqueLabel(label);

	return Effect.runPromise(
		createJsonFile({
			name: unique,
			path: `C:/tests/${unique}.json`,
			size: 512,
			hash: createTestHash(),
			mimeType: 'application/json',
			extension: 'json',
			folderId: testFolderId,
			isFavorite: input?.isFavorite ?? false,
			isArchived: false,
			content: '{"hello":"world"}',
			schema: null,
			isValid: true,
			validationErrors: null,
			keyCount: 1,
			depth: 1,
			source: createAuthorizedPathInput({
				absolutePath: `C:/tests/${unique}.json`,
				relativePath: `${unique}.json`,
				rootId: testRootId,
			}),
		})
	);
};

beforeAll(async () => {
	await db.insert(mediaRoots).values({ id: testRootId, label: 'Legacy file favorite test root' });
	await db.insert(folders).values({
		id: testFolderId,
		name: 'file-favorites-legacy-tests',
		path: 'C:/tests',
		depth: 0,
		parentId: null,
		isFavorite: false,
		presetId: null,
	});
});

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.DOCUMENT));
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.FILE_3D));
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.JSON_FILE));
	await db.delete(documents);
	await db.delete(file3Ds);
	await db.delete(jsonFiles);
	await db.delete(assets);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

afterAll(async () => {
	await db.delete(folders).where(eq(folders.id, testFolderId));
	await db.delete(mediaRoots).where(eq(mediaRoots.id, testRootId));
});

describe('File services canonical favorites', () => {
	describe('document.service', () => {
		it('create persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();

			const created = await createTestDocument('document-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.DOCUMENT, created.id)).toBe(true);
		});

		it('uses canonical favorites for filtered lists and ignores stale projection', async () => {
			await ensureActiveProfile();
			const canonicalFavorite = await createTestDocument('document-canonical-favorite');
			const staleProjection = await createTestDocument('document-stale-projection');
			await createTestDocument('document-regular');

			await db.update(documents).set({ isFavorite: true }).where(eq(documents.id, staleProjection.id));
			await favoriteService.set(FavoriteEntityType.DOCUMENT, canonicalFavorite.id, true);

			const result = await Effect.runPromise(getDocuments({ isFavorite: true, limit: 50, offset: 0 }));

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(canonicalFavorite.id);
			expect(result.data[0]?.isFavorite).toBe(true);
		});

		it('update persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const document = await createTestDocument('document-update-target');

			const updated = await Effect.runPromise(updateDocument(document.id, { isFavorite: true }));

			expect(updated.id).toBe(document.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.DOCUMENT, document.id)).toBe(true);
		});
	});

	describe('file3d.service', () => {
		it('create persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();

			const created = await createTestFile3D('file3d-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.FILE_3D, created.id)).toBe(true);
		});

		it('normalizes favorite state from canonical favorites and ignores stale projection', async () => {
			await ensureActiveProfile();
			const canonicalFavorite = await createTestFile3D('file3d-canonical-favorite');
			const staleProjection = await createTestFile3D('file3d-stale-projection');
			const regular = await createTestFile3D('file3d-regular');

			await db.update(file3Ds).set({ isFavorite: true }).where(eq(file3Ds.id, staleProjection.id));
			await favoriteService.set(FavoriteEntityType.FILE_3D, canonicalFavorite.id, true);

			const result = await Effect.runPromise(getFile3Ds());

			expect(result.data.find((item: any) => item.id === canonicalFavorite.id)?.isFavorite).toBe(true);
			expect(result.data.find((item: any) => item.id === staleProjection.id)?.isFavorite).toBe(false);
			expect(result.data.find((item: any) => item.id === regular.id)?.isFavorite).toBe(false);
		});

		it('update persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const file3D = await createTestFile3D('file3d-update-target');

			const updated = await Effect.runPromise(updateFile3D(file3D.id, { isFavorite: true }));

			expect(updated.id).toBe(file3D.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.FILE_3D, file3D.id)).toBe(true);
		});
	});

	describe('json-file.service', () => {
		it('create persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();

			const created = await createTestJsonFile('json-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.JSON_FILE, created.id)).toBe(true);
		});

		it('normalizes favorite state from canonical favorites and ignores stale projection', async () => {
			await ensureActiveProfile();
			const canonicalFavorite = await createTestJsonFile('json-canonical-favorite');
			const staleProjection = await createTestJsonFile('json-stale-projection');
			const regular = await createTestJsonFile('json-regular');

			await db.update(jsonFiles).set({ isFavorite: true }).where(eq(jsonFiles.id, staleProjection.id));
			await favoriteService.set(FavoriteEntityType.JSON_FILE, canonicalFavorite.id, true);

			const result = await Effect.runPromise(getJsonFiles());

			expect(result.data.find((item) => item.id === canonicalFavorite.id)?.isFavorite).toBe(true);
			expect(result.data.find((item) => item.id === staleProjection.id)?.isFavorite).toBe(false);
			expect(result.data.find((item) => item.id === regular.id)?.isFavorite).toBe(false);
		});

		it('update persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const jsonFile = await createTestJsonFile('json-update-target');

			const updated = await Effect.runPromise(updateJsonFile(jsonFile.id, { isFavorite: true }));

			expect(updated.id).toBe(jsonFile.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.JSON_FILE, jsonFile.id)).toBe(true);
		});
	});
});
