/**
 * @file Tests para TagService con Effect
 * @module services/tag/__tests__/tag.service.effect.test
 */

import { Effect } from 'effect';
import { db } from '@/lib/drizzle';
import { groupTags, imageTags, tags, videoTags } from '@/lib/drizzle/schema';
import { expectError, expectSuccess, generateTestId } from '../../../../tests/factories/test-helpers';
import { TagService, runTagService } from '../tag.service.effect';

// ============= Helpers =============

const run = <A, E>(effect: Effect.Effect<A, E, TagService>) => runTagService(effect);

const createTestTag = async (overrides?: Record<string, unknown>) => {
	const id = generateTestId('tag');
	const defaults: Record<string, unknown> = {
		id,
		name: `test-tag-${Date.now()}`,
		description: null,
		emoji: '🏷️',
		color: '#22c55e',
		isFavorite: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const values = { ...defaults, ...overrides };
	await db.insert(tags).values(values);
	return { id, name: values.name as string };
};

// ============= Cleanup =============

afterEach(async () => {
	await db.delete(imageTags);
	await db.delete(videoTags);
	await db.delete(groupTags);
	await db.delete(tags);
});

// ============= CRUD TESTS =============

describe('TagService - CRUD Operations', () => {
	describe('create', () => {
		it('should create a tag successfully', async () => {
			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.create({ name: 'fantasy' } as any);
					})
				)
			);

			expect(result.name).toBe('fantasy');
			expect(result.isFavorite).toBe(false);
		});

		it('should create tag with optional fields', async () => {
			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.create({
							name: 'scifi',
							emoji: '🚀',
							color: '#3b82f6',
							description: 'Science fiction content',
							category: 'genre',
						} as any);
					})
				)
			);

			expect(result.name).toBe('scifi');
			expect(result.emoji).toBe('🚀');
			expect(result.color).toBe('#3b82f6');
			expect(result.description).toBe('Science fiction content');
			expect(result.category).toBe('genre');
		});

		it('should fail with duplicate name', async () => {
			await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.create({ name: 'drama' } as any);
					})
				)
			);

			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.create({ name: 'drama' } as any);
					})
				)
			);

			expect(error._tag).toBe('TagNameConflict');
		});
	});

	describe('getById', () => {
		it('should retrieve a tag by ID', async () => {
			const { id, name } = await createTestTag({ name: 'horror' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.getById(id);
					})
				)
			);

			expect(result.id).toBe(id);
			expect(result.name).toBe(name);
		});

		it('should fail when tag does not exist', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.getById('non-existent-id');
					})
				)
			);

			expect(error._tag).toBe('TagNotFound');
		});
	});

	describe('getAll', () => {
		it('should list all tags', async () => {
			await createTestTag({ name: 'action' });
			await createTestTag({ name: 'comedy' });
			await createTestTag({ name: 'thriller' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.getAll();
					})
				)
			);

			expect(result.tags.length).toBe(3);
			expect(result.total).toBe(3);
		});

		it('should paginate results', async () => {
			for (let i = 0; i < 5; i++) {
				await createTestTag({ name: `style-${i}` });
			}

			const page1 = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.getAll({ limit: 2, offset: 0 });
					})
				)
			);
			expect(page1.tags.length).toBe(2);
			expect(page1.total).toBe(5);

			const page3 = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.getAll({ limit: 2, offset: 4 });
					})
				)
			);
			expect(page3.tags.length).toBe(1);
		});

		it('should search by name', async () => {
			await createTestTag({ name: 'medieval' });
			await createTestTag({ name: 'medical' });
			await createTestTag({ name: 'ancient' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.getAll({ search: 'med' });
					})
				)
			);

			expect(result.tags.length).toBe(2);
			expect(result.tags.every((t: any) => t.name.includes('med'))).toBe(true);
		});

		it('should filter by category', async () => {
			await createTestTag({ name: 'red', category: 'color' });
			await createTestTag({ name: 'blue', category: 'color' });
			await createTestTag({ name: 'wood', category: 'material' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.getAll({ category: 'color' });
					})
				)
			);

			expect(result.tags.length).toBe(2);
			expect(result.tags.every((t: any) => t.category === 'color')).toBe(true);
		});

		it('should sort by name ascending', async () => {
			await createTestTag({ name: 'Zen' });
			await createTestTag({ name: 'Alpha' });
			await createTestTag({ name: 'Beta' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.getAll({ orderBy: 'name', orderDirection: 'asc' });
					})
				)
			);

			expect(result.tags[0].name).toBe('Alpha');
			expect(result.tags[1].name).toBe('Beta');
			expect(result.tags[2].name).toBe('Zen');
		});

		it('should sort by name descending', async () => {
			await createTestTag({ name: 'Zen' });
			await createTestTag({ name: 'Alpha' });
			await createTestTag({ name: 'Beta' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.getAll({ orderBy: 'name', orderDirection: 'desc' });
					})
				)
			);

			expect(result.tags[0].name).toBe('Zen');
			expect(result.tags[1].name).toBe('Beta');
			expect(result.tags[2].name).toBe('Alpha');
		});
	});

	describe('update', () => {
		it('should update tag fields', async () => {
			const { id } = await createTestTag({ name: 'oldtag' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.update({
							id,
							name: 'newtag',
							description: 'Updated description',
							emoji: '🎯',
						});
					})
				)
			);

			expect(result.name).toBe('newtag');
			expect(result.description).toBe('Updated description');
			expect(result.emoji).toBe('🎯');
		});

		it('should fail when updating non-existent tag', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.update({ id: 'non-existent-id', name: 'Test' });
					})
				)
			);

			expect(error._tag).toBe('TagNotFound');
		});
	});

	describe('delete', () => {
		it('should delete a tag', async () => {
			const { id } = await createTestTag();

			await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.delete(id);
					})
				)
			);

			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.getById(id);
					})
				)
			);
			expect(error._tag).toBe('TagNotFound');
		});

		it('should fail when deleting non-existent tag', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* TagService;
						return yield* svc.delete('non-existent-id');
					})
				)
			);

			expect(error._tag).toBe('TagNotFound');
		});
	});
});
