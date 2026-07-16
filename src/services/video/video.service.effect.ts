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

import { and, asc, count, desc, eq, gte, inArray, like, lte, notInArray, or } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { isPathInsideDirectory } from '@/lib/filesystem/path-containment';
import {
	assets,
	folders,
	groupVideos,
	videoAlbums,
	videoCharacters,
	videoCollections,
	videoConcepts,
	videoNotes,
	videoPlaces,
	videoPrompts,
	videoProperties,
	videos,
	videoTags,
	videoWildcards,
	videoWorldItems,
	sourceFiles,
} from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import {
	deleteFavoriteRecordsForEntities,
	emitCommittedFavoriteChange,
	setFavoriteForActiveProfile,
	setFavoriteStateForActiveProfile,
} from '@/services/favorite/favorite-write-transaction';
import type { FavoriteWriteTransaction } from '@/services/favorite/favorite-write-transaction';
import {
	assertCanonicalMediaCreateCommand,
	createCanonicalMedia,
	projectCanonicalMediaRow,
	projectCanonicalMediaRows,
	restoreCanonicalAsset,
	tombstoneCanonicalAsset,
	tombstoneCanonicalAssets,
	updateCanonicalAssetTitle,
	visibleAssetLifecycleCondition,
	type CanonicalMediaSourceInput,
	type CanonicalMediaState,
} from '@/services/media-core/canonical-media-persistence';
import { FavoriteEntityType } from '@/types/entities/favorite';
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
	description?: string | null;
	duration: number;
	folderId: string;
	hash: string;
	height?: number | null;
	isFavorite?: boolean;
	isHidden?: boolean;
	name: string;
	path: string;
	size: number;
	source: CanonicalMediaSourceInput;
	width?: number | null;
}

/**
 * Input para actualizar un video existente
 */
export interface UpdateVideoInput {
	description?: string | null;
	duration?: number;
	folderId?: string;
	height?: number | null;
	isFavorite?: boolean;
	isHidden?: boolean;
	name?: string;
	path?: string;
	size?: number;
	source?: CanonicalMediaSourceInput;
	width?: number | null;
}

/**
 * Filtros para búsqueda de videos
 */
export interface VideoFilters {
	folderId?: string;
	isFavorite?: boolean;
	isHidden?: boolean;
	limit?: number;
	maxDuration?: number;
	maxHeight?: number;
	maxSize?: number;
	maxWidth?: number;
	minDuration?: number;
	minHeight?: number;
	minSize?: number;
	minWidth?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'size' | 'duration' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
}

/**
 * Video básico (sin relaciones)
 */
export interface Video {
	assetId: string | null;
	canonicalDivergences: string[];
	canonicalState: CanonicalMediaState;
	createdAt: Date;
	description: string | null;
	duration: number;
	folder?: {
		id: string;
		name: string;
		path: string;
	} | null;
	folderId: string;
	hash: string;
	height: number | null;
	id: string;
	isFavorite: boolean;
	isHidden: boolean;
	legacyId: string;
	metadata: string | null;
	name: string;
	path: string;
	size: number;
	thumbnail: string | null;
	thumbnailHeight: number | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	updatedAt: Date | null;
	width: number | null;
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
	avgDuration: number;
	avgHeight: number;
	avgWidth: number;
	count: number;
	format: string;
	sumSize: number;
}

/**
 * Interface del servicio de videos
 */
export interface VideoServiceInterface {
	readonly countByFolder: (folderId: string) => Effect.Effect<number, VideoError>;
	// CRUD básico
	readonly create: (input: CreateVideoInput) => Effect.Effect<Video, VideoError>;
	readonly deleteById: (id: string, force?: boolean) => Effect.Effect<void, VideoError>;
	readonly deleteManyByIds: (ids: string[], force?: boolean) => Effect.Effect<number, VideoError>;
	readonly getAll: (filters: VideoFilters) => Effect.Effect<VideosListResult, VideoError>;
	readonly getAllFavorites: (filters: Omit<VideoFilters, 'isFavorite'>) => Effect.Effect<VideosListResult, VideoError>;
	readonly getByFolder: (
		folderId: string,
		filters: Omit<VideoFilters, 'folderId'>
	) => Effect.Effect<VideosListResult, VideoError>;

	// Queries especializadas
	readonly getByHash: (hash: string) => Effect.Effect<Video | null, VideoError>;
	readonly getByHashCandidates: (hash: string) => Effect.Effect<Video[], VideoError>;
	readonly getById: (id: string) => Effect.Effect<Video, VideoError>;
	readonly getByIdWithStats: (id: string) => Effect.Effect<VideoWithStats, VideoError>;
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<Video | null, VideoError>;
	readonly restoreById: (id: string) => Effect.Effect<Video, VideoError>;

	// Operaciones específicas de video
	readonly getFormatStats: () => Effect.Effect<VideoFormatStats[], VideoError>;

	// Thumbnails
	readonly getThumbnail: (
		id: string,
		time?: number,
		width?: number,
		height?: number
	) => Effect.Effect<Buffer, VideoError>;
	readonly setFavoriteMany: (ids: string[], isFavorite: boolean) => Effect.Effect<number, VideoError>;

	// Operaciones de toggle/batch
	readonly toggleFavorite: (id: string) => Effect.Effect<Video, VideoError>;
	readonly update: (id: string, input: UpdateVideoInput) => Effect.Effect<Video, VideoError>;
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
				if (!input.source) throw videoValidationError('source', input.source, 'La source autorizada es requerida');
				assertCanonicalMediaCreateCommand({
					assetType: 'video',
					folderId: input.folderId,
					hash: input.hash,
					name: input.name,
					path: input.path,
					size: input.size,
					source: input.source,
				});
			} catch (error) {
				return yield* Effect.fail(
					error && typeof error === 'object' && '_tag' in error
						? (error as VideoError)
						: videoValidationError('source', input.source, String(error))
				);
			}

			const requestedIsFavorite = input.isFavorite ?? false;

			// Crear Asset, SourceFile, Video y favorito canónico como una sola unidad de escritura.
			let committedFavoriteProfileId: string | null = null;
			const result = yield* Effect.tryPromise({
				try: () =>
					createCanonicalMedia(
						{
							assetType: 'video',
							folderId: input.folderId,
							hash: input.hash,
							name: input.name,
							path: input.path,
							size: input.size,
							source: input.source,
						},
						async ({ assetId, now, transaction }) => {
							const inserted = await transaction
								.insert(videos)
								.values({
									id: assetId,
									assetId,
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
									isFavorite: false,
									isHidden: input.isHidden ?? false,
									folderId: input.folderId,
									createdAt: now,
									updatedAt: now,
								})
								.returning();
							const created = inserted[0];
							if (created && requestedIsFavorite) {
								committedFavoriteProfileId = await setFavoriteForActiveProfile(
									transaction,
									FavoriteEntityType.VIDEO,
									created.id,
									true
								);
							}
							return created;
						}
					),
				catch: (error) => toVideoError(error, 'create:insert'),
			});

			if (!result) {
				return yield* Effect.fail(videoDatabaseError('create', 'No se pudo crear el video', new Error('Empty result')));
			}

			if (committedFavoriteProfileId) {
				yield* Effect.promise(() =>
					emitCommittedFavoriteChange(committedFavoriteProfileId!, FavoriteEntityType.VIDEO, result.id, true)
				);
			}

			videoServiceLogger.info('Video creado exitosamente:', result.id);
			return yield* getById(result.id);
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
							assetId: videos.assetId,
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

			const projected = result
				? yield* Effect.tryPromise({
						try: () => projectCanonicalMediaRow(result, 'video'),
						catch: (error) => toVideoError(error, 'getById.canonicalProjection'),
					})
				: null;

			if (!projected) {
				return yield* Effect.fail(videoNotFound(id, `Video con ID ${id} no encontrado`));
			}

			return yield* Effect.tryPromise({
				try: () => favoriteService.projectEntity(FavoriteEntityType.VIDEO, projected),
				catch: (error) => toVideoError(error, 'getById.favoriteProjection'),
			});
		});

	// -------------------------------------------------------------------------------
	// GET BY ID WITH STATS
	// -------------------------------------------------------------------------------
	const getByIdWithStats = (id: string): Effect.Effect<VideoWithStats, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Obteniendo video con estadísticas:', id);

			const video = yield* getById(id);

			// Obtener conteos reales de todas las relaciones
			const counts = yield* Effect.tryPromise({
				try: async () => {
					const [
						albumsCount,
						collectionsCount,
						tagsCount,
						charactersCount,
						placesCount,
						worldItemsCount,
						conceptsCount,
						promptsCount,
						notesCount,
						wildcardsCount,
						propertiesCount,
						groupsCount,
					] = await Promise.all([
						db.select({ count: count() }).from(videoAlbums).where(eq(videoAlbums.A, id)),
						db.select({ count: count() }).from(videoCollections).where(eq(videoCollections.A, id)),
						db.select({ count: count() }).from(videoTags).where(eq(videoTags.A, id)),
						db.select({ count: count() }).from(videoCharacters).where(eq(videoCharacters.A, id)),
						db.select({ count: count() }).from(videoPlaces).where(eq(videoPlaces.A, id)),
						db.select({ count: count() }).from(videoWorldItems).where(eq(videoWorldItems.A, id)),
						db.select({ count: count() }).from(videoConcepts).where(eq(videoConcepts.A, id)),
						db.select({ count: count() }).from(videoPrompts).where(eq(videoPrompts.A, id)),
						db.select({ count: count() }).from(videoNotes).where(eq(videoNotes.A, id)),
						db.select({ count: count() }).from(videoWildcards).where(eq(videoWildcards.A, id)),
						db.select({ count: count() }).from(videoProperties).where(eq(videoProperties.A, id)),
						db.select({ count: count() }).from(groupVideos).where(eq(groupVideos.B, id)),
					]);

					return {
						albums: albumsCount[0]?.count ?? 0,
						collections: collectionsCount[0]?.count ?? 0,
						tags: tagsCount[0]?.count ?? 0,
						characters: charactersCount[0]?.count ?? 0,
						places: placesCount[0]?.count ?? 0,
						worldItems: worldItemsCount[0]?.count ?? 0,
						concepts: conceptsCount[0]?.count ?? 0,
						prompts: promptsCount[0]?.count ?? 0,
						notes: notesCount[0]?.count ?? 0,
						wildcards: wildcardsCount[0]?.count ?? 0,
						properties: propertiesCount[0]?.count ?? 0,
						groups: groupsCount[0]?.count ?? 0,
					};
				},
				catch: (error) => toVideoError(error, 'getByIdWithStats:counts'),
			});

			const videoWithStats: VideoWithStats = {
				...video,
				_count: counts,
			};

			return videoWithStats;
		});

	// -------------------------------------------------------------------------------
	// GET ALL
	// -------------------------------------------------------------------------------
	const getAll = (filters: VideoFilters): Effect.Effect<VideosListResult, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Obteniendo lista de videos con filtros:', filters);

			const favoriteEntityIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.VIDEO),
				catch: (error) => toVideoError(error, 'getAll:favoriteIds'),
			});

			const conditions = [visibleAssetLifecycleCondition(videos.assetId)];

			// Construir condiciones WHERE
			if (filters.folderId) {
				conditions.push(eq(videos.folderId, filters.folderId));
			}
			if (filters.isFavorite !== undefined) {
				if (filters.isFavorite) {
					if (favoriteEntityIds.length === 0) {
						return [];
					}

					conditions.push(inArray(videos.id, favoriteEntityIds));
				} else if (favoriteEntityIds.length > 0) {
					conditions.push(notInArray(videos.id, favoriteEntityIds));
				}
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
			const tieBreakOrder = filters.sortOrder === 'desc' ? desc(videos.id) : asc(videos.id);

			// Ejecutar consultas en paralelo
			const [videoResults, totalCount] = yield* Effect.tryPromise({
				try: () =>
					Promise.all([
						db
							.select({
								assetId: videos.assetId,
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
							.orderBy(orderByClause, tieBreakOrder)
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

			const projectedResults = yield* Effect.tryPromise<VideosListResult, VideoError>({
				try: async () => (await projectCanonicalMediaRows(videoResults, 'video')) as VideosListResult,
				catch: (error) => toVideoError(error, 'getAll.canonicalProjection'),
			});
			return favoriteService.applyFavoriteProjectionMany(projectedResults, favoriteEntityIds);
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
			const current = yield* getById(id);
			if (current.assetId && (input.path !== undefined || input.folderId !== undefined) && !input.source) {
				return yield* Effect.fail(
					videoValidationError('source', input.source, 'Mover un Video canónico requiere una source autorizada')
				);
			}
			if (current.assetId && input.source) {
				try {
					assertCanonicalMediaCreateCommand({
						assetType: 'video',
						folderId: input.folderId ?? current.folderId,
						hash: current.hash,
						name: input.name ?? current.name,
						path: input.path ?? current.path,
						size: input.size ?? current.size,
						source: input.source,
					});
				} catch (error) {
					return yield* Effect.fail(videoValidationError('source', input.source, String(error)));
				}
			}

			const requestedIsFavorite = input.isFavorite;

			const { isFavorite: _ignoredIsFavorite, source, ...restInput } = input;

			// Actualizar video y favorito dentro de la misma transacción.
			const committed = yield* Effect.tryPromise({
				try: async () => {
					return db.transaction(async (transaction: FavoriteWriteTransaction) => {
						if (current.assetId && source) {
							const targetFolderId = input.folderId ?? current.folderId;
							const targetPath = input.path ?? current.path;
							const [targetFolder] = await transaction
								.select({ path: folders.path })
								.from(folders)
								.where(eq(folders.id, targetFolderId))
								.limit(1);
							if (!targetFolder || !isPathInsideDirectory(targetFolder.path, targetPath)) {
								throw new Error('La ubicación física no pertenece al Folder declarado.');
							}
						}
						const updated = await transaction
							.update(videos)
							.set({
								...restInput,
								updatedAt: new Date(),
							})
							.where(eq(videos.id, id))
							.returning();
						const entity = updated[0];
						if (entity && current.assetId) {
							if (input.name !== undefined) {
								await updateCanonicalAssetTitle(current.assetId, input.name, transaction as typeof db);
							}
							if (source || input.size !== undefined || input.folderId !== undefined) {
								const [asset] = await transaction
									.select({ primarySourceFileId: assets.primarySourceFileId })
									.from(assets)
									.where(eq(assets.id, current.assetId))
									.limit(1);
								if (!asset) throw new Error('Asset canónico de Video no encontrado.');
								const sourceUpdated = await transaction
									.update(sourceFiles)
									.set({
										...(input.size !== undefined ? { byteSize: input.size } : {}),
										...(input.folderId !== undefined ? { folderId: input.folderId } : {}),
										...(source ? { relativePath: source.relativePath, rootId: source.rootId } : {}),
										availability: 'available',
										observedAt: new Date(),
										updatedAt: new Date(),
									})
									.where(and(eq(sourceFiles.id, asset.primarySourceFileId), eq(sourceFiles.assetId, current.assetId)))
									.returning({ id: sourceFiles.id });
								if (sourceUpdated.length !== 1) throw new Error('SourceFile canónico de Video no encontrado.');
							}
						}
						const favoriteWrite =
							entity && requestedIsFavorite !== undefined
								? await setFavoriteStateForActiveProfile(transaction, FavoriteEntityType.VIDEO, id, requestedIsFavorite)
								: null;
						return { entity, favoriteWrite };
					});
				},
				catch: (error) => toVideoError(error, 'update'),
			});

			if (!committed.entity) {
				return yield* Effect.fail(
					videoDatabaseError('update', 'No se pudo actualizar el video', new Error('Empty result'))
				);
			}
			if (committed.favoriteWrite?.changed && requestedIsFavorite !== undefined) {
				yield* Effect.promise(() =>
					emitCommittedFavoriteChange(
						committed.favoriteWrite!.profileId,
						FavoriteEntityType.VIDEO,
						id,
						requestedIsFavorite
					)
				);
			}

			videoServiceLogger.info('Video actualizado exitosamente:', committed.entity.id);
			return yield* getById(id);
		});

	// -------------------------------------------------------------------------------
	// DELETE BY ID
	// -------------------------------------------------------------------------------
	const deleteById = (id: string, force = false): Effect.Effect<void, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Eliminando video:', id, force ? '[FORCE]' : '');

			const [current] = yield* Effect.tryPromise<Array<{ assetId: string | null }>, VideoError>({
				try: () => db.select({ assetId: videos.assetId }).from(videos).where(eq(videos.id, id)).limit(1),
				catch: (error) => toVideoError(error, 'deleteById:lookup'),
			});
			if (!current) return yield* Effect.fail(videoNotFound(id, `Video con ID ${id} no encontrado`));
			if (current.assetId) {
				yield* Effect.tryPromise({
					try: () => tombstoneCanonicalAsset(current.assetId!),
					catch: (error) => toVideoError(error, 'deleteById:tombstone'),
				});
				videoServiceLogger.info('Video movido a tombstone canónico:', id);
				return;
			}

			// TODO: Verificar relaciones cuando estén implementadas
			// Si no es force y tiene relaciones, fallar con VideoHasRelationsError

			// Eliminar video
			yield* Effect.tryPromise({
				try: () =>
					db.transaction(async (transaction: FavoriteWriteTransaction) => {
						await deleteFavoriteRecordsForEntities(transaction, FavoriteEntityType.VIDEO, [id]);
						await transaction.delete(videos).where(eq(videos.id, id));
					}),
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

			const targets = yield* Effect.tryPromise<Array<{ assetId: string | null; id: string }>, VideoError>({
				try: () => db.select({ assetId: videos.assetId, id: videos.id }).from(videos).where(inArray(videos.id, ids)),
				catch: (error) => toVideoError(error, 'deleteManyByIds:lookup'),
			});
			const canonicalIds = targets.flatMap((target) => (target.assetId ? [target.assetId] : []));
			const legacyIds = targets.flatMap((target) => (target.assetId ? [] : [target.id]));

			const deletedCount = yield* Effect.tryPromise({
				try: async () => {
					return db.transaction(async (transaction: FavoriteWriteTransaction) => {
						await tombstoneCanonicalAssets(canonicalIds, transaction as typeof db);
						if (legacyIds.length > 0) {
							await deleteFavoriteRecordsForEntities(transaction, FavoriteEntityType.VIDEO, legacyIds);
							await transaction.delete(videos).where(inArray(videos.id, legacyIds));
						}
						return targets.length;
					});
				},
				catch: (error) => toVideoError(error, 'deleteManyByIds'),
			});

			videoServiceLogger.info('Videos eliminados exitosamente:', deletedCount);
			return deletedCount;
		});

	const restoreById = (id: string): Effect.Effect<Video, VideoError> =>
		Effect.gen(function* () {
			const [current] = yield* Effect.tryPromise<Array<{ assetId: string | null }>, VideoError>({
				try: () => db.select({ assetId: videos.assetId }).from(videos).where(eq(videos.id, id)).limit(1),
				catch: (error) => toVideoError(error, 'restoreById:lookup'),
			});
			if (!current?.assetId) {
				return yield* Effect.fail(videoNotFound(id, `Video canónico con ID ${id} no encontrado`));
			}
			yield* Effect.tryPromise({
				try: () => restoreCanonicalAsset(current.assetId!),
				catch: (error) => toVideoError(error, 'restoreById'),
			});
			return yield* getById(id);
		});

	// -------------------------------------------------------------------------------
	// GET BY HASH
	// -------------------------------------------------------------------------------
	const getByHashCandidates = (hash: string): Effect.Effect<Video[], VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Buscando candidatos de video por hash:', hash);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({
							assetId: videos.assetId,
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
						.where(and(eq(videos.hash, hash), visibleAssetLifecycleCondition(videos.assetId)))
						.orderBy(asc(videos.createdAt), asc(videos.id));
					return rows;
				},
				catch: (error) => toVideoError(error, 'getByHashCandidates'),
			});

			const projected = yield* Effect.tryPromise({
				try: () => projectCanonicalMediaRows(result, 'video'),
				catch: (error) => toVideoError(error, 'getByHashCandidates.canonicalProjection'),
			});
			if (projected.length === 0) return [];
			return yield* Effect.tryPromise<Video[], VideoError>({
				try: () =>
					Promise.all(
						projected.map((candidate) => favoriteService.projectEntity(FavoriteEntityType.VIDEO, candidate as Video))
					) as Promise<Video[]>,
				catch: (error) => toVideoError(error, 'getByHashCandidates.favoriteProjection'),
			});
		});
	const getByHash = (hash: string): Effect.Effect<Video | null, VideoError> =>
		getByHashCandidates(hash).pipe(Effect.map((candidates) => candidates[0] ?? null));

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
							assetId: videos.assetId,
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
						.where(
							and(eq(videos.path, path), eq(videos.folderId, folderId), visibleAssetLifecycleCondition(videos.assetId))
						)
						.limit(1);
					return rows[0] || null;
				},
				catch: (error) => toVideoError(error, 'getByPathAndFolder'),
			});

			const projected = result
				? yield* Effect.tryPromise({
						try: () => projectCanonicalMediaRow(result, 'video'),
						catch: (error) => toVideoError(error, 'getByPathAndFolder.canonicalProjection'),
					})
				: null;
			if (!projected) return null;
			return yield* Effect.tryPromise({
				try: () => favoriteService.projectEntity(FavoriteEntityType.VIDEO, projected),
				catch: (error) => toVideoError(error, 'getByPathAndFolder.favoriteProjection'),
			});
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
					const rows = await db
						.select({ count: count() })
						.from(videos)
						.where(and(eq(videos.folderId, folderId), visibleAssetLifecycleCondition(videos.assetId)));
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
			yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIdsOrThrow(FavoriteEntityType.VIDEO),
				catch: (error) => toVideoError(error, 'toggleFavorite.favoriteScope'),
			});
			const currentFavoriteStatus = favoriteEntityIds.includes(id);
			const newFavoriteStatus = !currentFavoriteStatus;

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.VIDEO, id, newFavoriteStatus),
				catch: (error) => toVideoError(error, 'toggleFavorite.favorite'),
			});

			return yield* getById(id);
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

			const updatedCount = yield* Effect.tryPromise({
				try: () => favoriteService.setMany(FavoriteEntityType.VIDEO, ids, isFavorite),
				catch: (error) => toVideoError(error, 'setFavoriteMany.favorite'),
			});
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
						.from(videos)
						.where(visibleAssetLifecycleCondition(videos.assetId));
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
	// GET THUMBNAIL
	// -------------------------------------------------------------------------------
	const getThumbnail = (
		id: string,
		time?: number,
		width?: number,
		height?: number
	): Effect.Effect<Buffer, VideoError> =>
		Effect.gen(function* () {
			videoServiceLogger.info('Generando thumbnail para video:', { id, time, width, height });

			// Obtener video
			const video = yield* getById(id);

			// Si ya tiene thumbnail en DB, devolverlo
			if (video.thumbnail) {
				try {
					const buffer = Buffer.from(video.thumbnail, 'base64');
					videoServiceLogger.info('Thumbnail encontrado en DB:', { id, size: buffer.length });
					return buffer;
				} catch (error) {
					videoServiceLogger.warn('Error decodificando thumbnail de DB, regenerando:', error);
				}
			}

			// Importar FFmpeg helper
			const { generateStaticVideoThumbnailFFmpeg } = yield* Effect.tryPromise({
				try: async () => {
					const module = await import('@/lib/utils/video/ffmpeg-thumbnails');
					return module;
				},
				catch: (error) => toVideoError(error, 'getThumbnail:import'),
			});

			// Generar thumbnail con FFmpeg
			const thumbnailBuffer = yield* Effect.tryPromise({
				try: async () => {
					const buffer = await generateStaticVideoThumbnailFFmpeg(video.path, {
						time: time || 1,
						width: width || 320,
						height: height || 240,
						quality: 'medium',
					});
					if (!buffer) {
						throw new Error('No se pudo generar el thumbnail con FFmpeg');
					}
					return buffer;
				},
				catch: (error) => toVideoError(error, 'getThumbnail:generate'),
			});

			// Guardar thumbnail en DB
			yield* Effect.tryPromise({
				try: async () => {
					await db
						.update(videos)
						.set({
							thumbnail: thumbnailBuffer.toString('base64'),
							thumbnailSize: thumbnailBuffer.length,
							thumbnailWidth: width || 320,
							thumbnailHeight: height || 240,
							updatedAt: new Date(),
						})
						.where(eq(videos.id, id));
				},
				catch: (error) => toVideoError(error, 'getThumbnail:save'),
			});

			videoServiceLogger.info('Thumbnail generado y guardado:', { id, size: thumbnailBuffer.length });
			return thumbnailBuffer;
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
		restoreById,
		getByHash,
		getByHashCandidates,
		getByPathAndFolder,
		getAllFavorites,
		getByFolder,
		countByFolder,
		toggleFavorite,
		setFavoriteMany,
		getFormatStats,
		getThumbnail,
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

/** Restaurar un Video canónico desde su tombstone. */
export const restoreById = (id: string): Effect.Effect<Video, VideoError> => make().restoreById(id);

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
