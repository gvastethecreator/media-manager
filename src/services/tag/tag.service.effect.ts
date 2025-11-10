/**
 * @file TagService implementado con Effect
 * @module services/tag/tag.service.effect
 * @description Servicio Tag con manejo funcional de errores usando Effect-TS
 * @created 2025-10-11 - Fase 1 Effect Implementation
 */

import { Effect, Context, Layer, pipe } from 'effect';
import { Schema } from '@effect/schema';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import * as crypto from 'crypto';
import { db } from '@/lib/drizzle';
import { images, imageTags, tags } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	Tag,
	TagCreate,
	TagUpdate,
	TagWithStats,
	GetTagsOptions,
	GetTagsResult,
	TagStatistics,
	TagCounts,
} from './tag-schemas';
import {
	TagError,
	TagNotFound,
	TagNameConflict,
	TagDatabaseError,
	TagValidationError,
	TagHasRelationsError,
	fromUnknownError,
} from './tag-errors.effect';

// Logger específico
const logger = serverLogger.withContext('TagService.Effect');

/**
 * Interface para el servicio TagService
 */
export interface TagServiceInterface {
	readonly getById: (id: string) => Effect.Effect<Tag, TagError>;
	readonly getByIdWithStats: (id: string) => Effect.Effect<TagWithStats, TagError>;
	readonly getAll: (options?: GetTagsOptions) => Effect.Effect<GetTagsResult, TagError>;
	readonly create: (input: TagCreate) => Effect.Effect<TagWithStats, TagError>;
	readonly update: (input: TagUpdate) => Effect.Effect<TagWithStats, TagError>;
	readonly delete: (id: string) => Effect.Effect<void, TagError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<Tag, TagError>;
	readonly getImageCount: (id: string) => Effect.Effect<number, TagError>;
	readonly getRelationsCounts: (id: string) => Effect.Effect<TagCounts, TagError>;
}

/**
 * Context.Tag para TagService
 */
export class TagService extends Context.Tag('TagService')<TagService, TagServiceInterface>() {}

/**
 * Calcula estadísticas para un Tag
 */
const calculateTagStatistics = (tag: Tag, counts: TagCounts): TagStatistics => {
	const totalRelations =
		counts.images +
		counts.videos +
		counts.albums +
		counts.collections +
		counts.characters +
		counts.places +
		counts.worldItems +
		counts.concepts +
		counts.prompts +
		counts.notes +
		counts.wildcards +
		counts.properties +
		counts.groups;

	// Usage diversity: cuántos tipos de entidades diferentes usan este tag
	const usedEntityTypes = [
		counts.images > 0,
		counts.videos > 0,
		counts.albums > 0,
		counts.collections > 0,
		counts.characters > 0,
		counts.places > 0,
		counts.worldItems > 0,
		counts.concepts > 0,
		counts.prompts > 0,
		counts.notes > 0,
		counts.wildcards > 0,
		counts.properties > 0,
		counts.groups > 0,
	].filter(Boolean).length;

	const usageDiversity = usedEntityTypes / 13; // 13 tipos posibles

	// Popularity basada en totalRelations
	const popularity = Math.min(totalRelations * 10, 1000);

	// Completeness: qué tan completo está el perfil del tag
	let completenessScore = 0;
	if (tag.name) completenessScore += 30;
	if (tag.description) completenessScore += 20;
	if (tag.color) completenessScore += 15;
	if (tag.emoji) completenessScore += 15;
	if (tag.category) completenessScore += 10;
	if (tag.featuredImage) completenessScore += 10;

	return {
		totalRelations,
		usageDiversity,
		popularity,
		completenessScore,
		totalViews: 0,
		lastAccessedAt: null,
	};
};

/**
 * Implementación del servicio TagService
 */
const make = (): TagServiceInterface => {
	/**
	 * Obtiene un tag por su ID
	 */
	const getById = (id: string): Effect.Effect<Tag, TagError> =>
		Effect.gen(function* () {
			logger.info(`🔍 Buscando tag: ${id}`);

			// Query usando db directamente (importado de drizzle/index)
			const result = yield* Effect.tryPromise<typeof tags.$inferSelect[], TagError>({
				try: () => db.select().from(tags).where(eq(tags.id, id)).limit(1),
				catch: (error: unknown) => {
					logger.error(`❌ Error al obtener tag ${id}`, { error });
					return fromUnknownError('getById', error);
				},
			});

			if (result.length === 0) {
				logger.warn(`Tag no encontrado: ${id}`);
				return yield* Effect.fail(new TagNotFound({ tagId: id }));
			}

			logger.info(`✅ Tag encontrado: ${result[0].name}`);

			// Validar con Schema
			const validated = yield* Effect.try({
				try: () => Schema.decodeUnknownSync(Tag)(result[0]),
				catch: (error) =>
					new TagValidationError({
						field: 'tag',
						message: 'Error al validar tag desde BD',
						value: result[0],
					}),
			});

			return validated;
		});

	/**
	 * Obtiene conteos de relaciones para un tag
	 */
	const getRelationsCounts = (id: string): Effect.Effect<TagCounts, TagError> =>
		Effect.gen(function* () {
			logger.info(`📊 Obteniendo conteos para tag: ${id}`);

			// Por ahora solo contamos images (otros se pueden agregar después)
			const imageCountResult = yield* Effect.tryPromise<Array<{ count: number }>, TagError>({
				try: () => db.select({ count: count() }).from(imageTags).where(eq(imageTags.B, id)),
				catch: (error: unknown) => fromUnknownError('getRelationsCounts', error),
			});

			const imageCount = imageCountResult[0]?.count ?? 0;

			// TODO: agregar conteos reales para otros tipos de entidades
			const counts: TagCounts = {
				images: imageCount,
				videos: 0,
				documents: 0,
				file3Ds: 0,
				jsonFiles: 0,
				audios: 0,
				albums: 0,
				collections: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			};

			logger.info(`✅ Conteos obtenidos: ${imageCount} imágenes`);
			return counts;
		});

	/**
	 * Obtiene un tag con estadísticas completas
	 */
	const getByIdWithStats = (id: string): Effect.Effect<TagWithStats, TagError> =>
		Effect.gen(function* () {
			const tag = yield* getById(id);
			const counts = yield* getRelationsCounts(id);
			const stats = calculateTagStatistics(tag, counts);

			const tagWithStats: TagWithStats = {
				...tag,
				shortcut: tag.shortcut ?? null, // Normalize undefined to null
				entityType: 'tag' as const,
				stats,
				_count: counts,
				statistics: stats,
			};

			return tagWithStats;
		});

	/**
	 * Obtiene el conteo de imágenes para un tag (helper)
	 */
	const getImageCount = (id: string): Effect.Effect<number, TagError> =>
		pipe(
			getRelationsCounts(id),
			Effect.map((counts) => counts.images)
		);

	/**
	 * Obtiene todos los tags con filtros y estadísticas
	 */
	const getAll = (options: GetTagsOptions = {}): Effect.Effect<GetTagsResult, TagError> =>
		Effect.gen(function* () {
			const {
				search,
				onlyFavorites = false,
				category,
				orderBy = 'name',
				orderDirection = 'asc',
				limit = 50,
				offset = 0,
				includeArchived = true,
			} = options;

			logger.info('🏷️ Obteniendo tags', { options });

			// Construir condiciones de filtrado
			const conditions: any[] = [];

			if (onlyFavorites) {
				conditions.push(eq(tags.isFavorite, true));
			}

			if (category) {
				conditions.push(eq(tags.category, category));
			}

			if (search) {
				conditions.push(or(like(tags.name, `%${search}%`), like(tags.description, `%${search}%`)));
			}

			// Determinar ordenamiento
			const orderFn = orderDirection === 'desc' ? desc : asc;
			let orderField: any;

			switch (orderBy) {
				case 'createdAt':
					orderField = orderFn(tags.createdAt);
					break;
				case 'updatedAt':
					orderField = orderFn(tags.updatedAt);
					break;
				case 'popularity':
					// TODO: ordenar por popularidad requiere join con counts
					orderField = orderFn(tags.name);
					break;
				default:
					orderField = orderFn(tags.name);
			}

			// Query principal
			const rawTags = yield* Effect.tryPromise<Array<typeof tags.$inferSelect>, TagError>({
				try: () => {
					let query = db.select().from(tags);
					
					// Aplicar filtros
					if (conditions.length > 0) {
						query = query.where(and(...conditions));
					}
					
					// Aplicar ordenamiento, limit y offset
					return query.orderBy(orderField).limit(limit).offset(offset);
				},
				catch: (error: unknown) => {
					logger.error('❌ Error al obtener tags', { error, options });
					return fromUnknownError('getAll', error);
				},
			});

			// Obtener conteo total (sin limit/offset)
			const totalCount = yield* Effect.tryPromise({
				try: async () => {
					let query = db.select({ count: count() }).from(tags);
					if (conditions.length > 0) {
						query = query.where(and(...conditions));
					}
					const countResult = await query;
					return countResult[0]?.count ?? 0;
				},
				catch: (error) => fromUnknownError('getAll.count', error),
			});

			// Enriquecer cada tag con stats
			const tagsWithStats: TagWithStats[] = [];
			for (const rawTag of rawTags) {
				const tag = Schema.decodeUnknownSync(Tag)(rawTag);
				const counts = yield* getRelationsCounts(tag.id);
				const stats = calculateTagStatistics(tag, counts);

				tagsWithStats.push({
					...tag,
					shortcut: tag.shortcut ?? null, // Normalize undefined to null
					entityType: 'tag' as const,
					stats,
					_count: counts,
					statistics: stats,
				});
			}

			logger.info(`✅ ${tagsWithStats.length} tags obtenidos de ${totalCount} totales`);

			return {
				tags: tagsWithStats,
				total: totalCount,
				limit,
				offset,
				hasMore: offset + limit < totalCount,
			};
		});

	/**
	 * Crea un nuevo tag
	 */
	const create = (input: TagCreate): Effect.Effect<TagWithStats, TagError> =>
		Effect.gen(function* () {
			logger.info('📝 Creando nuevo tag', { name: input.name });

			// Validar input con Schema
			const validated = yield* Effect.try({
				try: () => Schema.decodeUnknownSync(TagCreate)(input),
				catch: (error) =>
					new TagValidationError({
						field: 'input',
						message: 'Input de creación inválido',
						value: input,
					}),
			});

			// Verificar conflicto de nombre
			const existingTags = yield* Effect.tryPromise<Array<typeof tags.$inferSelect>, TagError>({
				try: () => db.select().from(tags).where(eq(tags.name, validated.name)).limit(1),
				catch: (error: unknown) => fromUnknownError('create.checkConflict', error),
			});

			if (existingTags.length > 0) {
				logger.warn(`Conflicto de nombre: ${validated.name}`);
				return yield* Effect.fail(new TagNameConflict({ name: validated.name, existingTagId: existingTags[0].id }));
			}

			// Insertar nuevo tag
			const newTag = yield* Effect.tryPromise({
				try: async () => {
					const now = new Date();
					const id = crypto.randomUUID();

					const result = await db
						.insert(tags)
						.values({
							id,
							name: validated.name,
							description: validated.description ?? null,
							color: validated.color ?? '#3b82f6',
							emoji: validated.emoji ?? '🏷️',
							category: validated.category ?? null,
							shortcut: validated.shortcut ?? null,
							featuredImage: validated.featuredImage ?? null,
							isFavorite: validated.isFavorite ?? false,
							createdAt: now,
							updatedAt: now,
						})
						.returning();

					return result[0];
				},
				catch: (error) => {
					logger.error('❌ Error al crear tag', { error, input: validated });
					return fromUnknownError('create.insert', error);
				},
			});

			logger.info(`✅ Tag creado exitosamente: ${newTag.name}`, { id: newTag.id });

			// Retornar con stats
			return yield* getByIdWithStats(newTag.id);
		});

	/**
	 * Actualiza un tag existente
	 */
	const update = (input: TagUpdate): Effect.Effect<TagWithStats, TagError> =>
		Effect.gen(function* () {
			logger.info(`🔄 Actualizando tag: ${input.id}`);

			// Validar input
			const validated = yield* Effect.try({
				try: () => Schema.decodeUnknownSync(TagUpdate)(input),
				catch: (error) =>
					new TagValidationError({
						field: 'input',
						message: 'Input de actualización inválido',
						value: input,
					}),
			});

			// Verificar que el tag existe
			yield* getById(validated.id);

			// Si se cambia el nombre, verificar conflictos
			if (validated.name) {
				const existing = yield* Effect.tryPromise<Array<typeof tags.$inferSelect>, TagError>({
					try: () => db.select().from(tags).where(eq(tags.name, validated.name!)).limit(1),
					catch: (error: unknown) => fromUnknownError('update.checkConflict', error),
				});

				if (existing.length > 0 && existing[0].id !== validated.id) {
					logger.warn(`Conflicto de nombre al actualizar: ${validated.name}`);
					return yield* Effect.fail(new TagNameConflict({ name: validated.name, existingTagId: existing[0].id }));
				}
			}

			// Actualizar
			const updatedTag = yield* Effect.tryPromise({
				try: async () => {
					const updateData: any = {
						updatedAt: new Date(),
					};

					// Solo incluir campos presentes en validated
					if (validated.name !== undefined) updateData.name = validated.name;
					if (validated.description !== undefined) updateData.description = validated.description;
					if (validated.color !== undefined) updateData.color = validated.color;
					if (validated.emoji !== undefined) updateData.emoji = validated.emoji;
					if (validated.category !== undefined) updateData.category = validated.category;
					if (validated.shortcut !== undefined) updateData.shortcut = validated.shortcut;
					if (validated.featuredImage !== undefined) updateData.featuredImage = validated.featuredImage;
					if (validated.isFavorite !== undefined) updateData.isFavorite = validated.isFavorite;

					const result = await db.update(tags).set(updateData).where(eq(tags.id, validated.id)).returning();

					if (result.length === 0) {
						throw new TagNotFound({ tagId: validated.id });
					}

					return result[0];
				},
				catch: (error) => {
					if (error instanceof TagNotFound) return error;
					logger.error(`❌ Error al actualizar tag ${validated.id}`, { error });
					return fromUnknownError('update', error);
				},
			});

			logger.info(`✅ Tag actualizado: ${updatedTag.name}`);

			// Retornar con stats actualizadas
			return yield* getByIdWithStats(updatedTag.id);
		});

	/**
	 * Elimina un tag
	 */
	const deleteTag = (id: string): Effect.Effect<void, TagError> =>
		Effect.gen(function* () {
			logger.info(`🗑️ Eliminando tag: ${id}`);

			// Verificar que el tag existe
			yield* getById(id);

			// Verificar si tiene relaciones (opcional: podríamos permitir eliminación en cascada)
			const counts = yield* getRelationsCounts(id);
			const totalRelations =
				counts.images +
				counts.videos +
				counts.albums +
				counts.collections +
				counts.characters +
				counts.places +
				counts.worldItems +
				counts.concepts +
				counts.prompts +
				counts.notes +
				counts.wildcards +
				counts.properties +
				counts.groups;

			if (totalRelations > 0) {
				logger.warn(`Tag ${id} tiene ${totalRelations} relaciones activas`);
				return yield* Effect.fail(
					new TagHasRelationsError({
						tagId: id,
						relationCount: totalRelations,
					})
				);
			}

			// Eliminar
			yield* Effect.tryPromise({
				try: async () => {
					const result = await db.delete(tags).where(eq(tags.id, id)).returning();

					if (result.length === 0) {
						throw new TagNotFound({ tagId: id });
					}

					logger.info(`✅ Tag ${id} eliminado exitosamente`);
				},
				catch: (error) => {
					if (error instanceof TagNotFound) return error;
					logger.error(`❌ Error al eliminar tag ${id}`, { error });
					return fromUnknownError('delete', error);
				},
			});
		});

	/**
	 * Toggle favorite status de un tag
	 */
	const toggleFavorite = (id: string): Effect.Effect<Tag, TagError> =>
		Effect.gen(function* () {
			logger.info(`⭐ Toggle favorite para tag: ${id}`);

			const tag = yield* getById(id);
			const newFavoriteStatus = !tag.isFavorite;

			yield* Effect.tryPromise({
				try: () =>
					db
						.update(tags)
						.set({
							isFavorite: newFavoriteStatus,
							updatedAt: new Date(),
						})
						.where(eq(tags.id, id)),
				catch: (error) => fromUnknownError('toggleFavorite', error),
			});

			logger.info(`✅ Favorite toggled: ${newFavoriteStatus}`);

			return yield* getById(id);
		});

	// Retornar la implementación del servicio
	return {
		getById,
		getByIdWithStats,
		getAll,
		create,
		update,
		delete: deleteTag,
		toggleFavorite,
		getImageCount,
		getRelationsCounts,
	};
};

/**
 * Layer que proporciona el TagService
 * No requiere dependencias externas (usa db directamente)
 */
export const TagServiceLive = Layer.succeed(TagService, make());

/**
 * Helper para ejecutar un efecto de TagService con todas las dependencias
 */
export const runTagService = <A, E>(effect: Effect.Effect<A, E, TagService>) => {
	return pipe(effect, Effect.provide(TagServiceLive));
};
