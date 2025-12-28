/**
 * @file Tests para AlbumService Effect
 * @description Tests completos para CRUD, validación, errors y edge cases del AlbumService
 * @created 2025-10-11 - Fase 3 Effect Implementation
 */

import { Effect, Exit } from 'effect';
import { db } from '@/lib/drizzle';
import { albums, imageAlbums } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { AlbumService, AlbumServiceLive, type GetAlbumsOptions } from '../album.service.effect';
import { AlbumNotFound, AlbumNameConflict } from '../album-errors.effect';

// Helper para ejecutar Effect con timeout
const runEffect = <A, E>(effect: Effect.Effect<A, E, AlbumService>, timeout = 5000) => {
	return Effect.runPromise(Effect.provide(effect, AlbumServiceLive).pipe(Effect.timeout(timeout)));
};

// Helper para ejecutar Effect esperando fallo
const runEffectExpectFailure = <A, E>(effect: Effect.Effect<A, E, AlbumService>) => {
	return Effect.runPromiseExit(Effect.provide(effect, AlbumServiceLive));
};

describe('AlbumService Effect', () => {
	// Track created albums for cleanup
	const createdAlbumIds: string[] = [];

	// Cleanup después de cada test
	afterEach(async () => {
		// Limpiar TODOS los albums creados durante los tests
		try {
			// Primero borrar relaciones
			if (createdAlbumIds.length > 0) {
				await db.delete(imageAlbums);
			}
			// Luego borrar todos los albums de test
			await db.delete(albums);
			// Clear array
			createdAlbumIds.length = 0;
		} catch (error) {
			console.error('[Test Cleanup] Error cleaning albums:', error);
		}
	});

	describe('CRUD Operations', () => {
		describe('create', () => {
			it('should create a new album successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const createInput = {
					name: 'Test Album',
					description: 'Test Description',
					emoji: '📷',
					color: '#FF5733',
					category: 'test',
					isFavorite: false,
				};

				const result = await runEffect(albumService.create(createInput));

				expect(result.name).toBe('Test Album');
				expect(result.description).toBe('Test Description');
				expect(result.emoji).toBe('📷');
				expect(result.color).toBe('#FF5733');
				expect(result.totalImages).toBe(0);
				expect(result.totalVideos).toBe(0);

				// Cleanup
				await db.delete(albums).where(eq(albums.id, result.id));
			});

			it('should fail when creating album with duplicate name', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const createInput = {
					name: 'Duplicate Album',
					description: 'First',
				};

				// Crear primer álbum
				const first = await runEffect(albumService.create(createInput));

				// Intentar crear segundo con mismo nombre
				const exit = await runEffectExpectFailure(
					albumService.create({ name: 'Duplicate Album', description: 'Second' })
				);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					expect(exit.cause._tag).toBe('Fail');
					if (exit.cause._tag === 'Fail') {
						expect(exit.cause.error).toBeInstanceOf(AlbumNameConflict);
					}
				}

				// Cleanup
				await db.delete(albums).where(eq(albums.id, first.id));
			});

			it('should create album with minimal data', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const result = await runEffect(albumService.create({ name: 'Minimal Album' }));

				expect(result.name).toBe('Minimal Album');
				expect(result.description).toBeNull();
				expect(result.emoji).toBeNull();
				expect(result.isFavorite).toBe(false);

				// Cleanup
				await db.delete(albums).where(eq(albums.id, result.id));
			});
		});

		describe('getById', () => {
			it('should retrieve album by id', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				// Crear álbum primero
				const created = await runEffect(albumService.create({ name: 'Get By ID Test' }));

				// Obtener por ID
				const retrieved = await runEffect(albumService.getById(created.id));

				expect(retrieved.id).toBe(created.id);
				expect(retrieved.name).toBe('Get By ID Test');

				// Cleanup
				await db.delete(albums).where(eq(albums.id, created.id));
			});

			it('should fail when album does not exist', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const exit = await runEffectExpectFailure(albumService.getById('non-existent-id'));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					expect(exit.cause._tag).toBe('Fail');
					if (exit.cause._tag === 'Fail') {
						expect(exit.cause.error).toBeInstanceOf(AlbumNotFound);
					}
				}
			});
		});

		describe('getByIdWithStats', () => {
			it('should retrieve album with statistics', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const created = await runEffect(
					albumService.create({
						name: 'Stats Test Album',
						description: 'With description',
						emoji: '🎨',
					})
				);

				const withStats = await runEffect(albumService.getByIdWithStats(created.id));

				expect(withStats.id).toBe(created.id);
				expect(withStats.totalImages).toBe(0);
				expect(withStats.totalVideos).toBe(0);
				expect(withStats.totalSize).toBe(0);

				// Cleanup
				await db.delete(albums).where(eq(albums.id, created.id));
			});
		});

		describe('update', () => {
			it('should update album successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const created = await runEffect(albumService.create({ name: 'Original Name' }));

				const updated = await runEffect(
					albumService.update(created.id, {
						name: 'Updated Name',
						description: 'New description',
						emoji: '🎭',
					})
				);

				expect(updated.name).toBe('Updated Name');
				expect(updated.description).toBe('New description');
				expect(updated.emoji).toBe('🎭');

				// Cleanup
				await db.delete(albums).where(eq(albums.id, created.id));
			});

			it('should fail when updating with duplicate name', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const first = await runEffect(albumService.create({ name: 'First Album' }));
				const second = await runEffect(albumService.create({ name: 'Second Album' }));

				const exit = await runEffectExpectFailure(albumService.update(second.id, { name: 'First Album' }));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					expect(exit.cause._tag).toBe('Fail');
					if (exit.cause._tag === 'Fail') {
						expect(exit.cause.error).toBeInstanceOf(AlbumNameConflict);
					}
				}

				// Cleanup
				await db.delete(albums).where(eq(albums.id, first.id));
				await db.delete(albums).where(eq(albums.id, second.id));
			});

			it('should update only provided fields', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const created = await runEffect(
					albumService.create({
						name: 'Original',
						description: 'Original Desc',
						emoji: '📷',
					})
				);

				const updated = await runEffect(albumService.update(created.id, { emoji: '🎨' }));

				expect(updated.name).toBe('Original');
				expect(updated.description).toBe('Original Desc');
				expect(updated.emoji).toBe('🎨');

				// Cleanup
				await db.delete(albums).where(eq(albums.id, created.id));
			});
		});

		describe('delete', () => {
			it('should delete album successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const created = await runEffect(albumService.create({ name: 'To Delete' }));

				await runEffect(albumService.delete(created.id));

				// Verificar que ya no existe
				const exit = await runEffectExpectFailure(albumService.getById(created.id));

				expect(Exit.isFailure(exit)).toBe(true);
			});

			it('should fail when deleting non-existent album', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const exit = await runEffectExpectFailure(albumService.delete('non-existent-id'));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					expect(exit.cause._tag).toBe('Fail');
					if (exit.cause._tag === 'Fail') {
						expect(exit.cause.error).toBeInstanceOf(AlbumNotFound);
					}
				}
			});
		});

		describe('getAll', () => {
			it('should retrieve all albums with default options', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				// Crear algunos álbumes
				const album1 = await runEffect(albumService.create({ name: 'Album 1' }));
				const album2 = await runEffect(albumService.create({ name: 'Album 2' }));

				const result = await runEffect(albumService.getAll());

				expect(result.albums.length).toBeGreaterThanOrEqual(2);
				expect(result.total).toBeGreaterThanOrEqual(2);
				expect(result.limit).toBe(50);
				expect(result.offset).toBe(0);

				// Cleanup
				await db.delete(albums).where(eq(albums.id, album1.id));
				await db.delete(albums).where(eq(albums.id, album2.id));
			});

			it('should filter albums by search term', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const unique = Date.now().toString();
				const searchable = await runEffect(albumService.create({ name: `Searchable ${unique}` }));

				const result = await runEffect(albumService.getAll({ search: unique }));

				expect(result.albums.length).toBeGreaterThan(0);
				expect(result.albums.some((a) => a.id === searchable.id)).toBe(true);

				// Cleanup
				await db.delete(albums).where(eq(albums.id, searchable.id));
			});

			it('should filter only favorites', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const favorite = await runEffect(albumService.create({ name: 'Favorite', isFavorite: true }));
				const normal = await runEffect(albumService.create({ name: 'Normal', isFavorite: false }));

				const result = await runEffect(albumService.getAll({ onlyFavorites: true }));

				expect(result.albums.every((a) => a.isFavorite)).toBe(true);

				// Cleanup
				await db.delete(albums).where(eq(albums.id, favorite.id));
				await db.delete(albums).where(eq(albums.id, normal.id));
			});

			it('should respect limit and offset', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const options: GetAlbumsOptions = {
					limit: 2,
					offset: 0,
				};

				const result = await runEffect(albumService.getAll(options));

				expect(result.albums.length).toBeLessThanOrEqual(2);
				expect(result.limit).toBe(2);
				expect(result.offset).toBe(0);
			});
		});

		describe('toggleFavorite', () => {
			it('should toggle favorite status', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const created = await runEffect(albumService.create({ name: 'Toggle Test', isFavorite: false }));

				// Toggle to true
				const toggled1 = await runEffect(albumService.toggleFavorite(created.id));
				expect(toggled1.isFavorite).toBe(true);

				// Toggle back to false
				const toggled2 = await runEffect(albumService.toggleFavorite(created.id));
				expect(toggled2.isFavorite).toBe(false);

				// Cleanup
				await db.delete(albums).where(eq(albums.id, created.id));
			});
		});
	});

	describe('Batch Operations', () => {
		describe('bulkDelete', () => {
			it('should delete multiple albums', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const album1 = await runEffect(albumService.create({ name: 'Bulk 1' }));
				const album2 = await runEffect(albumService.create({ name: 'Bulk 2' }));
				const album3 = await runEffect(albumService.create({ name: 'Bulk 3' }));

				const result = await runEffect(albumService.bulkDelete([album1.id, album2.id, album3.id]));

				expect(result.deleted).toBe(3);
				expect(result.failed.length).toBe(0);
			});

			it('should report failures in bulk delete', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const existing = await runEffect(albumService.create({ name: 'Existing' }));

				const result = await runEffect(albumService.bulkDelete([existing.id, 'non-existent-1', 'non-existent-2']));

				expect(result.deleted).toBe(1);
				expect(result.failed.length).toBe(2);
				expect(result.failed).toContain('non-existent-1');
				expect(result.failed).toContain('non-existent-2');
			});
		});
	});

	describe('Statistics', () => {
		describe('getRelationsCounts', () => {
			it('should return counts for album relations', async () => {
				const service = Effect.gen(function* () {
					return yield* AlbumService;
				});

				const albumService = await runEffect(service);

				const album = await runEffect(albumService.create({ name: 'Counts Test' }));

				const counts = await runEffect(albumService.getRelationsCounts(album.id));

				expect(counts.images).toBe(0);
				expect(counts.videos).toBe(0);
				expect(counts.collections).toBe(0);
				expect(counts.tags).toBe(0);

				// Cleanup
				await db.delete(albums).where(eq(albums.id, album.id));
			});
		});
	});

	describe('Error Handling', () => {
		it('should provide descriptive error messages', async () => {
			const service = Effect.gen(function* () {
				return yield* AlbumService;
			});

			const albumService = await runEffect(service);

			const exit = await runEffectExpectFailure(albumService.getById('test-error-id'));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				expect(exit.cause._tag).toBe('Fail');
				if (exit.cause._tag === 'Fail') {
					const error = exit.cause.error;
					expect(error).toBeInstanceOf(AlbumNotFound);
					if (error instanceof AlbumNotFound) {
						expect(error.displayMessage).toContain('test-error-id');
					}
				}
			}
		});
	});
});
