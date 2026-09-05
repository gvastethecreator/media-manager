/**
 * @file Tests para VideoService con Effect
 * @module services/video/__tests__/video.service.effect.test
 * @description Test suite completo para VideoService usando Effect-TS
 * @created 2025-01-10 - Phase 6.2: Video Test Suite
 */

import { Effect } from 'effect';
import { eq, inArray } from 'drizzle-orm';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { db } from '@/lib/drizzle';
import { createAuthorizedPathInput } from '@/lib/filesystem/authorized-path-proof';
import { FileSyncService } from '@/lib/filesystem/file-sync.service';
import { assets, favorites, folders, mediaRoots, profiles, sourceFiles, videos } from '@/lib/drizzle/schema';
import { getEventStore } from '@/lib/server/events.server';
import { favoriteService } from '@/services/favorite/favorite.service';
import { createAuthorizedRootRegistry } from '@/server/security/authorized-roots';
import { getFolderFileStats, getFolderFiles } from '@/services/folder-files/folder-files.service';
import { streamFolderFiles } from '@/services/folder-files/folder-files-stream.service';
import { performSearch } from '@/server/services/search.service';
import { fetchMediaCounts } from '@/server/services/stats/stats.queries';
import { getNavigationData } from '@/server/services/system/system.navigation';
import { FavoriteEntityType } from '@/types/entities/favorite';
import * as VideoService from '../video.service.effect';

// ============= Test Helpers =============

/**
 * Ejecuta un Effect y convierte el resultado a Either
 */
const runEffect = <A, E>(effect: Effect.Effect<A, E, never>) => Effect.runPromise(Effect.either(effect));

/**
 * Helper para esperar éxito
 */
const expectSuccess = async <A, E>(effect: Effect.Effect<A, E, never>) => {
	const either = await runEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}
	throw new Error('Expected success but got failure');
};

/**
 * Helper para esperar error
 */
const expectError = async <A, E>(effect: Effect.Effect<A, E, never>) => {
	const either = await runEffect(effect);
	if (either._tag === 'Left') {
		return either.left;
	}
	throw new Error('Expected failure but got success');
};

// ============= Test Data Helpers =============

const createTestFolder = async (path = `/test/folder-${Date.now()}-${crypto.randomUUID()}`) => {
	const now = new Date();
	const [folder] = await db
		.insert(folders)
		.values({
			id: crypto.randomUUID(),
			name: `test-folder-${Date.now()}`,
			path,
			depth: 0,
			parentId: null,
			isFavorite: false,
			presetId: null,
			createdAt: now,
			updatedAt: now,
		})
		.returning();
	return folder;
};

const createTestVideo = async (folderId: string, overrides?: Partial<typeof videos.$inferInsert>) => {
	const now = new Date();
	const uniqueId = crypto.randomUUID();
	const validHash = uniqueId.replaceAll('-', '').padStart(64, '0');

	const [video] = await db
		.insert(videos)
		.values({
			id: uniqueId,
			name: `test-video-${uniqueId}.mp4`,
			path: `/test/video-${uniqueId}.mp4`,
			hash: validHash,
			size: 10_000_000, // 10MB
			duration: 120, // 2m
			width: 1920,
			height: 1080,
			folderId,
			isFavorite: false,
			createdAt: now,
			updatedAt: now,
			...overrides,
		})
		.returning();
	return video;
};

const withCanonicalSource = async <T extends { name: string; path: string }>(
	folder: typeof folders.$inferSelect,
	input: T
) => {
	const rootId = `root-video-${crypto.randomUUID()}`;
	const path = resolve(folder.path, input.name);
	const relativePath = `videos/${crypto.randomUUID()}-${input.name}`;
	await db.insert(mediaRoots).values({ id: rootId, label: 'Video service test root' });
	return {
		...input,
		path,
		source: createAuthorizedPathInput({ absolutePath: path, relativePath, rootId }),
	};
};

let createdActiveProfileId: string | null = null;
let previousActiveProfileIds: string[] = [];
const temporaryDirectories: string[] = [];

const ensureActiveProfile = async () => {
	if (createdActiveProfileId) {
		return createdActiveProfileId;
	}

	const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
	previousActiveProfileIds = activeProfiles.map((profile: { id: string }) => profile.id);

	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: false }).where(inArray(profiles.id, previousActiveProfileIds));
	}

	const profileId = `video-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Video Service Test Profile',
		emoji: '🎬',
		color: '#8b5cf6',
		description: 'Perfil activo para tests de videos',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

// ============= Cleanup =============

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.VIDEO));
	// Limpiar videos de prueba (todos los registros)
	await db.delete(videos);
	await db.delete(assets);
	await db.delete(mediaRoots);
	// Limpiar folders de prueba (todos los registros)
	await db.delete(folders);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}

	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: true }).where(inArray(profiles.id, previousActiveProfileIds));
		previousActiveProfileIds = [];
	}
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

// ============= CRUD Operations Tests =============

describe('VideoService - CRUD Operations', () => {
	describe('create', () => {
		it('debería crear un video exitosamente', async () => {
			const folder = await createTestFolder();

			const input = {
				name: 'nuevo-video.mp4',
				path: '/test/nuevo-video.mp4',
				hash: '1'.repeat(64),
				size: 50_000_000,
				duration: 300,
				width: 1280,
				height: 720,
				folderId: folder.id,
			};

			const result = await expectSuccess(VideoService.create(await withCanonicalSource(folder, input)));

			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect(result.name).toBe('nuevo-video.mp4');
			expect(result.hash).toBe('1'.repeat(64));
			expect(result.size).toBe(50_000_000);
			expect(result.duration).toBe(300);
			expect(result.isFavorite).toBe(false);
			expect(result.assetId).toBe(result.id);
			expect(result.canonicalState).toBe('canonical');
			const [asset] = await db.select().from(assets).where(eq(assets.id, result.id));
			const [source] = await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, result.id));
			expect(asset).toEqual(expect.objectContaining({ assetType: 'video', id: result.id, status: 'active' }));
			expect(source).toEqual(expect.objectContaining({ assetId: result.id, availability: 'available' }));
		});

		it('debería persistir el favorito vía bridge canónico al crear con perfil activo', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();

			const result = await expectSuccess(
				VideoService.create(
					await withCanonicalSource(folder, {
						name: 'canonical-video.mp4',
						path: '/test/canonical-video.mp4',
						hash: '9'.repeat(64),
						size: 50_000_000,
						duration: 300,
						width: 1280,
						height: 720,
						folderId: folder.id,
						isFavorite: true,
					})
				)
			);

			expect(result.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.VIDEO, result.id)).toBe(true);
		});

		it('debería crear dos Assets para ubicaciones distintas con el mismo hash', async () => {
			const folder = await createTestFolder();
			const hash = '2'.repeat(64);
			const common = {
				hash,
				size: 10_000_000,
				duration: 120,
				width: 1920,
				height: 1080,
				folderId: folder.id,
			};
			const first = await expectSuccess(
				VideoService.create(
					await withCanonicalSource(folder, { ...common, name: 'first-location.mp4', path: '/ignored/first.mp4' })
				)
			);
			const second = await expectSuccess(
				VideoService.create(
					await withCanonicalSource(folder, { ...common, name: 'second-location.mp4', path: '/ignored/second.mp4' })
				)
			);

			expect(second.id).not.toBe(first.id);
			expect(second.hash).toBe(first.hash);
		});

		it('debería fallar con VideoValidationError si size > 100GB', async () => {
			const folder = await createTestFolder();

			const input = {
				name: 'huge.mp4',
				path: '/test/huge.mp4',
				hash: '2'.repeat(64),
				size: 200_000_000_000, // 200GB
				duration: 300,
				width: 1920,
				height: 1080,
				folderId: folder.id,
			};

			const error = await expectError(VideoService.create(await withCanonicalSource(folder, input)));

			expect(error._tag).toBe('VideoValidationError');
			if (error._tag === 'VideoValidationError') {
				expect(error.field).toBe('size');
			}
		});

		it('debería fallar con VideoValidationError si duration > 24h', async () => {
			const folder = await createTestFolder();

			const input = {
				name: 'long.mp4',
				path: '/test/long.mp4',
				hash: '3'.repeat(64),
				size: 10_000_000,
				duration: 100_000, // >24h
				width: 1920,
				height: 1080,
				folderId: folder.id,
			};

			const error = await expectError(VideoService.create(await withCanonicalSource(folder, input)));

			expect(error._tag).toBe('VideoValidationError');
			if (error._tag === 'VideoValidationError') {
				expect(error.field).toBe('duration');
			}
		});

		it('debería fallar con VideoValidationError si hash no tiene 64 chars', async () => {
			const folder = await createTestFolder();

			const input = {
				name: 'invalid-hash.mp4',
				path: '/test/invalid-hash.mp4',
				hash: 'tooshort',
				size: 10_000_000,
				duration: 120,
				width: 1920,
				height: 1080,
				folderId: folder.id,
			};

			const error = await expectError(VideoService.create(await withCanonicalSource(folder, input)));

			expect(error._tag).toBe('VideoValidationError');
			if (error._tag === 'VideoValidationError') {
				expect(error.field).toBe('hash');
			}
		});

		it('debería fallar con VideoValidationError si path está vacío', async () => {
			const folder = await createTestFolder();

			const input = {
				name: 'no-path.mp4',
				path: '',
				hash: '4'.repeat(64),
				size: 10_000_000,
				duration: 120,
				width: 1920,
				height: 1080,
				folderId: folder.id,
				source: createAuthorizedPathInput({
					absolutePath: resolve(folder.path, 'no-path.mp4'),
					relativePath: 'videos/no-path.mp4',
					rootId: 'root-never-used',
				}),
			};

			const error = await expectError(VideoService.create(input));

			expect(error._tag).toBe('VideoValidationError');
			if (error._tag === 'VideoValidationError') {
				expect(error.field).toBe('path');
			}
		});

		it('debería rechazar una source JSON sin prueba runtime de autorización', async () => {
			const folder = await createTestFolder();
			const error = await expectError(
				VideoService.create({
					name: 'forged.mp4',
					path: resolve(folder.path, 'forged.mp4'),
					hash: '7'.repeat(64),
					size: 1,
					duration: 1,
					folderId: folder.id,
					source: { relativePath: 'videos/forged.mp4', rootId: 'forged-root' },
				})
			);
			expect(error._tag).toBe('VideoValidationError');
			if (error._tag === 'VideoValidationError') expect(error.field).toBe('source');
		});
	});

	describe('getById', () => {
		it('debería obtener un video por ID', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id);

			const result = await expectSuccess(VideoService.getById(video.id));

			expect(result).toBeDefined();
			expect(result.id).toBe(video.id);
			expect(result.name).toBe(video.name);
			expect(result.folder).toBeDefined();
			expect(result.folder?.id).toBe(folder.id);
		});

		it('debería fallar con VideoNotFound si ID no existe', async () => {
			const nonExistentId = crypto.randomUUID();

			const error = await expectError(VideoService.getById(nonExistentId));

			expect(error._tag).toBe('VideoNotFound');
			if (error._tag === 'VideoNotFound') {
				expect(error.id).toBe(nonExistentId);
			}
		});
	});

	describe('getByIdWithStats', () => {
		it('debería obtener video con _count object', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id);

			const result = await expectSuccess(VideoService.getByIdWithStats(video.id));

			expect(result).toBeDefined();
			expect(result.id).toBe(video.id);
			expect(result._count).toBeDefined();
			expect(result._count.tags).toBe(0);
			expect(result._count.albums).toBe(0);
			expect(result._count.characters).toBe(0);
		});
	});

	describe('getAll', () => {
		it('debería listar todos los videos', async () => {
			const folder = await createTestFolder();
			await createTestVideo(folder.id);
			await createTestVideo(folder.id);

			const result = await expectSuccess(VideoService.getAll({}));

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(2);
		});

		it('debería filtrar por folderId', async () => {
			const folder1 = await createTestFolder();
			const folder2 = await createTestFolder();
			await createTestVideo(folder1.id);
			await createTestVideo(folder1.id);
			await createTestVideo(folder2.id);

			const result = await expectSuccess(VideoService.getAll({ folderId: folder1.id }));

			expect(result.length).toBe(2);
			for (const video of result) {
				expect(video.folderId).toBe(folder1.id);
			}
		});

		it('debería filtrar por isFavorite', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const favoriteVideo = await createTestVideo(folder.id, { isFavorite: false });
			await createTestVideo(folder.id, { isFavorite: true });

			await favoriteService.set(FavoriteEntityType.VIDEO, favoriteVideo.id, true);

			const result = await expectSuccess(VideoService.getAll({ isFavorite: true }));

			expect(result.length).toBe(1);
			expect(result[0].id).toBe(favoriteVideo.id);
			expect(result[0].isFavorite).toBe(true);
		});

		it('debería soportar paginación con limit y offset', async () => {
			const folder = await createTestFolder();
			await createTestVideo(folder.id);
			await createTestVideo(folder.id);
			await createTestVideo(folder.id);

			const result = await expectSuccess(VideoService.getAll({ limit: 2, offset: 1 }));

			expect(result.length).toBe(2);
		});

		it('debería soportar sorting asc/desc', async () => {
			const folder = await createTestFolder();
			await createTestVideo(folder.id, { name: 'A-video.mp4' });
			await createTestVideo(folder.id, { name: 'B-video.mp4' });

			const resultAsc = await expectSuccess(VideoService.getAll({ sortBy: 'name', sortOrder: 'asc' }));

			const resultDesc = await expectSuccess(VideoService.getAll({ sortBy: 'name', sortOrder: 'desc' }));

			expect(resultAsc[0].name).toBe('A-video.mp4');
			expect(resultDesc[0].name).toBe('B-video.mp4');
		});

		it('debería retornar array vacío si no hay resultados', async () => {
			const result = await expectSuccess(VideoService.getAll({}));

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});
	});

	describe('update', () => {
		it('debería actualizar un video parcialmente', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id);

			const updates = {
				name: 'updated-name.mp4',
				duration: 200,
			};

			const result = await expectSuccess(VideoService.update(video.id, updates));

			expect(result).toBeDefined();
			expect(result.name).toBe('updated-name.mp4');
			expect(result.duration).toBe(200);
			expect(result.hash).toBe(video.hash); // no cambió
		});

		it('debería persistir el favorito vía bridge canónico al actualizar con perfil activo', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id, { isFavorite: false });
			await ensureActiveProfile();
			const eventCountBefore = getEventStore().get('favorites:modified')?.length ?? 0;

			const result = await expectSuccess(VideoService.update(video.id, { isFavorite: true }));
			const eventCountAfterChange = getEventStore().get('favorites:modified')?.length ?? 0;
			await expectSuccess(VideoService.update(video.id, { isFavorite: true }));

			expect(result.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.VIDEO, video.id)).toBe(true);
			expect(eventCountAfterChange - eventCountBefore).toBe(1);
			expect(getEventStore().get('favorites:modified')?.length ?? 0).toBe(eventCountAfterChange);
		});

		it('debería fallar con VideoNotFound si ID no existe', async () => {
			const nonExistentId = crypto.randomUUID();

			const error = await expectError(VideoService.update(nonExistentId, { name: 'new.mp4' }));

			expect(error._tag).toBe('VideoNotFound');
		});

		it('debería validar size en update', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id);

			const error = await expectError(VideoService.update(video.id, { size: 200_000_000_000 }));

			expect(error._tag).toBe('VideoValidationError');
			if (error._tag === 'VideoValidationError') {
				expect(error.field).toBe('size');
			}
		});
	});

	describe('deleteById', () => {
		it('debería eliminar un video', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id);

			await expectSuccess(VideoService.deleteById(video.id, false));

			// Verificar que fue eliminado
			const error = await expectError(VideoService.getById(video.id));
			expect(error._tag).toBe('VideoNotFound');
		});

		it('debería fallar con VideoNotFound si ID no existe', async () => {
			const nonExistentId = crypto.randomUUID();

			const error = await expectError(VideoService.deleteById(nonExistentId, false));

			expect(error._tag).toBe('VideoNotFound');
		});

		it('debería tombstonear y restaurar un Video canónico sin perder source ni metadata', async () => {
			const rootPath = await mkdtemp(resolve(tmpdir(), 'media-manager-video-lifecycle-'));
			temporaryDirectories.push(rootPath);
			const folder = await createTestFolder(rootPath);
			const input = await withCanonicalSource(folder, {
				name: 'restorable.mp4',
				path: '/ignored/restorable.mp4',
				hash: '8'.repeat(64),
				size: 42_000,
				duration: 12,
				width: 640,
				height: 360,
				folderId: folder.id,
			});
			const created = await expectSuccess(VideoService.create(input));

			await expectSuccess(VideoService.deleteById(created.id));
			expect((await expectError(VideoService.getById(created.id)))._tag).toBe('VideoNotFound');
			expect(await expectSuccess(VideoService.getAll({ limit: 20, offset: 0 }))).toEqual([]);
			expect(await db.select().from(videos).where(eq(videos.id, created.id))).toHaveLength(1);
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, created.id))).toHaveLength(1);
			expect((await db.select().from(assets).where(eq(assets.id, created.id)))[0]).toEqual(
				expect.objectContaining({ status: 'deleted', statusBeforeDeletion: 'active' })
			);
			expect(await getFolderFiles({ fileTypes: ['video'], folderId: folder.id })).toEqual(
				expect.objectContaining({ files: [], total: 0 })
			);
			expect(await getFolderFileStats(folder.id)).toEqual(
				expect.objectContaining({ total: 0, totalSize: 0, videos: 0 })
			);
			const deletedStreamChunks = [];
			for await (const chunk of streamFolderFiles({ fileTypes: ['video'], folderId: folder.id })) {
				deletedStreamChunks.push(chunk);
			}
			expect(deletedStreamChunks.find((chunk) => chunk.type === 'metadata')?.metadata?.totalEstimate).toBe(0);
			expect(deletedStreamChunks.flatMap((chunk) => chunk.data ?? [])).toEqual([]);
			expect((await performSearch('restorable', 'video')).results).toEqual([]);
			expect((await fetchMediaCounts()).videos).toBe(0);
			const navigationWhileDeleted = await getNavigationData();
			expect(navigationWhileDeleted.videos).toEqual([]);
			expect(navigationWhileDeleted.folders.find((entry) => entry.id === folder.id)?.itemCount).toBe(0);

			const restored = await expectSuccess(VideoService.restoreById(created.id));
			expect(restored).toEqual(expect.objectContaining({ canonicalState: 'canonical', id: created.id }));
			expect((await db.select().from(assets).where(eq(assets.id, created.id)))[0]).toEqual(
				expect.objectContaining({ status: 'active', statusBeforeDeletion: null })
			);
			expect((await getFolderFiles({ fileTypes: ['video'], folderId: folder.id })).total).toBe(1);
			expect(await getFolderFileStats(folder.id)).toEqual(
				expect.objectContaining({ total: 1, totalSize: 42_000, videos: 1 })
			);
			expect((await performSearch('restorable', 'video')).results).toHaveLength(1);
			expect((await fetchMediaCounts()).videos).toBe(1);
			expect((await getNavigationData()).videos).toHaveLength(1);
		});

		it('debería marcar la source ausente y recuperarla sin borrar el Video canónico', async () => {
			const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-video-sync-'));
			temporaryDirectories.push(directory);
			const rootPath = resolve(directory, 'library');
			await mkdir(rootPath);
			const videoPath = resolve(rootPath, 'observed.mp4');
			await writeFile(videoPath, 'video');
			const rootId = `root-video-${crypto.randomUUID()}`;
			const authorizedRootRegistry = await createAuthorizedRootRegistry([
				{ id: rootId, path: rootPath, permissions: ['index', 'read'] },
			]);
			await db.insert(mediaRoots).values({ id: rootId, label: 'Video sync root' });
			const folder = await createTestFolder(rootPath);
			const created = await expectSuccess(
				VideoService.create({
					name: 'observed.mp4',
					path: videoPath,
					hash: '6'.repeat(64),
					size: 5,
					duration: 1,
					folderId: folder.id,
					source: createAuthorizedPathInput({ absolutePath: videoPath, relativePath: 'observed.mp4', rootId }),
				})
			);

			await rm(videoPath);
			await FileSyncService.getInstance().syncFolderFiles(folder.id, {
				authorizedRootRegistry,
				entityTypes: ['video'],
			});
			expect(await db.select().from(videos).where(eq(videos.id, created.id))).toHaveLength(1);
			expect((await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, created.id)))[0]).toEqual(
				expect.objectContaining({ availability: 'missing' })
			);

			await writeFile(videoPath, 'video');
			await FileSyncService.getInstance().syncFolderFiles(folder.id, {
				authorizedRootRegistry,
				entityTypes: ['video'],
			});
			expect((await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, created.id)))[0]).toEqual(
				expect.objectContaining({ availability: 'available' })
			);
		});

		// TODO: Test force=true cuando se implemente relaciones check
	});

	describe('deleteManyByIds', () => {
		it('debería eliminar múltiples videos', async () => {
			const folder = await createTestFolder();
			const video1 = await createTestVideo(folder.id);
			const video2 = await createTestVideo(folder.id);

			const result = await expectSuccess(VideoService.deleteManyByIds([video1.id, video2.id], false));

			expect(result).toBe(2);
		});

		it('debería retornar count=0 para array vacío', async () => {
			const result = await expectSuccess(VideoService.deleteManyByIds([], false));

			expect(result).toBe(0);
		});
	});
});

// ============= Query Operations Tests =============

describe('VideoService - Query Operations', () => {
	describe('getByHash', () => {
		it('debería encontrar video por hash', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id);

			const result = await expectSuccess(VideoService.getByHash(video.hash));

			expect(result).toBeDefined();
			expect(result?.id).toBe(video.id);
			expect(result?.hash).toBe(video.hash);
		});

		it('debería retornar null si hash no existe', async () => {
			const result = await expectSuccess(VideoService.getByHash('nonexistent'.repeat(6)));

			expect(result).toBeNull();
		});
	});

	describe('getByPathAndFolder', () => {
		it('debería encontrar video por path + folderId', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id);

			const result = await expectSuccess(VideoService.getByPathAndFolder(video.path, folder.id));

			expect(result).toBeDefined();
			expect(result?.id).toBe(video.id);
		});

		it('debería retornar null si no existe', async () => {
			const folder = await createTestFolder();

			const result = await expectSuccess(VideoService.getByPathAndFolder('/nonexistent.mp4', folder.id));

			expect(result).toBeNull();
		});
	});

	describe('getAllFavorites', () => {
		it('debería listar solo favoritos', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const firstFavorite = await createTestVideo(folder.id, { isFavorite: false });
			const secondFavorite = await createTestVideo(folder.id, { isFavorite: false });
			await createTestVideo(folder.id, { isFavorite: true });

			await favoriteService.set(FavoriteEntityType.VIDEO, firstFavorite.id, true);
			await favoriteService.set(FavoriteEntityType.VIDEO, secondFavorite.id, true);

			const result = await expectSuccess(VideoService.getAllFavorites());

			expect(result.length).toBe(2);
			expect(result.map((video) => video.id).sort()).toEqual([firstFavorite.id, secondFavorite.id].sort());
			for (const video of result) {
				expect(video.isFavorite).toBe(true);
			}
		});

		it('debería retornar array vacío si no hay favoritos', async () => {
			const result = await expectSuccess(VideoService.getAllFavorites());

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});

		it('debería soportar paginación en favorites', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const firstFavorite = await createTestVideo(folder.id, { isFavorite: false });
			const secondFavorite = await createTestVideo(folder.id, { isFavorite: false });
			const thirdFavorite = await createTestVideo(folder.id, { isFavorite: false });

			await favoriteService.set(FavoriteEntityType.VIDEO, firstFavorite.id, true);
			await favoriteService.set(FavoriteEntityType.VIDEO, secondFavorite.id, true);
			await favoriteService.set(FavoriteEntityType.VIDEO, thirdFavorite.id, true);

			const result = await expectSuccess(VideoService.getAllFavorites({ limit: 2 }));

			expect(result.length).toBe(2);
			expect(result.every((video) => video.isFavorite)).toBe(true);
		});
	});

	describe('getByFolder', () => {
		it('debería listar videos de un folder específico', async () => {
			const folder1 = await createTestFolder();
			const folder2 = await createTestFolder();
			await createTestVideo(folder1.id);
			await createTestVideo(folder1.id);
			await createTestVideo(folder2.id);

			const result = await expectSuccess(VideoService.getByFolder(folder1.id, {}));

			expect(result.length).toBe(2);
			for (const video of result) {
				expect(video.folderId).toBe(folder1.id);
			}
		});

		it('debería retornar array vacío para folder sin videos', async () => {
			const folder = await createTestFolder();

			const result = await expectSuccess(VideoService.getByFolder(folder.id, {}));

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});

		it('debería soportar paginación en getByFolder', async () => {
			const folder = await createTestFolder();
			await createTestVideo(folder.id);
			await createTestVideo(folder.id);
			await createTestVideo(folder.id);

			const result = await expectSuccess(VideoService.getByFolder(folder.id, { limit: 2 }));

			expect(result.length).toBe(2);
		});
	});

	describe('countByFolder', () => {
		it('debería contar videos en folder', async () => {
			const folder = await createTestFolder();
			await createTestVideo(folder.id);
			await createTestVideo(folder.id);

			const result = await expectSuccess(VideoService.countByFolder(folder.id));

			expect(result).toBe(2);
		});

		it('debería retornar 0 para folder sin videos', async () => {
			const folder = await createTestFolder();

			const result = await expectSuccess(VideoService.countByFolder(folder.id));

			expect(result).toBe(0);
		});
	});
});

// ============= Toggle Operations Tests =============

describe('VideoService - Toggle Operations', () => {
	describe('toggleFavorite', () => {
		it('debería cambiar isFavorite de false a true', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id, { isFavorite: false });
			await ensureActiveProfile();

			const result = await expectSuccess(VideoService.toggleFavorite(video.id));

			expect(result.isFavorite).toBe(true);
		});

		it('debería cambiar isFavorite de true a false', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id, { isFavorite: false });
			await ensureActiveProfile();

			const favorited = await expectSuccess(VideoService.toggleFavorite(video.id));
			expect(favorited.isFavorite).toBe(true);

			const result = await expectSuccess(VideoService.toggleFavorite(video.id));

			expect(result.isFavorite).toBe(false);
		});

		it('debería fallar con VideoNotFound si ID no existe', async () => {
			const nonExistentId = crypto.randomUUID();

			const error = await expectError(VideoService.toggleFavorite(nonExistentId));

			expect(error._tag).toBe('VideoNotFound');
		});

		it('debería delegar toggleFavorite al bridge canónico con perfil activo', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id, { isFavorite: false });
			await ensureActiveProfile();

			const result = await expectSuccess(VideoService.toggleFavorite(video.id));

			expect(result.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.VIDEO, video.id)).toBe(true);
		});
	});

	describe('setFavoriteMany', () => {
		it('debería marcar múltiples videos como favoritos', async () => {
			const folder = await createTestFolder();
			const video1 = await createTestVideo(folder.id, { isFavorite: false });
			const video2 = await createTestVideo(folder.id, { isFavorite: false });
			await ensureActiveProfile();

			const result = await expectSuccess(VideoService.setFavoriteMany([video1.id, video2.id], true));

			expect(result).toBe(2);
		});

		it('debería desmarcar múltiples videos como favoritos', async () => {
			const folder = await createTestFolder();
			const video1 = await createTestVideo(folder.id, { isFavorite: false });
			const video2 = await createTestVideo(folder.id, { isFavorite: false });
			await ensureActiveProfile();
			await expectSuccess(VideoService.setFavoriteMany([video1.id, video2.id], true));

			const result = await expectSuccess(VideoService.setFavoriteMany([video1.id, video2.id], false));

			expect(result).toBe(2);
		});

		it('debería retornar count=0 para array vacío', async () => {
			const result = await expectSuccess(VideoService.setFavoriteMany([], true));

			expect(result).toBe(0);
		});

		it('debería validar que ids no esté vacío', async () => {
			// La validación ocurre en la ruta, pero verificamos que el servicio maneja [] correctamente
			const result = await expectSuccess(VideoService.setFavoriteMany([], true));

			expect(result).toBe(0);
		});

		it('debería persistir favoritos en lote vía bridge canónico con perfil activo', async () => {
			const folder = await createTestFolder();
			const video1 = await createTestVideo(folder.id, { isFavorite: false });
			const video2 = await createTestVideo(folder.id, { isFavorite: false });
			await ensureActiveProfile();

			const result = await expectSuccess(VideoService.setFavoriteMany([video1.id, video2.id], true));

			expect(result).toBe(2);
			expect(await favoriteService.isFavorite(FavoriteEntityType.VIDEO, video1.id)).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.VIDEO, video2.id)).toBe(true);
		});
	});
});

// ============= Stats Operations Tests =============

describe('VideoService - Stats Operations', () => {
	describe('getFormatStats', () => {
		it('debería calcular estadísticas agregadas', async () => {
			const folder = await createTestFolder();
			await createTestVideo(folder.id, {
				size: 10_000_000,
				duration: 120,
				width: 1920,
				height: 1080,
			});
			await createTestVideo(folder.id, {
				size: 20_000_000,
				duration: 240,
				width: 1280,
				height: 720,
			});

			const result = await expectSuccess(VideoService.getFormatStats());

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(1);
			const allStats = result[0];
			expect(allStats.format).toBe('all');
			expect(allStats.count).toBe(2);
			expect(allStats.sumSize).toBe(30_000_000);
			expect(allStats.avgDuration).toBe(180); // (120 + 240) / 2
			expect(allStats.avgWidth).toBe(1600); // (1920 + 1280) / 2
			expect(allStats.avgHeight).toBe(900); // (1080 + 720) / 2
		});

		it('debería retornar array vacío si no hay videos', async () => {
			const result = await expectSuccess(VideoService.getFormatStats());

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});

		it('debería calcular promedios correctamente', async () => {
			const folder = await createTestFolder();
			await createTestVideo(folder.id, {
				width: 1000,
				height: 500,
			});
			await createTestVideo(folder.id, {
				width: 2000,
				height: 1000,
			});

			const result = await expectSuccess(VideoService.getFormatStats());

			const allStats = result[0];
			expect(allStats.avgWidth).toBe(1500);
			expect(allStats.avgHeight).toBe(750);
		});
	});
});
