/**
 * @file TagService implementado con Effect
 * @module services/tag/tag.service.effect
 * @description Servicio Tag con manejo funcional de errores usando Effect-TS
 * @created 2025-10-11 - Fase 1 Effect Implementation
 */

import { Schema, Context, Effect, Layer, pipe } from 'effect';
import { and, asc, count, desc, eq, inArray, isNotNull, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groupTags, images, imageTags, tags, videos, videoTags } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
import { favoriteService } from '@/services/favorite/favorite.service';
import { visibleImageLifecycleCondition } from '@/services/image/image-lifecycle-query';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	fromUnknownError,
	TagError,
	TagHasRelationsError,
	TagNameConflict,
	TagNotFound,
	TagValidationError,
} from './tag-errors.effect';
import {
	GetTagsOptions,
	GetTagsResult,
	Tag,
	TagCounts,
	TagCreate,
	TagStatistics,
	TagUpdate,
	TagWithStats,
} from './tag-schemas';

// Logger específico
const logger = serverLogger.withContext('TagService.Effect');

/**
 * Interface para el servicio TagService
 */
export interface TagServiceInterface {
	readonly addToImage: (imageId: string, tagIds: string[]) => Effect.Effect<{ added: number }, TagError>;
	readonly addToVideo: (videoId: string, tagIds: string[]) => Effect.Effect<{ added: number }, TagError>;
	readonly create: (input: TagCreate) => Effect.Effect<TagWithStats, TagError>;
	readonly delete: (id: string) => Effect.Effect<void, TagError>;
	readonly getAll: (options?: GetTagsOptions) => Effect.Effect<GetTagsResult, TagError>;
	readonly getById: (id: string) => Effect.Effect<Tag, TagError>;
	readonly getByIdWithStats: (id: string) => Effect.Effect<TagWithStats, TagError>;
	readonly getImageCount: (id: string) => Effect.Effect<number, TagError>;
	readonly getImages: (
		id: string
	) => Effect.Effect<Array<{ id: string; name: string | null; path: string; thumbnailPath: string | null }>, TagError>;
	readonly getRelationsCounts: (id: string) => Effect.Effect<TagCounts, TagError>;
	readonly getThumbnails: (
		id: string,
		limit?: number
	) => Effect.Effect<Array<{ id: string; name: string | null; thumbnailUrl: string }>, TagError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<Tag, TagError>;
	readonly update: (input: TagUpdate) => Effect.Effect<TagWithStats, TagError>;
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
	const addToImage = (imageId: string, tagIds: string[]): Effect.Effect<{ added: number }, TagError> =>
		Effect.gen(function* () {
			const uniqueTagIds = [...new Set(tagIds.filter(Boolean))];

			if (uniqueTagIds.length === 0) {
				return { added: 0 };
			}

			const imageResult = yield* Effect.tryPromise<Array<{ id: string }>, TagError>({
				try: () => db.select({ id: images.id }).from(images).where(eq(images.id, imageId)).limit(1),
				catch: (error) => fromUnknownError('addToImage.imageLookup', error),
			});

			if (imageResult.length === 0) {
				return yield* Effect.fail(
					new TagValidationError({ field: 'imageId', message: 'La imagen no existe', value: imageId })
				);
			}

			yield* Effect.all(
				uniqueTagIds.map((tagId) => getById(tagId)),
				{ concurrency: 'unbounded' }
			);

			const existingRelations = yield* Effect.tryPromise<Array<{ tagId: string }>, TagError>({
				try: () =>
					db
						.select({ tagId: imageTags.B })
						.from(imageTags)
						.where(and(eq(imageTags.A, imageId), inArray(imageTags.B, uniqueTagIds))),
				catch: (error) => fromUnknownError('addToImage.existingRelations', error),
			});

			const existingTagIds = new Set(existingRelations.map((relation) => relation.tagId));
			const missingTagIds = uniqueTagIds.filter((tagId) => !existingTagIds.has(tagId));

			if (missingTagIds.length > 0) {
				yield* Effect.tryPromise({
					try: () => db.insert(imageTags).values(missingTagIds.map((tagId) => ({ A: imageId, B: tagId }))),
					catch: (error) => fromUnknownError('addToImage.insert', error),
				});
			}

			return { added: missingTagIds.length };
		});

	const addToVideo = (videoId: string, tagIds: string[]): Effect.Effect<{ added: number }, TagError> =>
		Effect.gen(function* () {
			const uniqueTagIds = [...new Set(tagIds.filter(Boolean))];

			if (uniqueTagIds.length === 0) {
				return { added: 0 };
			}

			const videoResult = yield* Effect.tryPromise<Array<{ id: string }>, TagError>({
				try: () => db.select({ id: videos.id }).from(videos).where(eq(videos.id, videoId)).limit(1),
				catch: (error) => fromUnknownError('addToVideo.videoLookup', error),
			});

			if (videoResult.length === 0) {
				return yield* Effect.fail(
					new TagValidationError({ field: 'videoId', message: 'El video no existe', value: videoId })
				);
			}

			yield* Effect.all(
				uniqueTagIds.map((tagId) => getById(tagId)),
				{ concurrency: 'unbounded' }
			);

			const existingRelations = yield* Effect.tryPromise<Array<{ tagId: string }>, TagError>({
				try: () =>
					db
						.select({ tagId: videoTags.B })
						.from(videoTags)
						.where(and(eq(videoTags.A, videoId), inArray(videoTags.B, uniqueTagIds))),
				catch: (error) => fromUnknownError('addToVideo.existingRelations', error),
			});

			const existingTagIds = new Set(existingRelations.map((relation) => relation.tagId));
			const missingTagIds = uniqueTagIds.filter((tagId) => !existingTagIds.has(tagId));

			if (missingTagIds.length > 0) {
				yield* Effect.tryPromise({
					try: () => db.insert(videoTags).values(missingTagIds.map((tagId) => ({ A: videoId, B: tagId }))),
					catch: (error) => fromUnknownError('addToVideo.insert', error),
				});
			}

			return { added: missingTagIds.length };
		});

	/**
	 * Obtiene un tag por su ID
	 */
	const getById = (id: string): Effect.Effect<Tag, TagError> =>
		Effect.gen(function* () {
			logger.info(`🔍 Buscando tag: ${id}`);

			// Query usando db directamente (importado de drizzle/index)
			const result = yield* Effect.tryPromise<(typeof tags.$inferSelect)[], TagError>({
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

			const favoriteEntityIds = yield* Effect.tryPromise<string[], TagError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.TAG),
				catch: (error) => fromUnknownError('getById.favoriteIds', error),
			});

			return favoriteService.applyFavoriteProjection(validated, favoriteEntityIds);
		});

	/**
	 * Obtiene conteos de relaciones para un tag
	 */
	const getRelationsCounts = (id: string): Effect.Effect<TagCounts, TagError> =>
		Effect.gen(function* () {
			logger.info(`📊 Obteniendo conteos para tag: ${id}`);

			// Obtener conteos reales de todas las relaciones existentes
			const [imageCountResult, videoCountResult, groupCountResult] = yield* Effect.tryPromise<
				[Array<{ count: number }>, Array<{ count: number }>, Array<{ count: number }>],
				TagError
			>({
				try: () =>
					Promise.all([
						db
							.select({ count: count() })
							.from(imageTags)
							.innerJoin(images, eq(imageTags.A, images.id))
							.where(and(eq(imageTags.B, id), visibleImageLifecycleCondition())),
						db.select({ count: count() }).from(videoTags).where(eq(videoTags.B, id)),
						db.select({ count: count() }).from(groupTags).where(eq(groupTags.B, id)),
					]),
				catch: (error: unknown) => fromUnknownError('getRelationsCounts', error),
			});

			const imageCount = imageCountResult[0]?.count ?? 0;
			const videoCount = videoCountResult[0]?.count ?? 0;
			const groupCount = groupCountResult[0]?.count ?? 0;

			const counts: TagCounts = {
				images: imageCount,
				videos: videoCount,
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
				groups: groupCount,
			};

			logger.info(`✅ Conteos obtenidos: ${imageCount} imágenes, ${videoCount} videos, ${groupCount} grupos`);
			return counts;
		});

	/**
	 * Obtiene conteos de relaciones para múltiples tags en batch (evita N+1)
	 */
	const getBatchRelationsCounts = (ids: string[]): Effect.Effect<Map<string, TagCounts>, TagError> =>
		Effect.gen(function* () {
			if (ids.length === 0) return new Map();

			const emptyCounts = (): TagCounts => ({
				images: 0,
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
			});

			const [imageResults, videoResults, groupResults] = yield* Effect.tryPromise<
				[
					Array<{ tagId: string; count: number }>,
					Array<{ tagId: string; count: number }>,
					Array<{ tagId: string; count: number }>,
				],
				TagError
			>({
				try: () =>
					Promise.all([
						db
							.select({ tagId: imageTags.B, count: count() })
							.from(imageTags)
							.innerJoin(images, eq(imageTags.A, images.id))
							.where(and(inArray(imageTags.B, ids), visibleImageLifecycleCondition()))
							.groupBy(imageTags.B),
						db
							.select({ tagId: videoTags.B, count: count() })
							.from(videoTags)
							.where(inArray(videoTags.B, ids))
							.groupBy(videoTags.B),
						db
							.select({ tagId: groupTags.B, count: count() })
							.from(groupTags)
							.where(inArray(groupTags.B, ids))
							.groupBy(groupTags.B),
					]),
				catch: (error: unknown) => fromUnknownError('getBatchRelationsCounts', error),
			});

			const result = new Map<string, TagCounts>();

			const imageMap = new Map(imageResults.map((r) => [r.tagId, r.count]));
			const videoMap = new Map(videoResults.map((r) => [r.tagId, r.count]));
			const groupMap = new Map(groupResults.map((r) => [r.tagId, r.count]));

			for (const id of ids) {
				result.set(id, {
					...emptyCounts(),
					images: imageMap.get(id) ?? 0,
					videos: videoMap.get(id) ?? 0,
					groups: groupMap.get(id) ?? 0,
				} as TagCounts);
			}

			return result;
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

			const favoriteEntityIds = yield* Effect.tryPromise<string[], TagError>({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.TAG),
				catch: (error) => fromUnknownError('getAll.favoriteIds', error),
			});

			if (onlyFavorites && favoriteEntityIds.length === 0) {
				return {
					tags: [],
					total: 0,
					limit,
					offset,
					hasMore: false,
				};
			}

			// Construir condiciones de filtrado
			const conditions: any[] = [];

			if (onlyFavorites) {
				conditions.push(inArray(tags.id, favoriteEntityIds));
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
			const rawTags = yield* Effect.tryPromise<(typeof tags.$inferSelect)[], TagError>({
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

			// Enriquecer tags con stats en batch (evita N+1)
			const tagIds = rawTags.map((t) => t.id);
			const countsMap = yield* getBatchRelationsCounts(tagIds);

			const tagsWithStats = rawTags.map((rawTag) => {
				const tag = Schema.decodeUnknownSync(Tag)(rawTag);
				const counts = countsMap.get(tag.id) ?? {
					images: 0,
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
				const stats = calculateTagStatistics(tag, counts);

				return {
					...tag,
					shortcut: tag.shortcut ?? null,
					entityType: 'tag' as const,
					stats,
					_count: counts,
					statistics: stats,
				};
			});

			const projectedTags = favoriteService.applyFavoriteProjectionMany(
				tagsWithStats,
				favoriteEntityIds
			) as TagWithStats[];

			logger.info(`✅ ${projectedTags.length} tags obtenidos de ${totalCount} totales`);

			return {
				tags: projectedTags,
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
			const existingTags = yield* Effect.tryPromise<(typeof tags.$inferSelect)[], TagError>({
				try: () => db.select().from(tags).where(eq(tags.name, validated.name)).limit(1),
				catch: (error: unknown) => fromUnknownError('create.checkConflict', error),
			});

			if (existingTags.length > 0) {
				logger.warn(`Conflicto de nombre: ${validated.name}`);
				return yield* Effect.fail(new TagNameConflict({ name: validated.name, existingTagId: existingTags[0].id }));
			}

			// Generar ID legible basado en el nombre
			const readableId = generateReadableId('tag', validated.name, 1);

			// Insertar nuevo tag
			const newTag = yield* Effect.tryPromise({
				try: async () => {
					const now = new Date();

					const result = await db
						.insert(tags)
						.values({
							id: readableId,
							name: validated.name,
							description: validated.description ?? null,
							color: validated.color ?? '#3b82f6',
							emoji: validated.emoji ?? '🏷️',
							category: validated.category ?? null,
							shortcut: validated.shortcut ?? null,
							featuredImage: validated.featuredImage ?? null,
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
				const existing = yield* Effect.tryPromise<(typeof tags.$inferSelect)[], TagError>({
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
			const storedImageRelations = yield* Effect.tryPromise<Array<{ count: number }>, TagError>({
				try: () => db.select({ count: count() }).from(imageTags).where(eq(imageTags.B, id)),
				catch: (error) => fromUnknownError('delete.storedImageRelations', error),
			});
			const totalRelations =
				(storedImageRelations[0]?.count ?? 0) +
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

			yield* getById(id);

			const currentFavoriteStatus = yield* Effect.tryPromise<boolean, TagError>({
				try: () => favoriteService.isFavorite(FavoriteEntityType.TAG, id),
				catch: (error) => fromUnknownError('toggleFavorite.isFavorite', error),
			});

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.TAG, id, !currentFavoriteStatus),
				catch: (error) => fromUnknownError('toggleFavorite.favoriteBridge', error),
			});

			return yield* getById(id);
		});

	/**
	 * Obtiene las imágenes asociadas a un tag
	 */
	const getImages = (
		id: string
	): Effect.Effect<Array<{ id: string; name: string | null; path: string; thumbnailPath: string | null }>, TagError> =>
		Effect.gen(function* () {
			logger.info(`🖼️ Obteniendo imágenes para tag: ${id}`);

			// Verificar que el tag existe
			yield* getById(id);

			const tagImages = yield* Effect.tryPromise<
				Array<{ id: string; name: string | null; path: string; thumbnailPath: string | null }>,
				TagError
			>({
				try: async () => {
					return db
						.select({
							id: images.id,
							name: images.name,
							path: images.path,
							thumbnailPath: images.thumbnail,
						})
						.from(images)
						.innerJoin(imageTags, eq(imageTags.A, images.id))
						.where(and(eq(imageTags.B, id), visibleImageLifecycleCondition()))
						.orderBy(desc(images.updatedAt));
				},
				catch: (error) => fromUnknownError('getImages', error),
			});

			logger.info(`✅ Obtenidas ${tagImages.length} imágenes para tag ${id}`);
			return tagImages;
		});

	/**
	 * Obtiene thumbnails de imágenes asociadas a un tag
	 */
	const getThumbnails = (
		id: string,
		limit = 6
	): Effect.Effect<Array<{ id: string; name: string | null; thumbnailUrl: string }>, TagError> =>
		Effect.gen(function* () {
			logger.info(`🔄 Obteniendo thumbnails para tag: ${id}, límite: ${limit}`);

			// Verificar que el tag existe
			yield* getById(id);

			const tagImages = yield* Effect.tryPromise<Array<{ id: string; name: string | null; path: string }>, TagError>({
				try: async () => {
					return db
						.select({
							id: images.id,
							name: images.name,
							path: images.path,
						})
						.from(images)
						.innerJoin(imageTags, eq(imageTags.A, images.id))
						.where(and(eq(imageTags.B, id), isNotNull(images.thumbnail), visibleImageLifecycleCondition()))
						.orderBy(desc(images.updatedAt))
						.limit(limit);
				},
				catch: (error) => fromUnknownError('getThumbnails', error),
			});

			// Mapear a formato de respuesta con URL de thumbnail
			const thumbnails = tagImages.map((image) => ({
				id: image.id,
				name: image.name,
				thumbnailUrl: `/api/images/${image.id}/thumbnail`,
			}));

			logger.info(`✅ Obtenidos ${thumbnails.length} thumbnails para tag ${id}`);
			return thumbnails;
		});

	// Retornar la implementación del servicio
	return {
		addToImage,
		addToVideo,
		getById,
		getByIdWithStats,
		getAll,
		create,
		update,
		delete: deleteTag,
		toggleFavorite,
		getImageCount,
		getRelationsCounts,
		getImages,
		getThumbnails,
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
