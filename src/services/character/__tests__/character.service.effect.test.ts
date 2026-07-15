/**
 * @file Tests para CharacterService con Effect
 * @module services/character/__tests__/character.service.effect.test
 */

import { Effect, pipe } from 'effect';
import { db } from '@/lib/drizzle';
import { characters, imageCharacters, imageNotes } from '@/lib/drizzle/schema';
import { expectError, expectSuccess, generateTestId } from '../../../../tests/factories/test-helpers';
import { CharacterService, CharacterServiceLive } from '../character.service.effect';

// ============= Helpers =============

const run = <A, E>(effect: Effect.Effect<A, E, CharacterService>) => pipe(effect, Effect.provide(CharacterServiceLive));

const createTestCharacter = async (overrides?: Record<string, unknown>) => {
	const id = generateTestId('char');
	const defaults: Record<string, unknown> = {
		id,
		name: `test-character-${Date.now()}`,
		description: null,
		emoji: '👤',
		color: '#ec4899',
		isFavorite: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const values = { ...defaults, ...overrides };
	await db.insert(characters).values(values);
	return { id, name: values.name as string };
};

// ============= Cleanup =============

afterEach(async () => {
	await db.delete(imageCharacters);
	await db.delete(imageNotes);
	await db.delete(characters);
});

// ============= CRUD TESTS =============

describe('CharacterService - CRUD Operations', () => {
	describe('create', () => {
		it('should create a character successfully', async () => {
			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.create({ name: 'Aragorn' });
					})
				)
			);

			expect(result.name).toBe('Aragorn');
			expect(result.emoji).toBeNull();
			expect(result.color).toBeNull();
			expect(result.isFavorite).toBe(false);
		});

		it('should create character with optional fields', async () => {
			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.create({
							name: 'Gandalf',
							emoji: '🧙',
							color: '#6366f1',
							description: 'A wise wizard',
							category: 'wizard',
						});
					})
				)
			);

			expect(result.name).toBe('Gandalf');
			expect(result.emoji).toBe('🧙');
			expect(result.color).toBe('#6366f1');
			expect(result.description).toBe('A wise wizard');
			expect(result.category).toBe('wizard');
		});

		it('should fail with duplicate name', async () => {
			await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.create({ name: 'Legolas' });
					})
				)
			);

			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.create({ name: 'Legolas' });
					})
				)
			);

			expect(error._tag).toBe('CharacterNameConflict');
		});
	});

	describe('getById', () => {
		it('should retrieve a character by ID', async () => {
			const { id, name } = await createTestCharacter({ name: 'Frodo Baggins' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getById(id);
					})
				)
			);

			expect(result.id).toBe(id);
			expect(result.name).toBe(name);
		});

		it('should fail when character does not exist', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getById('non-existent-id');
					})
				)
			);

			expect(error._tag).toBe('CharacterNotFound');
		});
	});

	describe('getAll', () => {
		it('should list all characters', async () => {
			await createTestCharacter({ name: 'Gimli' });
			await createTestCharacter({ name: 'Boromir' });
			await createTestCharacter({ name: 'Merry' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getAll();
					})
				)
			);

			expect(result.characters.length).toBe(3);
			expect(result.total).toBe(3);
		});

		it('should paginate results', async () => {
			for (let i = 0; i < 5; i++) {
				await createTestCharacter({ name: `Soldier-${i}` });
			}

			const page1 = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getAll({ limit: 2, offset: 0 });
					})
				)
			);
			expect(page1.characters.length).toBe(2);
			expect(page1.total).toBe(5);

			const page2 = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getAll({ limit: 2, offset: 2 });
					})
				)
			);
			expect(page2.characters.length).toBe(2);

			const page3 = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getAll({ limit: 2, offset: 4 });
					})
				)
			);
			expect(page3.characters.length).toBe(1);
		});

		it('should search by name', async () => {
			await createTestCharacter({ name: 'Sauron The Dark' });
			await createTestCharacter({ name: 'Saruman The White' });
			await createTestCharacter({ name: 'Galadriel' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getAll({ search: 'The' });
					})
				)
			);

			expect(result.characters.length).toBe(2);
			expect(result.characters.every((c: any) => c.name.includes('The'))).toBe(true);
		});

		it('should filter by category', async () => {
			await createTestCharacter({ name: 'Elrond', category: 'elf' });
			await createTestCharacter({ name: 'Thorin', category: 'dwarf' });
			await createTestCharacter({ name: 'Celeborn', category: 'elf' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getAll({ category: 'elf' });
					})
				)
			);

			expect(result.characters.length).toBe(2);
			expect(result.characters.every((c: any) => c.category === 'elf')).toBe(true);
		});

		it('should sort by name ascending', async () => {
			await createTestCharacter({ name: 'Zog' });
			await createTestCharacter({ name: 'Arag' });
			await createTestCharacter({ name: 'Mira' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getAll({ orderBy: 'name', orderDirection: 'asc' });
					})
				)
			);

			expect(result.characters[0].name).toBe('Arag');
			expect(result.characters[1].name).toBe('Mira');
			expect(result.characters[2].name).toBe('Zog');
		});

		it('should sort by name descending', async () => {
			await createTestCharacter({ name: 'Zog' });
			await createTestCharacter({ name: 'Arag' });
			await createTestCharacter({ name: 'Mira' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getAll({ orderBy: 'name', orderDirection: 'desc' });
					})
				)
			);

			expect(result.characters[0].name).toBe('Zog');
			expect(result.characters[1].name).toBe('Mira');
			expect(result.characters[2].name).toBe('Arag');
		});
	});

	describe('update', () => {
		it('should update character fields', async () => {
			const { id } = await createTestCharacter({ name: 'Old Name' });

			const result = await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.update(id, {
							name: 'New Name',
							description: 'Updated description',
							emoji: '🦸',
						});
					})
				)
			);

			expect(result.name).toBe('New Name');
			expect(result.description).toBe('Updated description');
			expect(result.emoji).toBe('🦸');
		});

		it('should fail when updating non-existent character', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.update('non-existent-id', { name: 'Test' });
					})
				)
			);

			expect(error._tag).toBe('CharacterNotFound');
		});
	});

	describe('delete', () => {
		it('should delete a character', async () => {
			const { id } = await createTestCharacter();

			await expectSuccess(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.delete(id);
					})
				)
			);

			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.getById(id);
					})
				)
			);
			expect(error._tag).toBe('CharacterNotFound');
		});

		it('should fail when deleting non-existent character', async () => {
			const error = await expectError(
				run(
					Effect.gen(function* () {
						const svc = yield* CharacterService;
						return yield* svc.delete('non-existent-id');
					})
				)
			);

			expect(error._tag).toBe('CharacterNotFound');
		});
	});
});
