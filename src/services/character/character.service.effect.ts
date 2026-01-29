/**
 * @file CharacterService implementado con Effect
 * @module services/character/character.service.effect
 * @description Servicio Character con operaciones CRUD y relaciones usando Effect-TS
 * @created 2025-10-11 - Fase 8.1 CharacterService Effect Implementation
 */

import { Schema } from '@effect/schema';
import { and, asc, count, desc, eq, isNull, like, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { generateReadableId } from '@/lib/utils/id-generator';
import { characters, imageCharacters, imageNotes } from '@/lib/drizzle/schema';
import {
	Character,
	CharacterCreateInput,
	CharacterUpdateInput,
	CharacterWithStats,
} from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	CharacterDatabaseError,
	type CharacterError,
	CharacterHasRelationsError,
	CharacterNameConflict,
	CharacterNotFound,
	fromUnknownError,
} from './character-errors.effect';

// Logger específico
const logger = serverLogger.withContext('CharacterService.Effect');

// ============= Types =============

/**
 * Opciones para obtener characters
 */
export interface GetCharactersOptions {
	search?: string;
	parentId?: string | null;
	category?: string;
	onlyFavorites?: boolean;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

/**
 * Resultado de obtener characters con paginación
 */
export interface GetCharactersResult {
	characters: CharacterWithStats[];
	total: number;
	limit: number;
	offset: number;
}

/**
 * Contadores de relaciones de un character
 */
export interface CharacterCounts {
	images: number;
	videos: number;
	notes: number;
	tags: number;
	groups: number;
	properties: number;
	places: number;
	worldItems: number;
	concepts: number;
	prompts: number;
	collections: number;
	albums: number;
	wildcards: number;
}

/**
 * Estadísticas calculadas de un character
 */
export interface CharacterStatistics {
	totalImages: number;
	totalVideos: number;
	totalNotes: number;
	totalRelations: number;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	completenessScore: number;
	lastUpdated: Date;
}

/**
 * Interface para el servicio CharacterService
 */
export interface CharacterServiceInterface {
	// CRUD Básico
	readonly getById: (id: string) => Effect.Effect<Character, CharacterError>;
	readonly getAll: (options?: GetCharactersOptions) => Effect.Effect<GetCharactersResult, CharacterError>;
	readonly create: (input: CharacterCreateInput) => Effect.Effect<CharacterWithStats, CharacterError>;
	readonly update: (id: string, input: CharacterUpdateInput) => Effect.Effect<CharacterWithStats, CharacterError>;
	readonly delete: (id: string) => Effect.Effect<void, CharacterError>;
	readonly bulkDelete: (ids: string[]) => Effect.Effect<{ deleted: number; failed: string[] }, CharacterError>;

	// UI Operations
	readonly toggleFavorite: (id: string) => Effect.Effect<Character, CharacterError>;

	// Stats Operations
	readonly getRelationsCounts: (id: string) => Effect.Effect<CharacterCounts, CharacterError>;

	// Relation Operations
	readonly addImage: (characterId: string, imageId: string) => Effect.Effect<void, CharacterError>;
	readonly removeImage: (characterId: string, imageId: string) => Effect.Effect<void, CharacterError>;
	readonly addNote: (characterId: string, noteId: string) => Effect.Effect<void, CharacterError>;
	readonly removeNote: (characterId: string, noteId: string) => Effect.Effect<void, CharacterError>;
}

/**
 * Context.Tag para CharacterService
 */
export class CharacterService extends Context.Tag('CharacterService')<CharacterService, CharacterServiceInterface>() {}

/**
 * Calcula estadísticas para un Character
 */
const calculateCharacterStatistics = (character: Character, counts: CharacterCounts): CharacterStatistics => {
	const totalRelations =
		counts.images +
		counts.videos +
		counts.notes +
		counts.tags +
		counts.groups +
		counts.properties +
		counts.places +
		counts.worldItems +
		counts.concepts +
		counts.prompts +
		counts.collections +
		counts.albums +
		counts.wildcards;

	// Completeness: qué tan completo está el perfil del character
	let completenessScore = 0;
	if (character.name) completenessScore += 20;
	if (character.description) completenessScore += 15;
	if (character.color) completenessScore += 10;
	if (character.emoji) completenessScore += 10;
	if (character.category) completenessScore += 10;
	if (character.featuredImage) completenessScore += 10;
	if (character.metadata) completenessScore += 15;

	return {
		totalImages: counts.images,
		totalVideos: counts.videos,
		totalNotes: counts.notes,
		totalRelations,
		lastImageAddedAt: null,
		lastVideoAddedAt: null,
		completenessScore,
		lastUpdated: new Date(),
	};
};

/**
 * Implementación del servicio CharacterService
 */
const make = (): CharacterServiceInterface => {
	/**
	 * Obtiene un character por su ID
	 */
	const getById = (id: string): Effect.Effect<Character, CharacterError> =>
		Effect.gen(function* () {
			logger.info(`🔍 Buscando character: ${id}`);

			const result = yield* Effect.tryPromise({
				try: async () => await db.select().from(characters).where(eq(characters.id, id)).limit(1),
				catch: (error: unknown) => {
					logger.error(`❌ Error al obtener character ${id}`, { error });
					return fromUnknownError('getById', error);
				},
			});

			if (result.length === 0) {
				logger.warn(`Character no encontrado: ${id}`);
				return yield* Effect.fail(new CharacterNotFound({ characterId: id }));
			}

			// Validar con Schema
			const validated = yield* Schema.decodeUnknown(Character)(result[0]).pipe(
				Effect.mapError((error) => fromUnknownError('decode', error))
			);
			return validated as Character;
		});

	/**
	 * Obtiene conteos de relaciones para un character
	 */
	const getRelationsCounts = (id: string): Effect.Effect<CharacterCounts, CharacterError> =>
		Effect.gen(function* () {
			const [imageCount, noteCount] = yield* Effect.all([
				Effect.tryPromise({
					try: () => db.select({ count: count() }).from(imageCharacters).where(eq(imageCharacters.B, id)),
					catch: (error) => fromUnknownError('getImagesCount', error),
				}),
				Effect.tryPromise({
					try: () => db.select({ count: count() }).from(imageNotes).where(eq(imageNotes.B, id)),
					catch: (error) => fromUnknownError('getNotesCount', error),
				}),
			]);

			return {
				images: imageCount[0]?.count ?? 0,
				videos: 0,
				notes: noteCount[0]?.count ?? 0,
				tags: 0,
				groups: 0,
				properties: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				collections: 0,
				albums: 0,
				wildcards: 0,
			};
		});

	/**
	 * Obtiene todos los characters con opciones de filtrado y paginación
	 */
	const getAll = (options: GetCharactersOptions = {}): Effect.Effect<GetCharactersResult, CharacterError> =>
		Effect.gen(function* () {
			const {
				search,
				limit = 50,
				offset = 0,
				orderBy = 'createdAt',
				orderDirection = 'desc',
				category,
				parentId,
				onlyFavorites,
			} = options;

			// Construir condiciones WHERE
			const conditions = [];
			if (search) {
				conditions.push(like(characters.name, `%${search}%`));
			}
			if (category) {
				conditions.push(eq(characters.category, category));
			}
			if (parentId !== undefined) {
				conditions.push(parentId === null ? isNull(characters.parentId) : eq(characters.parentId, parentId));
			}
			if (onlyFavorites) {
				conditions.push(eq(characters.isFavorite, true));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			// Determinar ordenamiento
			const orderByColumn = (characters as any)[orderBy] || characters.createdAt;
			const orderByClause = orderDirection === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

			// Ejecutar queries
			const [charactersData, totalResult] = yield* Effect.all([
				Effect.tryPromise({
					try: async () =>
						await db.select().from(characters).where(whereClause).orderBy(orderByClause).limit(limit).offset(offset),
					catch: (error) => fromUnknownError('getAll', error),
				}),
				Effect.tryPromise({
					try: async () => await db.select({ count: count() }).from(characters).where(whereClause),
					catch: (error) => fromUnknownError('getCount', error),
				}),
			]);

			const total = totalResult[0]?.count ?? 0;

			return {
				characters: charactersData as CharacterWithStats[],
				total,
				limit,
				offset,
			};
		});

	/**
	 * Crea un nuevo character
	 */
	const create = (input: CharacterCreateInput): Effect.Effect<CharacterWithStats, CharacterError> =>
		Effect.gen(function* () {
			// Validar duplicado
			const existing = yield* Effect.tryPromise({
				try: async () =>
					await db.select({ id: characters.id }).from(characters).where(eq(characters.name, input.name)).limit(1),
				catch: (error) => fromUnknownError('checkDuplicate', error),
			});

			if (existing.length > 0) {
				return yield* Effect.fail(new CharacterNameConflict({ name: input.name }));
			}

			const readableId = generateReadableId('character', input.name, 1);

			const result = yield* Effect.tryPromise({
				try: async () =>
					await db
						.insert(characters)
						.values({
							id: readableId,
							name: input.name,
							description: input.description ?? null,
							emoji: input.emoji ?? null,
							color: input.color ?? null,
							category: input.category ?? null,
							featuredImage: input.featuredImage ?? null,
							filters: input.filters ?? null,
							isFavorite: input.isFavorite ?? false,
							metadata: input.metadata ?? null,
							parentId: (input as any).parentId ?? null,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				catch: (error) => fromUnknownError('create', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(
					new CharacterDatabaseError({
						operation: 'create',
						message: 'No row returned from insert',
					})
				);
			}

			const character = result[0];
			const stats = calculateCharacterStatistics(character as any, {
				images: 0,
				videos: 0,
				notes: 0,
				tags: 0,
				groups: 0,
				properties: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				collections: 0,
				albums: 0,
				wildcards: 0,
			});

			return {
				...(character as any),
				stats,
			};
		});

	/**
	 * Actualiza un character existente
	 */
	const update = (id: string, input: CharacterUpdateInput): Effect.Effect<CharacterWithStats, CharacterError> =>
		Effect.gen(function* () {
			yield* getById(id);

			if (input.name !== undefined) {
				const existing = yield* Effect.tryPromise({
					try: async () =>
						await db
							.select({ id: characters.id })
							.from(characters)
							.where(and(eq(characters.name, input.name!), sql`${characters.id} != ${id}`))
							.limit(1),
					catch: (error) => fromUnknownError('checkDuplicate', error),
				});

				if (existing.length > 0) {
					return yield* Effect.fail(new CharacterNameConflict({ name: input.name! }));
				}
			}

			const result = yield* Effect.tryPromise({
				try: async () =>
					await db
						.update(characters)
						.set({
							...(input.name !== undefined && { name: input.name }),
							...(input.description !== undefined && { description: input.description }),
							...(input.emoji !== undefined && { emoji: input.emoji }),
							...(input.color !== undefined && { color: input.color }),
							...(input.category !== undefined && { category: input.category }),
							...(input.featuredImage !== undefined && { featuredImage: input.featuredImage }),
							...(input.filters !== undefined && { filters: input.filters }),
							...(input.isFavorite !== undefined && { isFavorite: input.isFavorite }),
							...(input.metadata !== undefined && { metadata: input.metadata }),
							...((input as any).parentId !== undefined && { parentId: (input as any).parentId }),
							updatedAt: new Date(),
						})
						.where(eq(characters.id, id))
						.returning(),
				catch: (error) => fromUnknownError('update', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new CharacterDatabaseError({ operation: 'update', message: 'No row returned' }));
			}

			const counts = yield* getRelationsCounts(id);
			return {
				...(result[0] as any),
				stats: calculateCharacterStatistics(result[0] as any, counts),
			};
		});

	/**
	 * Elimina un character
	 */
	const delete_ = (id: string): Effect.Effect<void, CharacterError> =>
		Effect.gen(function* () {
			const counts = yield* getRelationsCounts(id);
			const totalRelations = counts.images + counts.notes;

			if (totalRelations > 0) {
				return yield* Effect.fail(
					new CharacterHasRelationsError({
						characterId: id,
						relationCount: totalRelations,
						relations: counts.images > 0 ? ['images'] : ['notes'],
					})
				);
			}

			const result = yield* Effect.tryPromise({
				try: async () => await db.delete(characters).where(eq(characters.id, id)).returning(),
				catch: (error) => fromUnknownError('delete', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(new CharacterNotFound({ characterId: id }));
			}
		});

	/**
	 * Bulk delete
	 */
	const bulkDelete = (ids: string[]): Effect.Effect<{ deleted: number; failed: string[] }, CharacterError> =>
		Effect.gen(function* () {
			let deleted = 0;
			const failed: string[] = [];

			for (const id of ids) {
				const result = yield* Effect.either(delete_(id));
				if (result._tag === 'Right') {
					deleted++;
				} else {
					failed.push(id);
				}
			}

			return { deleted, failed };
		});

	/**
	 * Toggle favorite
	 */
	const toggleFavorite = (id: string): Effect.Effect<Character, CharacterError> =>
		Effect.gen(function* () {
			const character = yield* getById(id);
			const result = yield* Effect.tryPromise({
				try: async () =>
					await db
						.update(characters)
						.set({ isFavorite: !character.isFavorite, updatedAt: new Date() })
						.where(eq(characters.id, id))
						.returning(),
				catch: (error) => fromUnknownError('toggleFavorite', error),
			});

			if (result.length === 0) {
				return yield* Effect.fail(
					new CharacterDatabaseError({ operation: 'toggleFavorite', message: 'No row returned' })
				);
			}
			return result[0] as any;
		});

	/**
	 * Relation operations
	 */
	const addImage = (characterId: string, imageId: string): Effect.Effect<void, CharacterError> =>
		Effect.gen(function* () {
			yield* getById(characterId);
			yield* Effect.tryPromise({
				try: () => db.insert(imageCharacters).values({ A: imageId, B: characterId }),
				catch: (error) => fromUnknownError('addImage', error),
			});
		});

	const removeImage = (characterId: string, imageId: string): Effect.Effect<void, CharacterError> =>
		Effect.tryPromise({
			try: () =>
				db.delete(imageCharacters).where(and(eq(imageCharacters.A, imageId), eq(imageCharacters.B, characterId))),
			catch: (error) => fromUnknownError('removeImage', error),
		});

	const addNote = (characterId: string, noteId: string): Effect.Effect<void, CharacterError> =>
		Effect.gen(function* () {
			yield* getById(characterId);
			yield* Effect.tryPromise({
				try: () => db.insert(imageNotes).values({ A: noteId, B: characterId }),
				catch: (error) => fromUnknownError('addNote', error),
			});
		});

	const removeNote = (characterId: string, noteId: string): Effect.Effect<void, CharacterError> =>
		Effect.tryPromise({
			try: () => db.delete(imageNotes).where(and(eq(imageNotes.A, noteId), eq(imageNotes.B, characterId))),
			catch: (error) => fromUnknownError('removeNote', error),
		});

	return {
		getById,
		getAll,
		create,
		update,
		delete: delete_,
		bulkDelete,
		toggleFavorite,
		getRelationsCounts,
		addImage,
		removeImage,
		addNote,
		removeNote,
	};
};

export const CharacterServiceLive = Layer.effect(CharacterService, Effect.succeed(make()));
