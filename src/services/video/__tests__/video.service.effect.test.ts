/**
 * @file Tests para VideoService con Effect
 * @module services/video/__tests__/video.service.effect.test
 * @description Test suite completo para VideoService usando Effect-TS
 * @created 2025-01-10 - Phase 6.2: Video Test Suite
 */

import { Effect } from 'effect';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { favorites, folders, profiles, videos } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
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

const createTestFolder = async () => {
	const now = new Date();
	const [folder] = await db
		.insert(folders)
		.values({
			id: crypto.randomUUID(),
			name: `test-folder-${Date.now()}`,
			path: `/test/folder-${Date.now()}`,
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
	const timestamp = Date.now().toString();
	const validHash = timestamp.padStart(64, '0'); // SHA-256: exactly 64 hex chars

	const [video] = await db
		.insert(videos)
		.values({
			id: crypto.randomUUID(),
			name: `test-video-${Date.now()}.mp4`,
			path: `/test/video-${Date.now()}.mp4`,
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

let createdActiveProfileId: string | null = null;
let previousActiveProfileIds: string[] = [];

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

			const result = await expectSuccess(VideoService.create(input));

			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect(result.name).toBe('nuevo-video.mp4');
			expect(result.hash).toBe('1'.repeat(64));
			expect(result.size).toBe(50_000_000);
			expect(result.duration).toBe(300);
			expect(result.isFavorite).toBe(false);
		});

		it('debería persistir el favorito vía bridge canónico al crear con perfil activo', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();

			const result = await expectSuccess(
				VideoService.create({
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
			);

			expect(result.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.VIDEO, result.id)).toBe(true);
		});

		it('debería fallar con VideoHashConflict si hash ya existe', async () => {
			const folder = await createTestFolder();
			const existingVideo = await createTestVideo(folder.id);

			const input = {
				name: 'duplicate.mp4',
				path: '/test/duplicate.mp4',
				hash: existingVideo.hash,
				size: 10_000_000,
				duration: 120,
				width: 1920,
				height: 1080,
				folderId: folder.id,
			};

			const error = await expectError(VideoService.create(input));

			expect(error._tag).toBe('VideoHashConflict');
			if (error._tag === 'VideoHashConflict') {
				expect(error.hash).toBe(existingVideo.hash);
				expect(error.existingId).toBe(existingVideo.id);
			}
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

			const error = await expectError(VideoService.create(input));

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

			const error = await expectError(VideoService.create(input));

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

			const error = await expectError(VideoService.create(input));

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
			};

			const error = await expectError(VideoService.create(input));

			expect(error._tag).toBe('VideoValidationError');
			if (error._tag === 'VideoValidationError') {
				expect(error.field).toBe('path');
			}
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

			const result = await expectSuccess(VideoService.update(video.id, { isFavorite: true }));

			expect(result.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.VIDEO, video.id)).toBe(true);
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

			const result = await expectSuccess(VideoService.toggleFavorite(video.id));

			expect(result.isFavorite).toBe(true);
		});

		it('debería cambiar isFavorite de true a false', async () => {
			const folder = await createTestFolder();
			const video = await createTestVideo(folder.id, { isFavorite: false });

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

			const result = await expectSuccess(VideoService.setFavoriteMany([video1.id, video2.id], true));

			expect(result).toBe(2);
		});

		it('debería desmarcar múltiples videos como favoritos', async () => {
			const folder = await createTestFolder();
			const video1 = await createTestVideo(folder.id, { isFavorite: true });
			const video2 = await createTestVideo(folder.id, { isFavorite: true });

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
