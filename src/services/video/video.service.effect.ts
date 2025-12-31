/**
 * =================================================================================
 * VIDEO SERVICE - EFFECT-TS
 * =================================================================================
 * Servicio de videos con Effect-TS para manejo de operaciones CRUD y operaciones
 * específicas de video (thumbnails, metadata, procesamiento).
 *
 * Migrado desde video.server.service.ts (legacy) siguiendo los patrones establecidos
 * en image.service.effect.ts.
 * =================================================================================
 */

import * as crypto from 'node:crypto';
import { and, asc, count, desc, eq, gte, like, lte, or } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { folders, videos } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import type { VideoError } from './video-errors.effect';
import {
	videoDatabaseError,
	videoHashConflict,
	videoNotFound,
	videoUnknownError,
	videoValidationError,
} from './video-errors.effect';

// =================================================================================
// TYPES & INTERFACES
// =================================================================================

const SERVICE_NAME = 'VideoServiceEffect';
const videoServiceLogger = serverLogger.withContext(SERVICE_NAME);

/**
 * Input para crear un nuevo video
 */
export interface CreateVideoInput {
	name: string;
	description?: string | null;
	path: string;
	size: number;
	hash: string;
	duration: number;
	width?: number | null;
	height?: number | null;
	isHidden?: boolean;
	isFavorite?: boolean;
	folderId: string;
}

/**
 * Input para actualizar un video existente
 */
export interface UpdateVideoInput {
	name?: string;
	description?: string | null;
	path?: string;
	size?: number;
	duration?: number;
	width?: number | null;
	height?: number | null;
	isHidden?: boolean;
	isFavorite?: boolean;
	folderId?: string;
}

/**
 * Filtros para búsqueda de videos
 */
export interface VideoFilters {
	folderId?: string;
	isFavorite?: boolean;
	isHidden?: boolean;
	minDuration?: number;
	maxDuration?: number;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	minSize?: number;
	maxSize?: number;
	search?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'name' | 'size' | 'duration' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
}

/**
 * Video básico (sin relaciones)
 */
export interface Video {
	id: string;
	name: string;
	description: string | null;
	path: string;
	hash: string;
	size: number;
	duration: number;
	width: number | null;
	height: number | null;
	metadata: string | null;
	thumbnail: string | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	isFavorite: boolean;
	isHidden: boolean;
	folderId: string;
	createdAt: Date;
	updatedAt: Date | null;
	folder?: {
		id: string;
		name: string;
		path: string;
	} | null;
}

/**
 * Video con estadísticas de relaciones
 */
export interface VideoWithStats extends Video {
	_count: {
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

/**
 * Resultado de listado de videos (simplificado para compatibilidad con tests)
 */
export type VideosListResult = Video[];

/**
 * Estadísticas por formato de video
 */
export interface VideoFormatStats {
	format: string;
	count: number;
	sumSize: number;
	avgDuration: number;
	avgWidth: number;
	avgHeight: number;
}

/**
 * Interface del servicio de videos
 */
export interface VideoServiceInterface {
	// CRUD básico
	readonly create: (input: CreateVideoInput) => Effect.Effect<Video, VideoError>;
	readonly getById: (id: string) => Effect.Effect<Video, VideoError>;
	readonly getByIdWithStats: (id: string) => Effect.Effect<VideoWithStats, VideoError>;
	readonly getAll: (filters: VideoFilters) => Effect.Effect<VideosListResult, VideoError>;
	readonly update: (id: string, input: UpdateVideoInput) => Effect.Effect<Video, VideoError>;
	readonly deleteById: (id: string, force?: boolean) => Effect.Effect<void, VideoError>;
	readonly deleteManyByIds: (ids: string[], force?: boolean) => Effect.Effect<number, VideoError>;

	// Queries especializadas
	readonly getByHash: (hash: string) => Effect.Effect<Video | null, VideoError>;
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<Video | null, VideoError>;
	readonly getAllFavorites: (filters: Omit<VideoFilters, 'isFavorite'>) => Effect.Effect<VideosListResult, VideoError>;
	readonly getByFolder: (
		folderId: string,
		filters: Omit<VideoFilters, 'folderId'>
	) => Effect.Effect<VideosListResult, VideoError>;
	readonly countByFolder: (folderId: string) => Effect.Effect<number, VideoError>;

	// Operaciones de toggle/batch
	readonly toggleFavorite: (id: string) => Effect.Effect<Video, VideoError>;
	readonly setFavoriteMany: (ids: string[], isFavorite: boolean) => Effect.Effect<number, VideoError>;

	// Operaciones específicas de video
	readonly getFormatStats: () => Effect.Effect<VideoFormatStats[], VideoError>;
}

/**
 * Tag del servicio de videos para inyección de dependencias
 */
export class VideoService extends Context.Tag('VideoService')<VideoService, VideoServiceInterface>() {}

// =================================================================================
// HELPERS INTERNOS
// =================================================================================

/**
 * Convierte errores desconocidos a VideoError
 */
function toVideoError(error: unknown, operation: string): VideoError {
	videoServiceLogger.error(`Error en operación ${operation}:`, error);

	// Si ya es un VideoError, retornarlo directamente
	if (error && typeof error === 'object' && '_tag' in error) {
		return error as VideoError;
	}

	// Error de Drizzle
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		// Errores de constraint
		if (message.includes('unique') || message.includes('constraint')) {
			if (message.includes('hash')) {
				return videoHashConflict('unknown', 'unknown');
			}
			if (message.includes('path')) {
				return videoDatabaseError(operation, `Path duplicado: ${error.message}`, error);
			}
		}

		// Errores de FK
		if (message.includes('foreign key') || message.includes('folderId')) {
			return videoDatabaseError(operation, `Error de relación: ${error.message}`, error);
		}

		return videoDatabaseError(operation, error.message, error);
	}

	// Error desconocido
	return videoUnknownError(operation, String(error), error);
}

/**
 * Validaciones comunes de input
 */
function validateVideoInput(input: CreateVideoInput | UpdateVideoInput, isUpdate = false): void {
	if ('size' in input && input.size !== undefined && input.size < 0) {
		throw videoValidationError('size', input.size, 'El tamaño no puede ser negativo');
	}

	if ('size' in input && input.size !== undefined && input.size > 107_374_182_400) {
		throw videoValidationError('size', input.size, 'El tamaño no puede exceder 100GB');
	}

	if ('duration' in input && input.duration !== undefined && input.duration < 0) {
		throw videoValidationError('duration', input.duration, 'La duración no puede ser negativa');
	}

	if ('duration' in input && input.duration !== undefined && input.duration > 86_400) {
		throw videoValidationError('duration', input.duration, 'La duración no puede exceder 24 horas');
	}

	if ('hash' in input && input.hash !== undefined && input.hash.length !== 64) {
		throw videoValidationError('hash', input.hash, 'El hash debe tener exactamente 64 caracteres');
	}

	if ('path' in input && input.path !== undefined && (input.path.length < 1 || input.path.length > 1000)) {
		throw videoValidationError('path', input.path, 'El path debe tener entre 1 y 1000 caracteres');
	}

	if (!isUpdate) {
		const createInput = input as CreateVideoInput;
		if (!createInput.name || createInput.name.trim().length === 0) {
			throw videoValidationError('name', createInput.name, 'El nombre es requerido');
		}
		if (!createInput.path || createInput.path.trim().length === 0) {
			throw videoValidationError('path', createInput.path, 'El path es requerido');
		}
		if (!createInput.hash || createInput.hash.trim().length === 0) {
			throw videoValidationError('hash', createInput.hash, 'El hash es requerido');
		}
	}
}

// =================================================================================
// IMPLEMENTACIÓN DEL SERVICIO
// =================================================================================

/**
 * Implementación del servicio de videos
 */
const make = (): VideoServiceInterface => {
	// -------------------------------------------------------------------------------
	// CREATE
	// -------------------------------------------------------------------------------
	const create = (input: CreateVideoInput): Effect.Effect<Video, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Creando nuevo video:', input.name);

			// Validar input
			try {
				validateVideoInput(input);
			} catch (error) {
				return yield* Effect.fail(error as VideoError);
			}

			// Verificar si existe video con mismo hash
			const existingVideo = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select({ id: videos.id }).from(videos).where(eq(videos.hash, input.hash)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toVideoError(error, 'create:checkHash'),
			});

			if (existingVideo) {
				return yield* Effect.fail(videoHashConflict(input.hash, existingVideo.id));
			}

			// Crear video
			const result = yield* Effect.tryPromise({
				try: async () => {
					const inserted = await db
						.insert(videos)
						.values({
							id: crypto.randomUUID(),
							name: input.name,
							description: input.description ?? null,
							path: input.path,
							size: input.size,
							hash: input.hash,
							duration: input.duration,
							width: input.width ?? null,
							height: input.height ?? null,
							metadata: null,
							thumbnail: null,
							thumbnailSize: null,
							thumbnailWidth: null,
							thumbnailHeight: null,
							isHidden: input.isHidden ?? false,
							isFavorite: input.isFavorite ?? false,
							folderId: input.folderId,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning();
					return inserted[0];
				},
				catch: (error) => toVideoError(error, 'create:insert'),
			});

			if (!result) {
				return yield* Effect.fail(videoDatabaseError('create', 'No se pudo crear el video', new Error('Empty result')));
			}

			videoServiceLogger.info('Video creado exitosamente:', result.id);
			return result;
		});

	// -------------------------------------------------------------------------------
	// GET BY ID
	// -------------------------------------------------------------------------------
	const getById = (id: string): Effect.Effect<Video, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Obteniendo video por ID:', id);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({
							id: videos.id,
							name: videos.name,
							description: videos.description,
							path: videos.path,
							hash: videos.hash,
							size: videos.size,
							duration: videos.duration,
							width: videos.width,
							height: videos.height,
							metadata: videos.metadata,
							thumbnail: videos.thumbnail,
							thumbnailSize: videos.thumbnailSize,
							thumbnailWidth: videos.thumbnailWidth,
							thumbnailHeight: videos.thumbnailHeight,
							isFavorite: videos.isFavorite,
							isHidden: videos.isHidden,
							folderId: videos.folderId,
							createdAt: videos.createdAt,
							updatedAt: videos.updatedAt,
							folder: {
								id: folders.id,
								name: folders.name,
								path: folders.path,
							},
						})
						.from(videos)
						.leftJoin(folders, eq(videos.folderId, folders.id))
						.where(eq(videos.id, id))
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toVideoError(error, 'getById'),
			});

			if (!result) {
				return yield* Effect.fail(videoNotFound(id, `Video con ID ${id} no encontrado`));
			}

			return result;
		});

	// -------------------------------------------------------------------------------
	// GET BY ID WITH STATS
	// -------------------------------------------------------------------------------
	const getByIdWithStats = (id: string): Effect.Effect<VideoWithStats, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Obteniendo video con estadísticas:', id);

			const video = yield* getById(id);

			// TODO: Implementar conteos reales cuando las relaciones estén disponibles
			const videoWithStats: VideoWithStats = {
				...video,
				_count: {
					albums: 0,
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
				},
			};

			return videoWithStats;
		});

	// -------------------------------------------------------------------------------
	// GET ALL
	// -------------------------------------------------------------------------------
	const getAll = (filters: VideoFilters): Effect.Effect<VideosListResult, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Obteniendo lista de videos con filtros:', filters);

			const conditions = [];

			// Construir condiciones WHERE
			if (filters.folderId) {
				conditions.push(eq(videos.folderId, filters.folderId));
			}
			if (filters.isFavorite !== undefined) {
				conditions.push(eq(videos.isFavorite, filters.isFavorite));
			}
			if (filters.isHidden !== undefined) {
				conditions.push(eq(videos.isHidden, filters.isHidden));
			}
			if (filters.minDuration) {
				conditions.push(gte(videos.duration, filters.minDuration));
			}
			if (filters.maxDuration) {
				conditions.push(lte(videos.duration, filters.maxDuration));
			}
			if (filters.minWidth && videos.width) {
				conditions.push(gte(videos.width, filters.minWidth));
			}
			if (filters.maxWidth && videos.width) {
				conditions.push(lte(videos.width, filters.maxWidth));
			}
			if (filters.minHeight && videos.height) {
				conditions.push(gte(videos.height, filters.minHeight));
			}
			if (filters.maxHeight && videos.height) {
				conditions.push(lte(videos.height, filters.maxHeight));
			}
			if (filters.minSize) {
				conditions.push(gte(videos.size, filters.minSize));
			}
			if (filters.maxSize) {
				conditions.push(lte(videos.size, filters.maxSize));
			}

			// Búsqueda por texto
			if (filters.search) {
				conditions.push(or(like(videos.name, `%${filters.search}%`), like(videos.description, `%${filters.search}%`)));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			// Determinar orden
			const sortBy = (filters.sortBy as keyof typeof videos.$inferSelect) || 'name';
			const orderByClause = filters.sortOrder === 'desc' ? desc(videos[sortBy] as any) : asc(videos[sortBy] as any);

			// Ejecutar consultas en paralelo
			const [videoResults, totalCount] = yield* Effect.tryPromise({
				try: () =>
					Promise.all([
						db
							.select({
								id: videos.id,
								name: videos.name,
								description: videos.description,
								path: videos.path,
								hash: videos.hash,
								size: videos.size,
								duration: videos.duration,
								width: videos.width,
								height: videos.height,
								metadata: videos.metadata,
								thumbnail: videos.thumbnail,
								thumbnailSize: videos.thumbnailSize,
								thumbnailWidth: videos.thumbnailWidth,
								thumbnailHeight: videos.thumbnailHeight,
								isFavorite: videos.isFavorite,
								isHidden: videos.isHidden,
								folderId: videos.folderId,
								createdAt: videos.createdAt,
								updatedAt: videos.updatedAt,
								folder: {
									id: folders.id,
									name: folders.name,
									path: folders.path,
								},
							})
							.from(videos)
							.leftJoin(folders, eq(videos.folderId, folders.id))
							.where(whereClause)
							.orderBy(orderByClause)
							.limit(filters.limit || 20)
							.offset(filters.offset || 0),

						db
							.select({ count: count() })
							.from(videos)
							.where(whereClause)
							.then((result: any) => result[0]?.count || 0),
					]),
				catch: (error) => toVideoError(error, 'getAll'),
			});

			// Retornar solo el array de videos (simplificado)
			return videoResults;
		});

	// -------------------------------------------------------------------------------
	// UPDATE
	// -------------------------------------------------------------------------------
	const update = (id: string, input: UpdateVideoInput): Effect.Effect<Video, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Actualizando video:', id);

			// Validar input
			try {
				validateVideoInput(input, true);
			} catch (error) {
				return yield* Effect.fail(error as VideoError);
			}

			// Verificar que el video existe
			yield* getById(id);

			// Actualizar video
			const result = yield* Effect.tryPromise({
				try: async () => {
					const updated = await db
						.update(videos)
						.set({
							...input,
							updatedAt: new Date(),
						})
						.where(eq(videos.id, id))
						.returning();
					return updated[0];
				},
				catch: (error) => toVideoError(error, 'update'),
			});

			if (!result) {
				return yield* Effect.fail(
					videoDatabaseError('update', 'No se pudo actualizar el video', new Error('Empty result'))
				);
			}

			videoServiceLogger.info('Video actualizado exitosamente:', result.id);
			return result;
		});

	// -------------------------------------------------------------------------------
	// DELETE BY ID
	// -------------------------------------------------------------------------------
	const deleteById = (id: string, force = false): Effect.Effect<void, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Eliminando video:', id, force ? '[FORCE]' : '');

			// Verificar que el video existe
			yield* getById(id);

			// TODO: Verificar relaciones cuando estén implementadas
			// Si no es force y tiene relaciones, fallar con VideoHasRelationsError

			// Eliminar video
			yield* Effect.tryPromise({
				try: () => db.delete(videos).where(eq(videos.id, id)),
				catch: (error) => toVideoError(error, 'deleteById'),
			});

			videoServiceLogger.info('Video eliminado exitosamente:', id);
		});

	// -------------------------------------------------------------------------------
	// DELETE MANY BY IDS
	// -------------------------------------------------------------------------------
	const deleteManyByIds = (ids: string[], force = false): Effect.Effect<number, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Eliminando múltiples videos:', ids.length, force ? '[FORCE]' : '');

			if (ids.length === 0) {
				return 0;
			}

			// TODO: Verificar relaciones cuando estén implementadas

			// Eliminar videos
			const deletedRows = yield* Effect.tryPromise({
				try: async () => {
					const deleted = await db
						.delete(videos)
						.where(or(...ids.map((id) => eq(videos.id, id))))
						.returning({ id: videos.id });
					return deleted;
				},
				catch: (error) => toVideoError(error, 'deleteManyByIds'),
			});

			const deletedCount = deletedRows.length;
			videoServiceLogger.info('Videos eliminados exitosamente:', deletedCount);
			return deletedCount;
		});

	// -------------------------------------------------------------------------------
	// GET BY HASH
	// -------------------------------------------------------------------------------
	const getByHash = (hash: string): Effect.Effect<Video | null, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Buscando video por hash:', hash);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({
							id: videos.id,
							name: videos.name,
							description: videos.description,
							path: videos.path,
							hash: videos.hash,
							size: videos.size,
							duration: videos.duration,
							width: videos.width,
							height: videos.height,
							metadata: videos.metadata,
							thumbnail: videos.thumbnail,
							thumbnailSize: videos.thumbnailSize,
							thumbnailWidth: videos.thumbnailWidth,
							thumbnailHeight: videos.thumbnailHeight,
							isFavorite: videos.isFavorite,
							isHidden: videos.isHidden,
							folderId: videos.folderId,
							createdAt: videos.createdAt,
							updatedAt: videos.updatedAt,
							folder: {
								id: folders.id,
								name: folders.name,
								path: folders.path,
							},
						})
						.from(videos)
						.leftJoin(folders, eq(videos.folderId, folders.id))
						.where(eq(videos.hash, hash))
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toVideoError(error, 'getByHash'),
			});

			return result;
		});

	// -------------------------------------------------------------------------------
	// GET BY PATH AND FOLDER
	// -------------------------------------------------------------------------------
	const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<Video | null, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Buscando video por path y folder:', { path, folderId });

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({
							id: videos.id,
							name: videos.name,
							description: videos.description,
							path: videos.path,
							hash: videos.hash,
							size: videos.size,
							duration: videos.duration,
							width: videos.width,
							height: videos.height,
							metadata: videos.metadata,
							thumbnail: videos.thumbnail,
							thumbnailSize: videos.thumbnailSize,
							thumbnailWidth: videos.thumbnailWidth,
							thumbnailHeight: videos.thumbnailHeight,
							isFavorite: videos.isFavorite,
							isHidden: videos.isHidden,
							folderId: videos.folderId,
							createdAt: videos.createdAt,
							updatedAt: videos.updatedAt,
							folder: {
								id: folders.id,
								name: folders.name,
								path: folders.path,
							},
						})
						.from(videos)
						.leftJoin(folders, eq(videos.folderId, folders.id))
						.where(and(eq(videos.path, path), eq(videos.folderId, folderId)))
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toVideoError(error, 'getByPathAndFolder'),
			});

			return result;
		});

	// -------------------------------------------------------------------------------
	// GET ALL FAVORITES
	// -------------------------------------------------------------------------------
	const getAllFavorites = (filters: Omit<VideoFilters, 'isFavorite'>): Effect.Effect<VideosListResult, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Obteniendo videos favoritos');
			return yield* getAll({ ...filters, isFavorite: true });
		});

	// -------------------------------------------------------------------------------
	// GET BY FOLDER
	// -------------------------------------------------------------------------------
	const getByFolder = (
		folderId: string,
		filters: Omit<VideoFilters, 'folderId'>
	): Effect.Effect<VideosListResult, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Obteniendo videos de carpeta:', folderId);
			return yield* getAll({ ...filters, folderId });
		});

	// -------------------------------------------------------------------------------
	// COUNT BY FOLDER
	// -------------------------------------------------------------------------------
	const countByFolder = (folderId: string): Effect.Effect<number, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Contando videos en carpeta:', folderId);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select({ count: count() }).from(videos).where(eq(videos.folderId, folderId));
					return (rows[0]?.count as number) || 0;
				},
				catch: (error) => toVideoError(error, 'countByFolder'),
			});

			return result;
		});

	// -------------------------------------------------------------------------------
	// TOGGLE FAVORITE
	// -------------------------------------------------------------------------------
	const toggleFavorite = (id: string): Effect.Effect<Video, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Toggleando favorito para video:', id);

			// Obtener video actual
			const video = yield* getById(id);

			// Actualizar favorito
			return yield* update(id, { isFavorite: !video.isFavorite });
		});

	// -------------------------------------------------------------------------------
	// SET FAVORITE MANY
	// -------------------------------------------------------------------------------
	const setFavoriteMany = (ids: string[], isFavorite: boolean): Effect.Effect<number, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info(
				'Estableciendo favorito para múltiples videos:',
				ids.length,
				isFavorite ? '[FAV]' : '[UNFAV]'
			);

			if (ids.length === 0) {
				return 0;
			}

			const result = yield* Effect.tryPromise({
				try: async () => {
					const updated = await db
						.update(videos)
						.set({ isFavorite, updatedAt: new Date() })
						.where(or(...ids.map((id) => eq(videos.id, id))))
						.returning({ id: videos.id });
					return updated;
				},
				catch: (error) => toVideoError(error, 'setFavoriteMany'),
			});

			const updatedCount = result.length;
			videoServiceLogger.info('Videos actualizados exitosamente:', updatedCount);
			return updatedCount;
		});

	// -------------------------------------------------------------------------------
	// GET FORMAT STATS
	// -------------------------------------------------------------------------------
	const getFormatStats = (): Effect.Effect<VideoFormatStats[], VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Obteniendo estadísticas de formato');

			const allVideos = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({
							size: videos.size,
							duration: videos.duration,
							width: videos.width,
							height: videos.height,
						})
						.from(videos);
					return rows;
				},
				catch: (error) => toVideoError(error, 'getFormatStats'),
			});

			if (allVideos.length === 0) {
				return [];
			}

			// Estadísticas generales para todos los videos
			const totalCount = allVideos.length;
			const totalSize = allVideos.reduce((sum: number, video: { size: number }) => sum + (video.size || 0), 0);
			const validDurations = allVideos.filter((v: { duration: number }) => v.duration && v.duration > 0);
			const avgDuration =
				validDurations.length > 0
					? validDurations.reduce((sum: number, v: { duration: number }) => sum + (v.duration ?? 0), 0) /
						validDurations.length
					: 0;

			const validSizes = allVideos.filter((v: { width: number | null; height: number | null }) => v.width && v.height);
			const avgWidth =
				validSizes.length > 0
					? validSizes.reduce((sum: number, v: { width: number | null }) => sum + (v.width ?? 0), 0) / validSizes.length
					: 0;
			const avgHeight =
				validSizes.length > 0
					? validSizes.reduce((sum: number, v: { height: number | null }) => sum + (v.height ?? 0), 0) /
						validSizes.length
					: 0;

			return [
				{
					format: 'all',
					count: totalCount,
					sumSize: totalSize,
					avgDuration,
					avgWidth,
					avgHeight,
				},
			];
		});

	// -------------------------------------------------------------------------------
	// RETURN SERVICE INTERFACE
	// -------------------------------------------------------------------------------
	return {
		create,
		getById,
		getByIdWithStats,
		getAll,
		update,
		deleteById,
		deleteManyByIds,
		getByHash,
		getByPathAndFolder,
		getAllFavorites,
		getByFolder,
		countByFolder,
		toggleFavorite,
		setFavoriteMany,
		getFormatStats,
	};
};

// =================================================================================
// SERVICE LAYER
// =================================================================================

/**
 * Layer del servicio de videos
 */
export const VideoServiceLive = Layer.succeed(VideoService, make());

// =================================================================================
// EXPORTED OPERATIONS (for testing and direct use)
// =================================================================================

/**
 * Crear un nuevo video
 */
export const create = (input: CreateVideoInput): Effect.Effect<Video, VideoError> => make().create(input);

/**
 * Obtener video por ID
 */
export const getById = (id: string): Effect.Effect<Video, VideoError> => make().getById(id);

/**
 * Obtener video por ID con estadísticas
 */
export const getByIdWithStats = (id: string): Effect.Effect<VideoWithStats, VideoError> => make().getByIdWithStats(id);

/**
 * Obtener todos los videos con filtros
 */
export const getAll = (filters: VideoFilters = {}): Effect.Effect<VideosListResult, VideoError> =>
	make().getAll(filters);

/**
 * Actualizar un video
 */
export const update = (id: string, input: UpdateVideoInput): Effect.Effect<Video, VideoError> =>
	make().update(id, input);

/**
 * Eliminar un video por ID
 */
export const deleteById = (id: string, force = false): Effect.Effect<void, VideoError> => make().deleteById(id, force);

/**
 * Eliminar múltiples videos por IDs
 */
export const deleteManyByIds = (ids: string[], force = false): Effect.Effect<number, VideoError> =>
	make().deleteManyByIds(ids, force);

/**
 * Obtener video por hash
 */
export const getByHash = (hash: string): Effect.Effect<Video | null, VideoError> => make().getByHash(hash);

/**
 * Obtener video por path y folder
 */
export const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<Video | null, VideoError> =>
	make().getByPathAndFolder(path, folderId);

/**
 * Obtener todos los videos favoritos
 */
export const getAllFavorites = (
	filters: Omit<VideoFilters, 'isFavorite'> = {}
): Effect.Effect<VideosListResult, VideoError> => make().getAllFavorites(filters);

/**
 * Obtener videos por folder
 */
export const getByFolder = (
	folderId: string,
	filters: Omit<VideoFilters, 'folderId'> = {}
): Effect.Effect<VideosListResult, VideoError> => make().getByFolder(folderId, filters);

/**
 * Contar videos por folder
 */
export const countByFolder = (folderId: string): Effect.Effect<number, VideoError> => make().countByFolder(folderId);

/**
 * Toggle estado favorito
 */
export const toggleFavorite = (id: string): Effect.Effect<Video, VideoError> => make().toggleFavorite(id);

/**
 * Marcar múltiples videos como favoritos o no favoritos
 */
export const setFavoriteMany = (ids: string[], isFavorite: boolean): Effect.Effect<number, VideoError> =>
	make().setFavoriteMany(ids, isFavorite);

/**
 * Obtener estadísticas por formato
 */
export const getFormatStats = (): Effect.Effect<VideoFormatStats[], VideoError> => make().getFormatStats();
