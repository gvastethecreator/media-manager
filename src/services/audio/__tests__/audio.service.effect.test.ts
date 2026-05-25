/**
 * @file Tests para AudioService con Effect
 * @module services/audio/__tests__/audio.service.effect.test
 * @description Test suite completo para AudioService usando Effect-TS
 * @created 2025-01-10 - Phase 6.3: Audio Test Suite
 */

import { Effect } from 'effect';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { audios, favorites, folders, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import * as AudioService from '../audio.service.effect';

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

const createTestAudio = async (folderId: string, overrides?: Partial<typeof audios.$inferInsert>) => {
	const now = new Date();
	const timestamp = Date.now().toString();
	const validHash = timestamp.padStart(64, '0'); // SHA-256: exactly 64 hex chars

	const [audio] = await db
		.insert(audios)
		.values({
			id: crypto.randomUUID(),
			name: `test-audio-${Date.now()}.mp3`,
			path: `/test/audio-${Date.now()}.mp3`,
			hash: validHash,
			size: 5_000_000, // 5MB
			mimeType: 'audio/mpeg',
			extension: 'mp3',
			duration: 180, // 3m
			bitrate: 320_000, // 320kbps
			sampleRate: 44_100,
			channels: 2,
			format: 'mp3',
			folderId,
			isFavorite: false,
			isArchived: false,
			createdAt: now,
			updatedAt: now,
			...overrides,
		})
		.returning();
	return audio;
};

let createdActiveProfileId: string | null = null;

const ensureActiveProfile = async () => {
	const [activeProfile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true)).limit(1);

	if (activeProfile) {
		return activeProfile.id;
	}

	const profileId = `audio-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Audio Service Test Profile',
		emoji: '🎧',
		color: '#10b981',
		description: 'Perfil activo para tests de audios',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

// ============= Cleanup =============

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.AUDIO));
	// Limpiar audios de prueba (todos los registros)
	await db.delete(audios);
	// Limpiar folders de prueba (todos los registros)
	await db.delete(folders);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

// ============= CRUD Operations Tests =============

describe('AudioService - CRUD Operations', () => {
	describe('create', () => {
		it('debería crear un nuevo audio exitosamente', async () => {
			const folder = await createTestFolder();
			const validHash = Date.now().toString().padStart(64, '0');

			const input = {
				name: 'test-audio.mp3',
				description: null,
				path: '/test/audio.mp3',
				size: 5_000_000,
				hash: validHash,
				mimeType: 'audio/mpeg',
				extension: 'mp3',
				folderId: folder.id,
				isFavorite: false,
				isArchived: false,
				duration: 180,
				bitrate: 320_000,
				sampleRate: 44_100,
				channels: 2,
				format: 'mp3',
				codec: null,
				title: 'Test Song',
				artist: 'Test Artist',
				album: 'Test Album',
				year: null,
				genre: 'Test Genre',
				track: null,
				disc: null,
				albumArtist: null,
				composer: null,
				comment: null,
				lyrics: null,
				bpm: null,
				key: null,
				mood: null,
			};

			const audio = await expectSuccess(AudioService.create(input));

			expect(audio.id).toBeDefined();
			expect(audio.name).toBe(input.name);
			expect(audio.path).toBe(input.path);
			expect(audio.hash).toBe(validHash);
			expect(audio.size).toBe(input.size);
			expect(audio.duration).toBe(input.duration);
			expect(audio.format).toBe(input.format);
			expect(audio.title).toBe(input.title);
			expect(audio.artist).toBe(input.artist);
		});

		it('debería fallar si el hash ya existe', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id);

			const input = {
				name: 'duplicate.mp3',
				path: '/test/duplicate.mp3',
				size: 3_000_000,
				hash: audio.hash,
				mimeType: 'audio/mpeg',
				extension: 'mp3',
				folderId: folder.id,
			};

			const error = await expectError(AudioService.create(input as any));

			expect(error._tag).toBe('AudioHashConflict');
			if (error._tag === 'AudioHashConflict') {
				expect(error.hash).toBe(audio.hash);
				expect(error.existingId).toBe(audio.id);
			}
		});

		it('debería fallar si el size excede 10GB', async () => {
			const folder = await createTestFolder();
			const validHash = Date.now().toString().padStart(64, '0');

			const input = {
				name: 'huge-audio.mp3',
				path: '/test/huge.mp3',
				size: 10_737_418_241, // 10GB + 1 byte
				hash: validHash,
				mimeType: 'audio/mpeg',
				extension: 'mp3',
				folderId: folder.id,
			};

			const error = await expectError(AudioService.create(input as any));

			expect(error._tag).toBe('AudioValidationError');
			if (error._tag === 'AudioValidationError') {
				expect(error.field).toBe('size');
			}
		});

		it('debería fallar si duration excede 24h', async () => {
			const folder = await createTestFolder();
			const validHash = Date.now().toString().padStart(64, '0');

			const input = {
				name: 'long-audio.mp3',
				path: '/test/long.mp3',
				size: 5_000_000,
				hash: validHash,
				mimeType: 'audio/mpeg',
				extension: 'mp3',
				folderId: folder.id,
				duration: 86_401, // 24h + 1s
			};

			const error = await expectError(AudioService.create(input as any));

			expect(error._tag).toBe('AudioValidationError');
			if (error._tag === 'AudioValidationError') {
				expect(error.field).toBe('duration');
			}
		});

		it('debería fallar si hash no tiene 64 caracteres', async () => {
			const folder = await createTestFolder();

			const input = {
				name: 'short-hash.mp3',
				path: '/test/short-hash.mp3',
				size: 5_000_000,
				hash: 'tooshort',
				mimeType: 'audio/mpeg',
				extension: 'mp3',
				folderId: folder.id,
			};

			const error = await expectError(AudioService.create(input as any));

			expect(error._tag).toBe('AudioValidationError');
			if (error._tag === 'AudioValidationError') {
				expect(error.field).toBe('hash');
			}
		});
	});

	describe('getById', () => {
		it('debería obtener un audio por ID exitosamente', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id);

			const result = await expectSuccess(AudioService.getById(audio.id));

			expect(result.id).toBe(audio.id);
			expect(result.name).toBe(audio.name);
			expect(result.hash).toBe(audio.hash);
		});

		it('debería fallar si el audio no existe', async () => {
			const error = await expectError(AudioService.getById('nonexistent-id'));

			expect(error._tag).toBe('AudioNotFound');
			if (error._tag === 'AudioNotFound') {
				expect(error.id).toBe('nonexistent-id');
			}
		});
	});

	describe('getByIdWithStats', () => {
		it('debería obtener un audio con estadísticas', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id);

			const result = await expectSuccess(AudioService.getByIdWithStats(audio.id));

			expect(result.id).toBe(audio.id);
			expect(result.entityType).toBe('audio');
			expect(result.stats).toBeDefined();
			expect(result.stats.duration).toBeDefined();
			expect(result.stats.format).toBeDefined();
			expect(result.stats.bitrate).toBeDefined();
			expect(result._count).toBeDefined();
			expect(result._count?.tags).toBe(0);
		});
	});

	describe('getAll', () => {
		it('debería listar audios con filtros de paginación', async () => {
			const folder = await createTestFolder();
			await createTestAudio(folder.id, { name: 'audio1.mp3' });
			await createTestAudio(folder.id, { name: 'audio2.mp3' });

			const result = await expectSuccess(AudioService.getAll({ limit: 10, offset: 0 }));

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(2);
		});

		it('debería filtrar por folderId', async () => {
			const folder1 = await createTestFolder();
			const folder2 = await createTestFolder();
			await createTestAudio(folder1.id);
			await createTestAudio(folder2.id);

			const result = await expectSuccess(AudioService.getAll({ folderId: folder1.id }));

			expect(result.length).toBe(1);
			expect(result[0].folderId).toBe(folder1.id);
		});

		it('debería filtrar por isFavorite', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const favoriteAudio = await createTestAudio(folder.id, { isFavorite: false });
			await createTestAudio(folder.id, { isFavorite: true });

			await favoriteService.set(FavoriteEntityType.AUDIO, favoriteAudio.id, true);

			const result = await expectSuccess(AudioService.getAll({ isFavorite: true }));

			expect(result.length).toBe(1);
			expect(result[0].id).toBe(favoriteAudio.id);
			expect(result[0].isFavorite).toBe(true);
		});

		it('debería ordenar por nombre ascendente', async () => {
			const folder = await createTestFolder();
			await createTestAudio(folder.id, { name: 'charlie.mp3' });
			await createTestAudio(folder.id, { name: 'alpha.mp3' });
			await createTestAudio(folder.id, { name: 'bravo.mp3' });

			const result = await expectSuccess(AudioService.getAll({ sortBy: 'name', sortOrder: 'asc' }));

			expect(result[0].name).toBe('alpha.mp3');
			expect(result[1].name).toBe('bravo.mp3');
			expect(result[2].name).toBe('charlie.mp3');
		});

		it('debería retornar array vacío si no hay audios', async () => {
			const result = await expectSuccess(AudioService.getAll({}));

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});
	});

	describe('update', () => {
		it('debería actualizar un audio exitosamente', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id);

			const updated = await expectSuccess(
				AudioService.update(audio.id, { title: 'Updated Title', artist: 'New Artist' })
			);

			expect(updated.id).toBe(audio.id);
			expect(updated.title).toBe('Updated Title');
			expect(updated.artist).toBe('New Artist');
		});

		it('debería fallar si el audio no existe', async () => {
			const error = await expectError(AudioService.update('nonexistent-id', { title: 'Test' }));

			expect(error._tag).toBe('AudioNotFound');
		});

		it('debería fallar si duration excede límite en update', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id);

			const error = await expectError(AudioService.update(audio.id, { duration: 86_401 }));

			expect(error._tag).toBe('AudioValidationError');
			if (error._tag === 'AudioValidationError') {
				expect(error.field).toBe('duration');
			}
		});
	});

	describe('deleteById', () => {
		it('debería eliminar un audio exitosamente', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id);

			await expectSuccess(AudioService.deleteById(audio.id));

			const error = await expectError(AudioService.getById(audio.id));
			expect(error._tag).toBe('AudioNotFound');
		});

		it('debería fallar si el audio no existe', async () => {
			const error = await expectError(AudioService.deleteById('nonexistent-id'));

			expect(error._tag).toBe('AudioNotFound');
		});

		it('debería eliminar con force=true', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id);

			await expectSuccess(AudioService.deleteById(audio.id, true));

			const error = await expectError(AudioService.getById(audio.id));
			expect(error._tag).toBe('AudioNotFound');
		});
	});

	describe('deleteManyByIds', () => {
		it('debería eliminar múltiples audios exitosamente', async () => {
			const folder = await createTestFolder();
			const audio1 = await createTestAudio(folder.id);
			const audio2 = await createTestAudio(folder.id);

			const deletedCount = await expectSuccess(AudioService.deleteManyByIds([audio1.id, audio2.id]));

			expect(deletedCount).toBe(2);
		});

		it('debería retornar 0 si el array está vacío', async () => {
			const deletedCount = await expectSuccess(AudioService.deleteManyByIds([]));

			expect(deletedCount).toBe(0);
		});
	});
});

// ============= Query Operations Tests =============

describe('AudioService - Query Operations', () => {
	describe('getByHash', () => {
		it('debería encontrar un audio por hash', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id);

			const result = await expectSuccess(AudioService.getByHash(audio.hash));

			expect(result).toBeDefined();
			expect(result?.id).toBe(audio.id);
			expect(result?.hash).toBe(audio.hash);
		});

		it('debería retornar null si no existe', async () => {
			const nonexistentHash = '0'.repeat(64);
			const result = await expectSuccess(AudioService.getByHash(nonexistentHash));

			expect(result).toBeNull();
		});
	});

	describe('getByPathAndFolder', () => {
		it('debería encontrar un audio por path y folder', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id);

			const result = await expectSuccess(AudioService.getByPathAndFolder(audio.path, folder.id));

			expect(result).toBeDefined();
			expect(result?.id).toBe(audio.id);
			expect(result?.path).toBe(audio.path);
		});

		it('debería retornar null si no existe', async () => {
			const folder = await createTestFolder();
			const result = await expectSuccess(AudioService.getByPathAndFolder('/nonexistent/path.mp3', folder.id));

			expect(result).toBeNull();
		});
	});

	describe('getAllFavorites', () => {
		it('debería listar solo audios favoritos', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const firstFavorite = await createTestAudio(folder.id, { isFavorite: false });
			const secondFavorite = await createTestAudio(folder.id, { isFavorite: false });
			await createTestAudio(folder.id, { isFavorite: true });

			await favoriteService.set(FavoriteEntityType.AUDIO, firstFavorite.id, true);
			await favoriteService.set(FavoriteEntityType.AUDIO, secondFavorite.id, true);

			const result = await expectSuccess(AudioService.getAllFavorites({}));

			expect(result.length).toBe(2);
			expect(result.map((audio) => audio.id).sort()).toEqual([firstFavorite.id, secondFavorite.id].sort());
			for (const audio of result) {
				expect(audio.isFavorite).toBe(true);
			}
		});

		it('debería retornar array vacío si no hay favoritos', async () => {
			const folder = await createTestFolder();
			await createTestAudio(folder.id, { isFavorite: false });

			const result = await expectSuccess(AudioService.getAllFavorites({}));

			expect(result.length).toBe(0);
		});

		it('debería soportar paginación en favoritos', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const firstFavorite = await createTestAudio(folder.id, { isFavorite: false, name: 'fav1.mp3' });
			const secondFavorite = await createTestAudio(folder.id, { isFavorite: false, name: 'fav2.mp3' });

			await favoriteService.set(FavoriteEntityType.AUDIO, firstFavorite.id, true);
			await favoriteService.set(FavoriteEntityType.AUDIO, secondFavorite.id, true);

			const result = await expectSuccess(AudioService.getAllFavorites({ limit: 1, offset: 0 }));

			expect(result.length).toBe(1);
			expect(result[0]?.isFavorite).toBe(true);
		});
	});

	describe('getByFolder', () => {
		it('debería listar audios de un folder específico', async () => {
			const folder1 = await createTestFolder();
			const folder2 = await createTestFolder();
			await createTestAudio(folder1.id);
			await createTestAudio(folder1.id);
			await createTestAudio(folder2.id);

			const result = await expectSuccess(AudioService.getByFolder(folder1.id, {}));

			expect(result.length).toBe(2);
			for (const audio of result) {
				expect(audio.folderId).toBe(folder1.id);
			}
		});

		it('debería retornar array vacío si el folder no tiene audios', async () => {
			const folder = await createTestFolder();

			const result = await expectSuccess(AudioService.getByFolder(folder.id, {}));

			expect(result.length).toBe(0);
		});

		it('debería soportar paginación en getByFolder', async () => {
			const folder = await createTestFolder();
			await createTestAudio(folder.id, { name: 'audio1.mp3' });
			await createTestAudio(folder.id, { name: 'audio2.mp3' });

			const result = await expectSuccess(AudioService.getByFolder(folder.id, { limit: 1, offset: 0 }));

			expect(result.length).toBe(1);
		});
	});

	describe('countByFolder', () => {
		it('debería contar audios en un folder', async () => {
			const folder = await createTestFolder();
			await createTestAudio(folder.id);
			await createTestAudio(folder.id);

			const count = await expectSuccess(AudioService.countByFolder(folder.id));

			expect(count).toBe(2);
		});

		it('debería retornar 0 si el folder no tiene audios', async () => {
			const folder = await createTestFolder();

			const count = await expectSuccess(AudioService.countByFolder(folder.id));

			expect(count).toBe(0);
		});
	});
});

// ============= Toggle Operations Tests =============

describe('AudioService - Toggle Operations', () => {
	describe('toggleFavorite', () => {
		it('debería cambiar de false a true', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id, { isFavorite: false });

			const updated = await expectSuccess(AudioService.toggleFavorite(audio.id));

			expect(updated.isFavorite).toBe(true);
		});

		it('debería cambiar de true a false', async () => {
			const folder = await createTestFolder();
			const audio = await createTestAudio(folder.id, { isFavorite: true });

			const updated = await expectSuccess(AudioService.toggleFavorite(audio.id));

			expect(updated.isFavorite).toBe(false);
		});

		it('debería fallar si el audio no existe', async () => {
			const error = await expectError(AudioService.toggleFavorite('nonexistent-id'));

			expect(error._tag).toBe('AudioNotFound');
		});
	});

	describe('setFavoriteMany', () => {
		it('debería marcar múltiples audios como favoritos', async () => {
			const folder = await createTestFolder();
			const audio1 = await createTestAudio(folder.id, { isFavorite: false });
			const audio2 = await createTestAudio(folder.id, { isFavorite: false });

			const updatedCount = await expectSuccess(AudioService.setFavoriteMany([audio1.id, audio2.id], true));

			expect(updatedCount).toBe(2);

			const updated1 = await expectSuccess(AudioService.getById(audio1.id));
			const updated2 = await expectSuccess(AudioService.getById(audio2.id));
			expect(updated1.isFavorite).toBe(true);
			expect(updated2.isFavorite).toBe(true);
		});

		it('debería desmarcar múltiples audios como favoritos', async () => {
			const folder = await createTestFolder();
			const audio1 = await createTestAudio(folder.id, { isFavorite: true });
			const audio2 = await createTestAudio(folder.id, { isFavorite: true });

			const updatedCount = await expectSuccess(AudioService.setFavoriteMany([audio1.id, audio2.id], false));

			expect(updatedCount).toBe(2);

			const updated1 = await expectSuccess(AudioService.getById(audio1.id));
			const updated2 = await expectSuccess(AudioService.getById(audio2.id));
			expect(updated1.isFavorite).toBe(false);
			expect(updated2.isFavorite).toBe(false);
		});

		it('debería retornar 0 si el array está vacío', async () => {
			const updatedCount = await expectSuccess(AudioService.setFavoriteMany([], true));

			expect(updatedCount).toBe(0);
		});
	});
});

// ============= Stats Operations Tests =============

describe('AudioService - Stats Operations', () => {
	describe('getFormatStats', () => {
		it('debería calcular estadísticas con audios', async () => {
			const folder = await createTestFolder();
			await createTestAudio(folder.id, { size: 5_000_000, duration: 180, bitrate: 320_000, sampleRate: 44_100 });
			await createTestAudio(folder.id, { size: 3_000_000, duration: 120, bitrate: 256_000, sampleRate: 48_000 });

			const stats = await expectSuccess(AudioService.getFormatStats());

			expect(Array.isArray(stats)).toBe(true);
			expect(stats.length).toBeGreaterThan(0);
			expect(stats[0]).toHaveProperty('format');
			expect(stats[0]).toHaveProperty('count');
			expect(stats[0]).toHaveProperty('sumSize');
			expect(stats[0]).toHaveProperty('avgDuration');
			expect(stats[0]).toHaveProperty('avgBitrate');
			expect(stats[0]).toHaveProperty('avgSampleRate');
			expect(stats[0].count).toBe(2);
			expect(stats[0].sumSize).toBe(8_000_000);
		});

		it('debería retornar array vacío si no hay audios', async () => {
			const stats = await expectSuccess(AudioService.getFormatStats());

			expect(Array.isArray(stats)).toBe(true);
			expect(stats.length).toBe(0);
		});

		it('debería calcular promedios correctamente', async () => {
			const folder = await createTestFolder();
			await createTestAudio(folder.id, { duration: 100, bitrate: 100_000, sampleRate: 44_100 });
			await createTestAudio(folder.id, { duration: 200, bitrate: 200_000, sampleRate: 48_000 });

			const stats = await expectSuccess(AudioService.getFormatStats());

			expect(stats[0].avgDuration).toBe(150); // (100 + 200) / 2
			expect(stats[0].avgBitrate).toBe(150_000); // (100k + 200k) / 2
			expect(stats[0].avgSampleRate).toBe(46_050); // (44.1k + 48k) / 2
		});
	});
});
