/**
 * @file Tests para ConceptService con Effect
 * @module services/concept/__tests__/concept.service.effect.test
 */

import { Effect, pipe } from 'effect';
import { db } from '@/lib/drizzle';
import { concepts, imageConcepts, videoConcepts } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { expectError, expectSuccess, generateTestId } from '../../../../tests/factories/test-helpers';
import { ConceptService, ConceptServiceLive } from '../concept.service.effect';

// ============= Helpers =============

const run = <A, E>(effect: Effect.Effect<A, E, ConceptService>) =>
	pipe(effect, Effect.provide(ConceptServiceLive));

const createTestConcept = async (overrides?: Record<string, unknown>) => {
	const id = generateTestId('concept');
	const defaults: Record<string, unknown> = {
		id,
		name: `test-concept-${Date.now()}`,
		description: null,
		emoji: '💡',
		color: '#f59e0b',
		isFavorite: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const values = { ...defaults, ...overrides };
	await db.insert(concepts).values(values);
	return { id, name: values.name as string };
};

// ============= Cleanup =============

afterEach(async () => {
	await db.delete(imageConcepts);
	await db.delete(videoConcepts);
	await db.delete(concepts);
});

// ============= CRUD TESTS =============

describe('ConceptService - CRUD Operations', () => {
	describe('create', () => {
		it('should create a concept successfully', async () => {
			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.create({ name: 'The Force' });
					})
				)
			);

			expect(result.name).toBe('The Force');
			expect(await favoriteService.isFavorite(FavoriteEntityType.CONCEPT, result.id)).toBe(false);
		});

		it('should create concept with optional fields', async () => {
			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.create({
							name: 'Quantum Entanglement',
							emoji: '⚛️',
							color: '#8b5cf6',
							description: 'Particles remain connected',
							category: 'physics',
						});
					})
				)
			);

			expect(result.name).toBe('Quantum Entanglement');
			expect(result.emoji).toBe('⚛️');
			expect(result.color).toBe('#8b5cf6');
			expect(result.description).toBe('Particles remain connected');
			expect(result.category).toBe('physics');
		});

		it('should fail with duplicate name', async () => {
			await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.create({ name: 'Time Travel' });
					})
				)
			);

			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.create({ name: 'Time Travel' });
					})
				)
			);

			expect(error._tag).toBe('ConceptNameConflict');
		});
	});

	describe('getById', () => {
		it('should retrieve a concept by ID', async () => {
			const { id, name } = await createTestConcept({ name: 'Gravity' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.getById(id);
					})
				)
			);

			expect(result.id).toBe(id);
			expect(result.name).toBe(name);
		});

		it('should fail when concept does not exist', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.getById('non-existent-id');
					})
				)
			);

			expect(error._tag).toBe('ConceptNotFound');
		});
	});

	describe('getAll', () => {
		it('should list all concepts', async () => {
			await createTestConcept({ name: 'Evolution' });
			await createTestConcept({ name: 'Relativity' });
			await createTestConcept({ name: 'Entropy' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.getAll();
					})
				)
			);

			expect(result.concepts.length).toBe(3);
			expect(result.total).toBe(3);
		});

		it('should paginate results', async () => {
			for (let i = 0; i < 5; i++) {
				await createTestConcept({ name: `Theory-${i}` });
			}

			const page1 = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.getAll({ limit: 2, offset: 0 });
					})
				)
			);
			expect(page1.concepts.length).toBe(2);
			expect(page1.total).toBe(5);

			const page3 = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.getAll({ limit: 2, offset: 4 });
					})
				)
			);
			expect(page3.concepts.length).toBe(1);
		});

		it('should search by name', async () => {
			await createTestConcept({ name: 'Quantum Theory' });
			await createTestConcept({ name: 'Quantum Field' });
			await createTestConcept({ name: 'Classical Mechanics' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.getAll({ search: 'Quantum' });
					})
				)
			);

			expect(result.concepts.length).toBe(2);
			expect(result.concepts.every((c: any) => c.name.includes('Quantum'))).toBe(true);
		});

		it('should filter by category', async () => {
			await createTestConcept({ name: 'Photosynthesis', category: 'biology' });
			await createTestConcept({ name: 'Nuclear Fusion', category: 'physics' });
			await createTestConcept({ name: 'Mitosis', category: 'biology' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.getAll({ category: 'biology' });
					})
				)
			);

			expect(result.concepts.length).toBe(2);
			expect(result.concepts.every((c: any) => c.category === 'biology')).toBe(true);
		});

		it('should sort by name ascending', async () => {
			await createTestConcept({ name: 'Zoology' });
			await createTestConcept({ name: 'Astronomy' });
			await createTestConcept({ name: 'Biology' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.getAll({ orderBy: 'name', orderDirection: 'asc' });
					})
				)
			);

			expect(result.concepts[0].name).toBe('Astronomy');
			expect(result.concepts[1].name).toBe('Biology');
			expect(result.concepts[2].name).toBe('Zoology');
		});

		it('should sort by name descending', async () => {
			await createTestConcept({ name: 'Zoology' });
			await createTestConcept({ name: 'Astronomy' });
			await createTestConcept({ name: 'Biology' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.getAll({ orderBy: 'name', orderDirection: 'desc' });
					})
				)
			);

			expect(result.concepts[0].name).toBe('Zoology');
			expect(result.concepts[1].name).toBe('Biology');
			expect(result.concepts[2].name).toBe('Astronomy');
		});
	});

	describe('update', () => {
		it('should update concept fields', async () => {
			const { id } = await createTestConcept({ name: 'Old Concept' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.update(id, {
							name: 'New Concept',
							description: 'Refined theory',
							emoji: '🧬',
						});
					})
				)
			);

			expect(result.name).toBe('New Concept');
			expect(result.description).toBe('Refined theory');
			expect(result.emoji).toBe('🧬');
		});

		it('should fail when updating non-existent concept', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.update('non-existent-id', { name: 'Test' });
					})
				)
			);

			expect(error._tag).toBe('ConceptNotFound');
		});
	});

	describe('delete', () => {
		it('should delete a concept', async () => {
			const { id } = await createTestConcept();

			await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.delete(id);
					})
				)
			);

			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.getById(id);
					})
				)
			);
			expect(error._tag).toBe('ConceptNotFound');
		});

		it('should fail when deleting non-existent concept', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* ConceptService;
						return yield* svc.delete('non-existent-id');
					})
				)
			);

			expect(error._tag).toBe('ConceptNotFound');
		});
	});
});
