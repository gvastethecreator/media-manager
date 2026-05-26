/**
 * @file Tests para PlaceService con Effect
 * @module services/place/__tests__/place.service.effect.test
 */

import { Effect, pipe } from 'effect';
import { db } from '@/lib/drizzle';
import { imagePlaces, places } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { expectError, expectSuccess, generateTestId } from '../../../../tests/factories/test-helpers';
import { PlaceService, PlaceServiceLive } from '../place.service.effect';

// ============= Helpers =============

const run = <A, E>(effect: Effect.Effect<A, E, PlaceService>) =>
	pipe(effect, Effect.provide(PlaceServiceLive));

const createTestPlace = async (overrides?: Record<string, unknown>) => {
	const id = generateTestId('place');
	const defaults: Record<string, unknown> = {
		id,
		name: `test-place-${Date.now()}`,
		description: null,
		emoji: '📍',
		color: '#14b8a6',
		isFavorite: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const values = { ...defaults, ...overrides };
	await db.insert(places).values(values);
	return { id, name: values.name as string };
};

// ============= Cleanup =============

afterEach(async () => {
	await db.delete(imagePlaces);
	await db.delete(places);
});

// ============= CRUD TESTS =============

describe('PlaceService - CRUD Operations', () => {
	describe('create', () => {
		it('should create a place successfully', async () => {
			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.create({ name: 'Rivendell' });
					})
				)
			);

			expect(result.name).toBe('Rivendell');
			expect(await favoriteService.isFavorite(FavoriteEntityType.PLACE, result.id)).toBe(false);
		});

		it('should create place with optional fields', async () => {
			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.create({
							name: 'Mordor',
							emoji: '🌋',
							color: '#ef4444',
							description: 'Dark land of Sauron',
							category: 'kingdom',
						});
					})
				)
			);

			expect(result.name).toBe('Mordor');
			expect(result.emoji).toBe('🌋');
			expect(result.color).toBe('#ef4444');
			expect(result.description).toBe('Dark land of Sauron');
			expect(result.category).toBe('kingdom');
		});

		it('should fail with duplicate name', async () => {
			await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.create({ name: 'Gondor' });
					})
				)
			);

			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.create({ name: 'Gondor' });
					})
				)
			);

			expect(error._tag).toBe('PlaceNameConflict');
		});
	});

	describe('getById', () => {
		it('should retrieve a place by ID', async () => {
			const { id, name } = await createTestPlace({ name: 'The Shire' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.getById(id);
					})
				)
			);

			expect(result.id).toBe(id);
			expect(result.name).toBe(name);
		});

		it('should fail when place does not exist', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.getById('non-existent-id');
					})
				)
			);

			expect(error._tag).toBe('PlaceNotFound');
		});
	});

	describe('getAll', () => {
		it('should list all places', async () => {
			await createTestPlace({ name: 'Helms Deep' });
			await createTestPlace({ name: 'Minas Tirith' });
			await createTestPlace({ name: 'Isengard' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.getAll();
					})
				)
			);

			expect(result.places.length).toBe(3);
			expect(result.total).toBe(3);
		});

		it('should paginate results', async () => {
			for (let i = 0; i < 5; i++) {
				await createTestPlace({ name: `Village-${i}` });
			}

			const page1 = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.getAll({ limit: 2, offset: 0 });
					})
				)
			);
			expect(page1.places.length).toBe(2);
			expect(page1.total).toBe(5);

			const page3 = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.getAll({ limit: 2, offset: 4 });
					})
				)
			);
			expect(page3.places.length).toBe(1);
		});

		it('should search by name', async () => {
			await createTestPlace({ name: 'Dark Forest' });
			await createTestPlace({ name: 'Dark Tower' });
			await createTestPlace({ name: 'White City' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.getAll({ search: 'Dark' });
					})
				)
			);

			expect(result.places.length).toBe(2);
			expect(result.places.every((p: any) => p.name.includes('Dark'))).toBe(true);
		});

		it('should filter by category', async () => {
			await createTestPlace({ name: 'Forest Realm', category: 'forest' });
			await createTestPlace({ name: 'Mountain Peak', category: 'mountain' });
			await createTestPlace({ name: 'Deep Woods', category: 'forest' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.getAll({ category: 'forest' });
					})
				)
			);

			expect(result.places.length).toBe(2);
			expect(result.places.every((p: any) => p.category === 'forest')).toBe(true);
		});

		it('should sort by name ascending', async () => {
			await createTestPlace({ name: 'Zion' });
			await createTestPlace({ name: 'Alpha' });
			await createTestPlace({ name: 'Omega' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.getAll({ orderBy: 'name', orderDirection: 'asc' });
					})
				)
			);

			expect(result.places[0].name).toBe('Alpha');
			expect(result.places[1].name).toBe('Omega');
			expect(result.places[2].name).toBe('Zion');
		});

		it('should sort by name descending', async () => {
			await createTestPlace({ name: 'Zion' });
			await createTestPlace({ name: 'Alpha' });
			await createTestPlace({ name: 'Omega' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.getAll({ orderBy: 'name', orderDirection: 'desc' });
					})
				)
			);

			expect(result.places[0].name).toBe('Zion');
			expect(result.places[1].name).toBe('Omega');
			expect(result.places[2].name).toBe('Alpha');
		});
	});

	describe('update', () => {
		it('should update place fields', async () => {
			const { id } = await createTestPlace({ name: 'Old Place' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.update(id, {
							name: 'New Place',
							description: 'Renovated area',
							emoji: '🏰',
						});
					})
				)
			);

			expect(result.name).toBe('New Place');
			expect(result.description).toBe('Renovated area');
			expect(result.emoji).toBe('🏰');
		});

		it('should fail when updating non-existent place', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.update('non-existent-id', { name: 'Test' });
					})
				)
			);

			expect(error._tag).toBe('PlaceNotFound');
		});
	});

	describe('delete', () => {
		it('should delete a place', async () => {
			const { id } = await createTestPlace();

			await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.delete(id);
					})
				)
			);

			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.getById(id);
					})
				)
			);
			expect(error._tag).toBe('PlaceNotFound');
		});

		it('should fail when deleting non-existent place', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* PlaceService;
						return yield* svc.delete('non-existent-id');
					})
				)
			);

			expect(error._tag).toBe('PlaceNotFound');
		});
	});
});
