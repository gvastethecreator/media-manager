/**
 * @file AlbumService implementado con Effect
 * @module services/album/album.service.effect
 * @description Servicio Album con manejo funcional de errores usando Effect-TS
 * @created 2025-10-11 - Fase 3 Effect Implementation
 */

import { Schema } from '@effect/schema';
import { and, asc, count, desc, eq, like, or, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { albums, imageAlbums, images } from '@/lib/drizzle/schema';
import { Album, AlbumCreateInput, AlbumUpdateInput, AlbumWithStats } from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateReadableId } from '@/lib/utils/id-generator';
import {
	AlbumDatabaseError,
	AlbumError,
	AlbumHasRelationsError,
	AlbumNameConflict,
	AlbumNotFound,
	AlbumRelationError,
	AlbumValidationError,
	fromUnknownError,
} from './album-errors.effect';

// Helper para crear un logger seguro que funcione en tests y producción
const createSafeLogger = (context: string) => {
	const baseLogger = serverLogger.withContext(context);
	// En tests, el mock puede no tener todas las funciones, así que las proporcionamos
	return {
		debug: baseLogger.debug?.bind(baseLogger) ?? (() => {}),
		info: baseLogger.info?.bind(baseLogger) ?? (() => {}),
		warn: baseLogger.warn?.bind(baseLogger) ?? (() => {}),
		error: baseLogger.error?.bind(baseLogger) ?? (() => {}),
	};
};

// Logger específico
const logger = createSafeLogger('AlbumService.Effect');

/**
 * Opciones para obtener álbumes
 */
export interface GetAlbumsOptions {
	category?: string;
	includeArchived?: boolean;
	includePrivate?: boolean;
	limit?: number;
	offset?: number;
	onlyFavorites?: boolean;
	orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'totalImages';
	orderDirection?: 'asc' | 'desc';
	search?: string;
}

/**
 * Resultado de obtener álbumes con paginación
 */
export interface GetAlbumsResult {
	albums: AlbumWithStats[];
	limit: number;
	offset: number;
	total: number;
}

/**
 * Contadores de relaciones de un álbum
 */
export interface AlbumCounts {
	characters: number;
	collections: number;
	concepts: number;
	groups: number;
	images: number;
	notes: number;
	places: number;
	prompts: number;
	properties: number;
	tags: number;
	videos: number;
	wildcards: number;
	worldItems: number;
}

/**
 * Estadísticas calculadas de un álbum
 */
export interface AlbumStatistics {
	completenessScore: number;
	lastImageAddedAt: Date | null;
	lastUpdated: Date;
	lastVideoAddedAt: Date | null;
	totalImages: number;
	totalItems: number;
	totalRelations: number;
	totalSize: number;
	totalVideos: number;
}

/**
 * Interface para el servicio AlbumService
 */
export interface AlbumServiceInterface {
	readonly addImage: (albumId: string, imageId: string) => Effect.Effect<void, AlbumError>;
	readonly addImages: (albumId: string, imageIds: string[]) => Effect.Effect<{ added: number }, AlbumError>;
	readonly bulkDelete: (ids: string[]) => Effect.Effect<{ deleted: number; failed: string[] }, AlbumError>;
	readonly create: (input: Schema.Schema.Type<typeof AlbumCreateInput>) => Effect.Effect<AlbumWithStats, AlbumError>;
	readonly delete: (id: string) => Effect.Effect<void, AlbumError>;
	readonly getAll: (options?: GetAlbumsOptions) => Effect.Effect<GetAlbumsResult, AlbumError>;
	readonly getById: (id: string) => Effect.Effect<Album, AlbumError>;
	readonly getByIdWithStats: (id: string) => Effect.Effect<AlbumWithStats, AlbumError>;
	readonly getImages: (
		albumId: string,
		options?: { limit?: number; offset?: number }
	) => Effect.Effect<any[], AlbumError>;
	readonly getRelationsCounts: (id: string) => Effect.Effect<AlbumCounts, AlbumError>;
	readonly removeImage: (albumId: string, imageId: string) => Effect.Effect<void, AlbumError>;
	readonly removeImages: (albumId: string, imageIds: string[]) => Effect.Effect<{ removed: number }, AlbumError>;
	readonly toggleFavorite: (id: string) => Effect.Effect<Album, AlbumError>;
	readonly update: (
		id: string,
		input: Schema.Schema.Type<typeof AlbumUpdateInput>
	) => Effect.Effect<AlbumWithStats, AlbumError>;
}

/**
 * Context.Tag para AlbumService
 */
export class AlbumService extends Context.Tag('AlbumService')<AlbumService, AlbumServiceInterface>() {}

/**
 * Calcula estadísticas para un Album
 */
const calculateAlbumStatistics = (album: Album, counts: AlbumCounts): AlbumStatistics => {
	const totalRelations =
		counts.images +
		counts.videos +
		counts.collections +
		counts.tags +
		counts.characters +
		counts.places +
		counts.worldItems +
		counts.concepts +
		counts.prompts +
		counts.notes +
		counts.wildcards +
		counts.properties +
		counts.groups;

	// Completeness: qué tan completo está el perfil del álbum
	let completenessScore = 0;
	if (album.name) completenessScore += 30;
	if (album.description) completenessScore += 20;
	if (album.color) completenessScore += 15;
	if (album.emoji) completenessScore += 15;
	if (album.category) completenessScore += 10;
	if (album.featuredImage) completenessScore += 10;

	return {
		totalImages: counts.images,
		totalVideos: counts.videos,
		totalSize: 0, // Los álbumes no tienen campo totalSize en su tabla (usar entityAggregates si es necesario)
		totalItems: counts.images + counts.videos,
		totalRelations,
		lastImageAddedAt: album.lastImageAddedAt ?? null, // Obtenido desde la tabla albums
		lastVideoAddedAt: album.lastVideoAddedAt ?? null, // Obtenido desde la tabla albums
		completenessScore,
		lastUpdated: new Date(),
	};
};

/**
 * Implementación del servicio AlbumService
 */
const make = (): AlbumServiceInterface => {
	/**
	 * Obtiene un álbum por su ID
	 */
	const getById = (id: string): Effect.Effect<Album, AlbumError> =>
		Effect.gen(function* () {
			logger.info(`🔍 Buscando álbum: ${id}`);

			const result = yield* Effect.tryPromise<(typeof albums.$inferSelect)[], AlbumError>({
				try: async () => await db.select().from(albums).where(eq(albums.id, id)).limit(1),
				catch: (error: unknown) => {
					logger.error(`❌ Error al obtener álbum ${id}`, { error });
					return fromUnknownError('getById', error);
				},
			});

			if (result.length === 0) {
				logger.warn(`Álbum no encontrado: ${id}`);
				return yield* Effect.fail(new AlbumNotFound({ albumId: id }));
			}

			logger.info('✅ Álbum encontrado:', result[0]);

			// Validar con Schema (síncrono)
			const validated = yield* Effect.try({
				try: () => Schema.decodeUnknownSync(Album)(result[0]),
				catch: (error) => {
					logger.error('❌ Error validando album:', error);
					logger.error('❌ Datos recibidos de BD:', result[0]);
					return new AlbumValidationError({
						field: 'album',
						message: 'Error al validar álbum desde BD',
						value: result[0],
					});
				},
			});
			return validated;
		});

	/**
	 * Obtiene conteos de relaciones para un álbum
	 */
	const getRelationsCounts = (id: string): Effect.Effect<AlbumCounts, AlbumError> =>
		Effect.gen(function* () {
			logger.info(`📊 Obteniendo conteos para álbum: ${id}`);

			// Contar imágenes
			const imageCountResult = yield* Effect.tryPromise<Array<{ count: number }>, AlbumError>({
				try: async () => await db.select({ count: count() }).from(imageAlbums).where(eq(imageAlbums.B, id)),
				catch: (error: unknown) => fromUnknownError('getRelationsCounts', error),
			});

			const imageCount = imageCountResult[0]?.count ?? 0;

			// TODO: agregar conteos reales para otros tipos de entidades
			const counts: AlbumCounts = {
				images: imageCount,
				videos: 0,
				collections: 0,
				tags: 0,
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
	 * Obtiene las imágenes asociadas a un álbum
	 */
	const getImages = (id: string, options: { limit?: number; offset?: number } = {}): Effect.Effect<any[], AlbumError> =>
		Effect.gen(function* () {
			logger.info(`🖼️ Obteniendo imágenes para álbum: ${id}`);

			const { limit = 50, offset = 0 } = options;
			const safeLimit = Math.max(0, limit);
			const safeOffset = Math.max(0, offset);

			const album = yield* Effect.tryPromise({
				try: async () =>
					await db.query.albums.findFirst({
						where: eq(albums.id, id),
						with: {
							images: {
								with: {
									folder: true,
									tags: { columns: { id: true } },
									albums: { columns: { id: true } },
									collections: { columns: { id: true } },
									characters: { columns: { id: true } },
									places: { columns: { id: true } },
									worldItems: { columns: { id: true } },
									notes: { columns: { id: true } },
								},
							},
						},
					}),
				catch: (error: unknown) => fromUnknownError('getImages', error),
			});

			if (!album) {
				return yield* Effect.fail(new AlbumNotFound({ albumId: id }));
			}

			const images = album.images ?? [];
			if (safeLimit === 0) {
				return [];
			}

			return images.slice(safeOffset, safeOffset + safeLimit);
		});

	/**
	 * Obtiene un álbum con estadísticas completas
	 */
	const getByIdWithStats = (id: string): Effect.Effect<AlbumWithStats, AlbumError> =>
		Effect.gen(function* () {
			const album = yield* getById(id);
			const counts = yield* getRelationsCounts(id);
			const stats = calculateAlbumStatistics(album, counts);

			// Crear AlbumWithStats usando el Schema
			const albumWithStats = new AlbumWithStats({
				...album,
				totalImages: stats.totalImages,
				totalVideos: stats.totalVideos,
				totalSize: stats.totalSize,
			});

			return albumWithStats;
		});

	/**
	 * Obtiene todos los álbumes con filtros y estadísticas
	 */
	const getAll = (options: GetAlbumsOptions = {}): Effect.Effect<GetAlbumsResult, AlbumError> =>
		Effect.gen(function* () {
			const {
				search,
				onlyFavorites = false,
				category,
				orderBy = 'name',
				orderDirection = 'asc',
				limit = 50,
				offset = 0,
				includeArchived = false,
			} = options;

			logger.info('🎞️ Obteniendo álbumes', { options });

			// Construir condiciones de filtrado
			const conditions: any[] = [];

			if (onlyFavorites) {
				conditions.push(eq(albums.isFavorite, true));
			}

			if (search) {
				conditions.push(or(like(albums.name, `%${search}%`), like(albums.description, `%${search}%`)));
			}

			if (category) {
				conditions.push(eq(albums.category, category));
			}

			// Construir ordenamiento
			const orderDirection_fn = orderDirection === 'desc' ? desc : asc;
			let orderByField: any;

			switch (orderBy) {
				case 'createdAt':
					orderByField = orderDirection_fn(albums.createdAt);
					break;
				case 'updatedAt':
					orderByField = orderDirection_fn(albums.updatedAt);
					break;
				case 'totalImages':
					// TODO: ordenar por count de imágenes
					orderByField = orderDirection_fn(albums.name);
					break;
				default: // 'name'
					orderByField = orderDirection_fn(albums.name);
			}

			// Query principal
			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const albumsResult = yield* Effect.tryPromise<(typeof albums.$inferSelect)[], AlbumError>({
				try: async () =>
					await db.select().from(albums).where(whereClause).orderBy(orderByField).limit(limit).offset(offset),
				catch: (error: unknown) => fromUnknownError('getAll', error),
			});

			// Contar total
			const countResult = yield* Effect.tryPromise<Array<{ count: number }>, AlbumError>({
				try: async () => await db.select({ count: count() }).from(albums).where(whereClause),
				catch: (error: unknown) => fromUnknownError('getAll.count', error),
			});

			const total = countResult[0]?.count ?? 0;

			// Enriquecer con stats
			const albumsWithStats = yield* Effect.all(
				albumsResult.map((album) => {
					// Validar schema
					const validated = Schema.decodeUnknownSync(Album)(album);
					return getByIdWithStats(validated.id);
				}),
				{ concurrency: 'unbounded' }
			);

			logger.info(`✅ Obtenidos ${albumsWithStats.length} álbumes de ${total} total`);

			return {
				albums: albumsWithStats,
				total,
				limit,
				offset,
			};
		});

	/**
	 * Crea un nuevo álbum
	 */
	const create = (input: Schema.Schema.Type<typeof AlbumCreateInput>): Effect.Effect<AlbumWithStats, AlbumError> =>
		Effect.gen(function* () {
			logger.info('➕ Creando álbum', { name: input.name });

			// Validar entrada con schema (síncrono)
			const validated = yield* Effect.try({
				try: () => Schema.decodeUnknownSync(AlbumCreateInput)(input),
				catch: (error) =>
					new AlbumValidationError({
						field: 'input',
						message: 'Error al validar entrada de creación',
						value: input,
					}),
			});

			// Verificar si ya existe un álbum con el mismo nombre
			const existing = yield* Effect.tryPromise<(typeof albums.$inferSelect)[], AlbumError>({
				try: async () => await db.select().from(albums).where(eq(albums.name, validated.name)).limit(1),
				catch: (error: unknown) => fromUnknownError('create.checkDuplicate', error),
			});

			if (existing.length > 0) {
				return yield* Effect.fail(
					new AlbumNameConflict({
						name: validated.name,
						existingAlbumId: existing[0].id,
					})
				);
			}

			// Generar ID legible basado en el nombre
			const readableId = generateReadableId('album', validated.name, 1);

			// Insertar en DB
			const insertData = {
				id: readableId,
				name: validated.name,
				description: validated.description ?? null,
				emoji: validated.emoji ?? null,
				color: validated.color ?? null,
				category: validated.category ?? null,
				featuredImage: validated.featuredImage ?? null,
				isFavorite: validated.isFavorite ?? false,
				filters: validated.filters ?? null,
				metadata: validated.metadata ?? null,
			};

			const newAlbum = yield* Effect.tryPromise<(typeof albums.$inferInsert)[], AlbumError>({
				try: async () => await db.insert(albums).values(insertData).returning(),
				catch: (error: unknown) => fromUnknownError('create.insert', error),
			});

			if (newAlbum.length === 0) {
				return yield* Effect.fail(
					new AlbumDatabaseError({
						operation: 'create',
						message: 'No se pudo insertar el álbum',
					})
				);
			}

			logger.info(`✅ Álbum creado: ${newAlbum[0].id}`);

			// Verificar que existe el ID
			const albumId = newAlbum[0]?.id;
			if (!albumId) {
				return yield* Effect.fail(
					new AlbumDatabaseError({
						operation: 'create',
						message: 'Álbum creado pero no se obtuvo ID',
					})
				);
			}

			// Retornar con stats
			return yield* getByIdWithStats(albumId);
		});

	/**
	 * Actualiza un álbum existente
	 */
	const update = (
		id: string,
		input: Schema.Schema.Type<typeof AlbumUpdateInput>
	): Effect.Effect<AlbumWithStats, AlbumError> =>
		Effect.gen(function* () {
			logger.info(`📝 Actualizando álbum: ${id}`, { input });

			// Verificar que existe
			yield* getById(id);

			// Validar entrada (síncrono)
			const validated = yield* Effect.try({
				try: () => Schema.decodeUnknownSync(AlbumUpdateInput)(input),
				catch: (error) =>
					new AlbumValidationError({
						field: 'input',
						message: 'Error al validar entrada de actualización',
						value: input,
					}),
			});

			// Si se actualiza el nombre, verificar duplicados
			if (validated.name) {
				const nameToCheck = validated.name;
				const existing = yield* Effect.tryPromise<(typeof albums.$inferSelect)[], AlbumError>({
					try: () =>
						db
							.select()
							.from(albums)
							.where(and(eq(albums.name, nameToCheck), sql`id != ${id}`))
							.limit(1),
					catch: (error: unknown) => fromUnknownError('update.checkDuplicate', error),
				});

				if (existing.length > 0) {
					return yield* Effect.fail(
						new AlbumNameConflict({
							name: validated.name,
							existingAlbumId: existing[0].id,
						})
					);
				}
			}

			// Actualizar en DB
			const updateData: any = {};
			if (validated.name !== undefined) updateData.name = validated.name;
			if (validated.description !== undefined) updateData.description = validated.description;
			if (validated.emoji !== undefined) updateData.emoji = validated.emoji;
			if (validated.color !== undefined) updateData.color = validated.color;
			if (validated.category !== undefined) updateData.category = validated.category;
			if (validated.featuredImage !== undefined) updateData.featuredImage = validated.featuredImage;
			if (validated.isFavorite !== undefined) updateData.isFavorite = validated.isFavorite;
			if (validated.filters !== undefined) updateData.filters = validated.filters;
			if (validated.metadata !== undefined) updateData.metadata = validated.metadata;

			updateData.updatedAt = new Date();

			yield* Effect.tryPromise({
				try: async () => await db.update(albums).set(updateData).where(eq(albums.id, id)),
				catch: (error: unknown) => fromUnknownError('update', error),
			});

			logger.info(`✅ Álbum actualizado: ${id}`);

			return yield* getByIdWithStats(id);
		});

	/**
	 * Elimina un álbum
	 */
	const deleteAlbum = (id: string): Effect.Effect<void, AlbumError> =>
		Effect.gen(function* () {
			logger.info(`🗑️ Eliminando álbum: ${id}`);

			// Verificar que existe
			yield* getById(id);

			// Verificar relaciones
			const counts = yield* getRelationsCounts(id);
			const totalRelations = counts.images + counts.videos;

			if (totalRelations > 0) {
				return yield* Effect.fail(
					new AlbumHasRelationsError({
						albumId: id,
						relationCount: totalRelations,
					})
				);
			}

			// Eliminar
			yield* Effect.tryPromise({
				try: async () => await db.delete(albums).where(eq(albums.id, id)),
				catch: (error: unknown) => fromUnknownError('delete', error),
			});

			logger.info(`✅ Álbum eliminado: ${id}`);
		});

	/**
	 * Elimina múltiples álbumes
	 */
	const bulkDelete = (ids: string[]): Effect.Effect<{ deleted: number; failed: string[] }, AlbumError> =>
		Effect.gen(function* () {
			logger.info(`🗑️ Eliminación masiva de ${ids.length} álbumes`);

			const results = yield* Effect.all(
				ids.map((id) =>
					deleteAlbum(id).pipe(
						Effect.either,
						Effect.map((result) => ({ id, result }))
					)
				),
				{ concurrency: 5 } // Limitar concurrencia
			);

			const failed: string[] = [];
			let deleted = 0;

			for (const { id, result } of results) {
				if (result._tag === 'Left') {
					failed.push(id);
					logger.warn(`❌ Error al eliminar álbum ${id}: ${result.left.displayMessage}`);
				} else {
					deleted++;
				}
			}

			logger.info(`✅ Eliminación masiva completada: ${deleted} exitosos, ${failed.length} fallidos`);

			return { deleted, failed };
		});

	/**
	 * Alterna el estado de favorito
	 */
	const toggleFavorite = (id: string): Effect.Effect<Album, AlbumError> =>
		Effect.gen(function* () {
			logger.info(`⭐ Toggle favorito: ${id}`);

			const album = yield* getById(id);

			yield* Effect.tryPromise({
				try: async () => await db.update(albums).set({ isFavorite: !album.isFavorite }).where(eq(albums.id, id)),
				catch: (error: unknown) => fromUnknownError('toggleFavorite', error),
			});

			logger.info(`✅ Favorito actualizado: ${id}`);

			return yield* getById(id);
		});

	/**
	 * Agrega una imagen al álbum
	 */
	const addImage = (albumId: string, imageId: string): Effect.Effect<void, AlbumError> =>
		Effect.gen(function* () {
			logger.info(`🖼️ Agregando imagen ${imageId} al álbum ${albumId}`);

			// Verificar que el álbum existe
			yield* getById(albumId);

			// Verificar que la imagen existe
			const imageExists = yield* Effect.tryPromise<(typeof images.$inferSelect)[], AlbumError>({
				try: async () => await db.select().from(images).where(eq(images.id, imageId)).limit(1),
				catch: (error: unknown) =>
					new AlbumRelationError({
						albumId,
						relationType: 'image',
						relationId: imageId,
						operation: 'add',
						message: 'Error al verificar existencia de imagen',
						cause: error,
					}),
			});

			if (imageExists.length === 0) {
				return yield* Effect.fail(
					new AlbumRelationError({
						albumId,
						relationType: 'image',
						relationId: imageId,
						operation: 'add',
						message: 'La imagen no existe',
					})
				);
			}

			// Insertar relación
			yield* Effect.tryPromise({
				try: () =>
					db.insert(imageAlbums).values({
						A: imageId,
						B: albumId,
					}),
				catch: (error: unknown) =>
					new AlbumRelationError({
						albumId,
						relationType: 'image',
						relationId: imageId,
						operation: 'add',
						message: 'Error al insertar relación',
						cause: error,
					}),
			});

			logger.info('✅ Imagen agregada al álbum');
		});

	/**
	 * Remueve una imagen del álbum
	 */
	const removeImage = (albumId: string, imageId: string): Effect.Effect<void, AlbumError> =>
		Effect.gen(function* () {
			logger.info(`🖼️ Removiendo imagen ${imageId} del álbum ${albumId}`);

			yield* Effect.tryPromise({
				try: async () =>
					await db.delete(imageAlbums).where(and(eq(imageAlbums.A, imageId), eq(imageAlbums.B, albumId))),
				catch: (error: unknown) =>
					new AlbumRelationError({
						albumId,
						relationType: 'image',
						relationId: imageId,
						operation: 'remove',
						message: 'Error al remover relación',
						cause: error,
					}),
			});

			logger.info('✅ Imagen removida del álbum');
		});

	/**
	 * Agrega múltiples imágenes al álbum
	 */
	const addImages = (albumId: string, imageIds: string[]): Effect.Effect<{ added: number }, AlbumError> =>
		Effect.gen(function* () {
			logger.info(`🖼️ Agregando ${imageIds.length} imágenes al álbum ${albumId}`);

			const results = yield* Effect.all(
				imageIds.map((imageId) =>
					addImage(albumId, imageId).pipe(
						Effect.either,
						Effect.map((result) => ({ imageId, result }))
					)
				),
				{ concurrency: 10 }
			);

			const added = results.filter((r) => r.result._tag === 'Right').length;
			const failed = results.filter((r) => r.result._tag === 'Left').length;

			logger.info(`✅ Imágenes agregadas: ${added} exitosas, ${failed} fallidas`);

			return { added };
		});

	/**
	 * Remueve múltiples imágenes del álbum
	 */
	const removeImages = (albumId: string, imageIds: string[]): Effect.Effect<{ removed: number }, AlbumError> =>
		Effect.gen(function* () {
			logger.info(`🖼️ Removiendo ${imageIds.length} imágenes del álbum ${albumId}`);

			const results = yield* Effect.all(
				imageIds.map((imageId) =>
					removeImage(albumId, imageId).pipe(
						Effect.either,
						Effect.map((result) => ({ imageId, result }))
					)
				),
				{ concurrency: 10 }
			);

			const removed = results.filter((r) => r.result._tag === 'Right').length;

			logger.info(`✅ Imágenes removidas: ${removed}`);

			return { removed };
		});

	return {
		getById,
		getByIdWithStats,
		getAll,
		create,
		update,
		delete: deleteAlbum,
		bulkDelete,
		toggleFavorite,
		getRelationsCounts,
		addImage,
		removeImage,
		addImages,
		removeImages,
		getImages,
	};
};

/**
 * Layer que proporciona AlbumService
 */
export const AlbumServiceLive = Layer.succeed(AlbumService, make());

/**
 * Helper para ejecutar operaciones del AlbumService en runtime
 */
export const runAlbumService = <A, E>(effect: Effect.Effect<A, E, AlbumService>) =>
	Effect.provide(effect, AlbumServiceLive);
