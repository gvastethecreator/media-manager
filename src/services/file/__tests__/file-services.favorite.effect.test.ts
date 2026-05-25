import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { db } from '@/lib/drizzle';
import { documents, favorites, file3Ds, jsonFiles, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import {
	DocumentService,
	DocumentServiceLive,
	File3DService,
	File3DServiceLive,
	JsonFileService,
	JsonFileServiceLive,
} from '@/services/file/file-services.effect';
import { FavoriteEntityType } from '@/types/entities/favorite';

const runDocumentEffect = <A, E>(effect: Effect.Effect<A, E, DocumentService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(DocumentServiceLive))));

const runFile3DEffect = <A, E>(effect: Effect.Effect<A, E, File3DService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(File3DServiceLive))));

const runJsonFileEffect = <A, E>(effect: Effect.Effect<A, E, JsonFileService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(JsonFileServiceLive))));

const expectDocumentSuccess = async <A, E>(effect: Effect.Effect<A, E, DocumentService>) => {
	const either = await runDocumentEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}

	throw new Error('Expected document effect success but got failure');
};

const expectFile3DSuccess = async <A, E>(effect: Effect.Effect<A, E, File3DService>) => {
	const either = await runFile3DEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}

	throw new Error('Expected file3d effect success but got failure');
};

const expectJsonFileSuccess = async <A, E>(effect: Effect.Effect<A, E, JsonFileService>) => {
	const either = await runJsonFileEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}

	throw new Error('Expected json-file effect success but got failure');
};

let createdActiveProfileId: string | null = null;

const ensureActiveProfile = async () => {
	const [activeProfile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true)).limit(1);

	if (activeProfile) {
		return activeProfile.id;
	}

	const profileId = `file-favorites-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'File Favorites Test Profile',
		emoji: '📁',
		color: '#3b82f6',
		description: 'Perfil activo para tests de favoritos en servicios de archivos',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createDocument = async (name: string, input?: { isFavorite?: boolean }) => {
	const unique = `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

	return expectDocumentSuccess(
		Effect.gen(function* () {
			const service = yield* DocumentService;
			return yield* service.create({
				name: unique,
				path: `C:/tests/${unique}.pdf`,
				size: 1024,
				hash: `hash-${unique}`,
				mimeType: 'application/pdf',
				extension: 'pdf',
				folderId: 'favorites-test-folder',
				isFavorite: input?.isFavorite,
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
			});
		})
	);
};

const createFile3D = async (name: string, input?: { isFavorite?: boolean }) => {
	const unique = `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

	return expectFile3DSuccess(
		Effect.gen(function* () {
			const service = yield* File3DService;
			return yield* service.create({
				name: unique,
				path: `C:/tests/${unique}.glb`,
				size: 2048,
				hash: `hash-${unique}`,
				mimeType: 'model/gltf-binary',
				extension: 'glb',
				folderId: 'favorites-test-folder',
				isFavorite: input?.isFavorite,
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
				metadata: null,
			});
		})
	);
};

const createJsonFile = async (name: string, input?: { isFavorite?: boolean }) => {
	const unique = `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

	return expectJsonFileSuccess(
		Effect.gen(function* () {
			const service = yield* JsonFileService;
			return yield* service.create({
				name: unique,
				path: `C:/tests/${unique}.json`,
				size: 512,
				hash: `hash-${unique}`,
				mimeType: 'application/json',
				extension: 'json',
				folderId: 'favorites-test-folder',
				isFavorite: input?.isFavorite,
				isArchived: false,
				content: '{"hello":"world"}',
				schema: null,
				isValid: true,
				validationErrors: null,
				keyCount: 1,
				depth: 1,
			});
		})
	);
};

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.DOCUMENT));
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.FILE_3D));
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.JSON_FILE));
	await db.delete(documents);
	await db.delete(file3Ds);
	await db.delete(jsonFiles);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('File services favorites convergence', () => {
	describe('DocumentService', () => {
		it('create persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();

			const created = await createDocument('document-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.DOCUMENT, created.id)).toBe(true);
		});

		it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
			await ensureActiveProfile();
			const canonicalFavorite = await createDocument('document-canonical-favorite');
			const staleProjection = await createDocument('document-stale-projection');
			await createDocument('document-regular');

			await db.update(documents).set({ isFavorite: true }).where(eq(documents.id, staleProjection.id));
			await favoriteService.set(FavoriteEntityType.DOCUMENT, canonicalFavorite.id, true);

			const result = await expectDocumentSuccess(
				Effect.gen(function* () {
					const service = yield* DocumentService;
					return yield* service.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
				})
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(canonicalFavorite.id);
			expect(result.data[0]?.isFavorite).toBe(true);
		});

		it('update persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const document = await createDocument('document-update-target');

			const updated = await expectDocumentSuccess(
				Effect.gen(function* () {
					const service = yield* DocumentService;
					return yield* service.update(document.id, { isFavorite: true });
				})
			);

			expect(updated.id).toBe(document.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.DOCUMENT, document.id)).toBe(true);
		});

		it('toggleFavorite delegates to the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const document = await createDocument('document-toggle-target');

			const toggled = await expectDocumentSuccess(
				Effect.gen(function* () {
					const service = yield* DocumentService;
					return yield* service.toggleFavorite(document.id);
				})
			);

			expect(toggled.id).toBe(document.id);
			expect(toggled.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.DOCUMENT, document.id)).toBe(true);
		});

		it('toggleFavorite can remove the canonical favorite again', async () => {
			await ensureActiveProfile();
			const document = await createDocument('document-toggle-roundtrip-target');

			const favorited = await expectDocumentSuccess(
				Effect.gen(function* () {
					const service = yield* DocumentService;
					return yield* service.toggleFavorite(document.id);
				})
			);

			expect(favorited.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.DOCUMENT, document.id)).toBe(true);

			const unfavorited = await expectDocumentSuccess(
				Effect.gen(function* () {
					const service = yield* DocumentService;
					return yield* service.toggleFavorite(document.id);
				})
			);

			expect(unfavorited.isFavorite).toBe(false);
			expect(await favoriteService.isFavorite(FavoriteEntityType.DOCUMENT, document.id)).toBe(false);
		});
	});

	describe('File3DService', () => {
		it('create persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();

			const created = await createFile3D('file3d-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.FILE_3D, created.id)).toBe(true);
		});

		it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
			await ensureActiveProfile();
			const canonicalFavorite = await createFile3D('file3d-canonical-favorite');
			const staleProjection = await createFile3D('file3d-stale-projection');
			await createFile3D('file3d-regular');

			await db.update(file3Ds).set({ isFavorite: true }).where(eq(file3Ds.id, staleProjection.id));
			await favoriteService.set(FavoriteEntityType.FILE_3D, canonicalFavorite.id, true);

			const result = await expectFile3DSuccess(
				Effect.gen(function* () {
					const service = yield* File3DService;
					return yield* service.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
				})
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(canonicalFavorite.id);
			expect(result.data[0]?.isFavorite).toBe(true);
		});

		it('update persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const file3D = await createFile3D('file3d-update-target');

			const updated = await expectFile3DSuccess(
				Effect.gen(function* () {
					const service = yield* File3DService;
					return yield* service.update(file3D.id, { isFavorite: true });
				})
			);

			expect(updated.id).toBe(file3D.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.FILE_3D, file3D.id)).toBe(true);
		});

		it('toggleFavorite delegates to the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const file3D = await createFile3D('file3d-toggle-target');

			const toggled = await expectFile3DSuccess(
				Effect.gen(function* () {
					const service = yield* File3DService;
					return yield* service.toggleFavorite(file3D.id);
				})
			);

			expect(toggled.id).toBe(file3D.id);
			expect(toggled.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.FILE_3D, file3D.id)).toBe(true);
		});

		it('toggleFavorite can remove the canonical favorite again', async () => {
			await ensureActiveProfile();
			const file3D = await createFile3D('file3d-toggle-roundtrip-target');

			const favorited = await expectFile3DSuccess(
				Effect.gen(function* () {
					const service = yield* File3DService;
					return yield* service.toggleFavorite(file3D.id);
				})
			);

			expect(favorited.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.FILE_3D, file3D.id)).toBe(true);

			const unfavorited = await expectFile3DSuccess(
				Effect.gen(function* () {
					const service = yield* File3DService;
					return yield* service.toggleFavorite(file3D.id);
				})
			);

			expect(unfavorited.isFavorite).toBe(false);
			expect(await favoriteService.isFavorite(FavoriteEntityType.FILE_3D, file3D.id)).toBe(false);
		});
	});

	describe('JsonFileService', () => {
		it('create persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();

			const created = await createJsonFile('json-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.JSON_FILE, created.id)).toBe(true);
		});

		it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
			await ensureActiveProfile();
			const canonicalFavorite = await createJsonFile('json-canonical-favorite');
			const staleProjection = await createJsonFile('json-stale-projection');
			await createJsonFile('json-regular');

			await db.update(jsonFiles).set({ isFavorite: true }).where(eq(jsonFiles.id, staleProjection.id));
			await favoriteService.set(FavoriteEntityType.JSON_FILE, canonicalFavorite.id, true);

			const result = await expectJsonFileSuccess(
				Effect.gen(function* () {
					const service = yield* JsonFileService;
					return yield* service.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
				})
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(canonicalFavorite.id);
			expect(result.data[0]?.isFavorite).toBe(true);
		});

		it('update persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const jsonFile = await createJsonFile('json-update-target');

			const updated = await expectJsonFileSuccess(
				Effect.gen(function* () {
					const service = yield* JsonFileService;
					return yield* service.update(jsonFile.id, { isFavorite: true });
				})
			);

			expect(updated.id).toBe(jsonFile.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.JSON_FILE, jsonFile.id)).toBe(true);
		});

		it('toggleFavorite delegates to the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const jsonFile = await createJsonFile('json-toggle-target');

			const toggled = await expectJsonFileSuccess(
				Effect.gen(function* () {
					const service = yield* JsonFileService;
					return yield* service.toggleFavorite(jsonFile.id);
				})
			);

			expect(toggled.id).toBe(jsonFile.id);
			expect(toggled.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.JSON_FILE, jsonFile.id)).toBe(true);
		});

		it('toggleFavorite can remove the canonical favorite again', async () => {
			await ensureActiveProfile();
			const jsonFile = await createJsonFile('json-toggle-roundtrip-target');

			const favorited = await expectJsonFileSuccess(
				Effect.gen(function* () {
					const service = yield* JsonFileService;
					return yield* service.toggleFavorite(jsonFile.id);
				})
			);

			expect(favorited.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.JSON_FILE, jsonFile.id)).toBe(true);

			const unfavorited = await expectJsonFileSuccess(
				Effect.gen(function* () {
					const service = yield* JsonFileService;
					return yield* service.toggleFavorite(jsonFile.id);
				})
			);

			expect(unfavorited.isFavorite).toBe(false);
			expect(await favoriteService.isFavorite(FavoriteEntityType.JSON_FILE, jsonFile.id)).toBe(false);
		});
	});
});