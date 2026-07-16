/**
 * @file AudioService con Effect-TS
 * @module services/audio/audio.service.effect
 * @description Servicio de Audio usando Effect-TS para manejo funcional de errores
 * @created 2025-01-10 - Phase 6.3: Audio Service Migration
 */

import { and, asc, count, desc, eq, gte, inArray, lte, notInArray, or, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { isPathInsideDirectory } from '@/lib/filesystem/path-containment';
import { audios, folders } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger';
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
	updateCanonicalMediaProjection,
	visibleAssetLifecycleCondition,
} from '@/services/media-core/canonical-media-persistence';
import { FavoriteEntityType } from '@/types/entities/favorite';
import type {
	AudioBase,
	AudioCreateInput,
	AudioUpdateInput,
	AudioWithStats,
	CanonicalAudioProjection,
} from '@/types/entities/audio';
import type { AudioError } from './audio-errors.effect';
import * as AudioErrors from './audio-errors.effect';

const audioServiceLogger = serverLogger.withContext('AudioService.Effect');

// =================================================================================
// TYPES
// =================================================================================

/**
 * Audio con folder incluido (LEFT JOIN)
 */
export type Audio = AudioBase &
	CanonicalAudioProjection & {
		folder?: {
			id: string;
			name: string;
			path: string;
		} | null;
	};

/**
 * Filtros para consultas de audio
 */
export interface AudioFilters {
	album?: string;
	artist?: string;
	folderId?: string;
	format?: string;
	genre?: string;
	isArchived?: boolean;
	isFavorite?: boolean;
	limit?: number;
	maxBitrate?: number;
	maxDuration?: number;
	maxSize?: number;
	minBitrate?: number;
	minDuration?: number;
	minSize?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'duration' | 'bitrate';
	sortOrder?: 'asc' | 'desc';
}

export function resolveAudioListOrder(filters: Pick<AudioFilters, 'sortBy' | 'sortOrder'>): {
	sortColumn: NonNullable<AudioFilters['sortBy']>;
	sortDirection: NonNullable<AudioFilters['sortOrder']>;
} {
	return {
		sortColumn: filters.sortBy ?? 'createdAt',
		sortDirection: filters.sortOrder ?? 'desc',
	};
}

/**
 * Resultado de listado de audios (simplificado para compatibilidad con tests)
 */
export type AudiosListResult = Audio[];

/**
 * Estadísticas por formato de audio
 */
export interface AudioFormatStats {
	avgBitrate: number;
	avgDuration: number;
	avgSampleRate: number;
	count: number;
	format: string;
	sumSize: number;
}

/**
 * Interface del servicio de audios
 */
export interface AudioServiceInterface {
	readonly countByFolder: (folderId: string) => Effect.Effect<number, AudioError>;
	// CRUD básico
	readonly create: (input: AudioCreateInput) => Effect.Effect<Audio, AudioError>;
	readonly deleteById: (id: string, force?: boolean) => Effect.Effect<void, AudioError>;
	readonly deleteManyByIds: (ids: string[], force?: boolean) => Effect.Effect<number, AudioError>;
	readonly getAll: (filters: AudioFilters) => Effect.Effect<AudiosListResult, AudioError>;
	readonly getAllFavorites: (filters: Omit<AudioFilters, 'isFavorite'>) => Effect.Effect<AudiosListResult, AudioError>;
	readonly getByFolder: (
		folderId: string,
		filters: Omit<AudioFilters, 'folderId'>
	) => Effect.Effect<AudiosListResult, AudioError>;

	// Queries especializadas
	readonly getByHash: (hash: string) => Effect.Effect<Audio | null, AudioError>;
	readonly getByHashCandidates: (hash: string) => Effect.Effect<Audio[], AudioError>;
	readonly getById: (id: string) => Effect.Effect<Audio, AudioError>;
	readonly getByIdWithStats: (id: string) => Effect.Effect<AudioWithStats, AudioError>;
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<Audio | null, AudioError>;
	readonly restoreById: (id: string) => Effect.Effect<Audio, AudioError>;

	// Operaciones específicas de audio
	readonly getFormatStats: () => Effect.Effect<AudioFormatStats[], AudioError>;
	readonly setFavoriteMany: (ids: string[], isFavorite: boolean) => Effect.Effect<number, AudioError>;

	// Operaciones de toggle/batch
	readonly toggleFavorite: (id: string) => Effect.Effect<Audio, AudioError>;
	readonly update: (id: string, input: AudioUpdateInput) => Effect.Effect<Audio, AudioError>;
}

/**
 * Tag del servicio de audios para inyección de dependencias
 */
export class AudioService extends Context.Tag('AudioService')<AudioService, AudioServiceInterface>() {}

// =================================================================================
// HELPERS INTERNOS
// =================================================================================

/**
 * Convierte errores desconocidos a AudioError
 */
function toAudioError(error: unknown, operation: string): AudioError {
	audioServiceLogger.error(`Error en operación ${operation}:`, error);

	// Si ya es un AudioError, retornarlo directamente
	if (error && typeof error === 'object' && '_tag' in error) {
		return error as AudioError;
	}

	// Error de base de datos
	if (error instanceof Error) {
		return AudioErrors.audioDatabaseError(operation, error.message, error);
	}

	// Error desconocido
	return AudioErrors.audioUnknownError(operation, String(error), error);
}

/**
 * Valida entrada de audio antes de crear/actualizar
 */
function validateAudioInput(
	input: Partial<AudioCreateInput>,
	operation: 'create' | 'update'
): Effect.Effect<void, AudioError> {
	return Effect.gen(function* () {
		// Validar size (máximo 10GB = 10_737_418_240 bytes)
		if (input.size !== undefined && input.size > 10_737_418_240) {
			return yield* Effect.fail(AudioErrors.audioValidationError('size', input.size, 'Size must be <= 10GB'));
		}

		// Validar duration (máximo 24h = 86400 segundos)
		if (input.duration !== undefined && input.duration !== null && input.duration > 86_400) {
			return yield* Effect.fail(
				AudioErrors.audioValidationError('duration', input.duration, 'Duration must be <= 24 hours')
			);
		}

		// Validar hash (debe tener 64 caracteres para SHA-256)
		if (input.hash !== undefined && !/^[0-9a-f]{64}$/.test(input.hash)) {
			return yield* Effect.fail(
				AudioErrors.audioValidationError('hash', input.hash, 'Hash must be a lowercase SHA-256 value')
			);
		}

		// Validar path (no puede estar vacío y debe tener entre 1 y 1000 caracteres)
		if (operation === 'create' && (!input.path || input.path.length === 0 || input.path.length > 1000)) {
			return yield* Effect.fail(
				AudioErrors.audioValidationError('path', input.path, 'Path must be between 1 and 1000 characters')
			);
		}
	});
}

// =================================================================================
// SERVICE IMPLEMENTATION
// =================================================================================

/**
 * Crea la implementación del servicio de audios
 */
const make = (): AudioServiceInterface => {
	// -------------------------------------------------------------------------------
	// CREATE
	// -------------------------------------------------------------------------------
	const create = (input: AudioCreateInput): Effect.Effect<Audio, AudioError> =>
		Effect.gen(function* () {
			yield* validateAudioInput(input, 'create');
			try {
				assertCanonicalMediaCreateCommand({
					assetType: 'audio',
					folderId: input.folderId,
					hash: input.hash,
					name: input.name,
					path: input.path,
					size: input.size,
					source: input.source,
				});
			} catch (error) {
				return yield* Effect.fail(AudioErrors.audioValidationError('source', input.source, String(error)));
			}

			audioServiceLogger.info('Creando nuevo audio:', input.name);

			const requestedIsFavorite = input.isFavorite ?? false;
			const { isFavorite: _requestedIsFavorite, source: _source, ...persistenceInput } = input;

			// Crear el audio y su favorito canónico como una sola unidad de escritura.
			let committedFavoriteProfileId: string | null = null;
			const newAudio = yield* Effect.tryPromise({
				try: () =>
					createCanonicalMedia(
						{
							assetType: 'audio',
							folderId: input.folderId,
							hash: input.hash,
							name: input.name,
							path: input.path,
							size: input.size,
							source: input.source,
						},
						async ({ assetId, now, transaction }) => {
							const [created] = await transaction
								.insert(audios)
								.values({
									id: assetId,
									assetId,
									...persistenceInput,
									isFavorite: false,
									createdAt: now,
									updatedAt: now,
								})
								.returning();
							if (created && requestedIsFavorite) {
								committedFavoriteProfileId = await setFavoriteForActiveProfile(
									transaction,
									FavoriteEntityType.AUDIO,
									created.id,
									true
								);
							}
							return created;
						}
					),
				catch: (error) => toAudioError(error, 'create'),
			});

			if (committedFavoriteProfileId) {
				yield* Effect.promise(() =>
					emitCommittedFavoriteChange(committedFavoriteProfileId!, FavoriteEntityType.AUDIO, newAudio.id, true)
				);
			}

			audioServiceLogger.info('Audio creado exitosamente:', newAudio.id);
			return yield* getById(newAudio.id);
		});

	// -------------------------------------------------------------------------------
	// GET BY ID
	// -------------------------------------------------------------------------------
	const getById = (id: string): Effect.Effect<Audio, AudioError> =>
		Effect.gen(function* () {
			audioServiceLogger.info('Obteniendo audio por ID:', id);

			const audio = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({
							assetId: audios.assetId,
							id: audios.id,
							name: audios.name,
							path: audios.path,
							size: audios.size,
							hash: audios.hash,
							mimeType: audios.mimeType,
							extension: audios.extension,
							folderId: audios.folderId,
							isFavorite: audios.isFavorite,
							isArchived: audios.isArchived,
							duration: audios.duration,
							bitrate: audios.bitrate,
							sampleRate: audios.sampleRate,
							channels: audios.channels,
							format: audios.format,
							codec: audios.codec,
							title: audios.title,
							artist: audios.artist,
							album: audios.album,
							year: audios.year,
							genre: audios.genre,
							track: audios.track,
							disc: audios.disc,
							albumArtist: audios.albumArtist,
							composer: audios.composer,
							comment: audios.comment,
							lyrics: audios.lyrics,
							bpm: audios.bpm,
							key: audios.key,
							mood: audios.mood,
							description: sql<string | null>`NULL`,
							createdAt: audios.createdAt,
							updatedAt: audios.updatedAt,
							folder: {
								id: folders.id,
								name: folders.name,
								path: folders.path,
							},
						})
						.from(audios)
						.leftJoin(folders, eq(audios.folderId, folders.id))
						.where(eq(audios.id, id))
						.limit(1);

					return rows[0] || null;
				},
				catch: (error) => toAudioError(error, 'getById'),
			});

			const projected = audio
				? yield* Effect.tryPromise({
						try: () => projectCanonicalMediaRow(audio, 'audio'),
						catch: (error) => toAudioError(error, 'getById.canonicalProjection'),
					})
				: null;

			if (!projected) {
				return yield* Effect.fail(AudioErrors.audioNotFound(id));
			}

			return yield* Effect.tryPromise({
				try: () => favoriteService.projectEntity(FavoriteEntityType.AUDIO, projected as Audio),
				catch: (error) => toAudioError(error, 'getById.favoriteProjection'),
			});
		});

	// -------------------------------------------------------------------------------
	// GET BY ID WITH STATS
	// -------------------------------------------------------------------------------
	const getByIdWithStats = (id: string): Effect.Effect<AudioWithStats, AudioError> =>
		Effect.gen(function* () {
			const audio = yield* getById(id);

			// Mock _count y stats completos para compatibilidad (en producción esto vendría de queries reales)
			const audioWithStats: AudioWithStats = {
				...audio,
				entityType: 'audio',
				stats: {
					// Audio-specific stats
					duration: audio.duration || 0,
					format: audio.format || 'unknown',
					bitrate: audio.bitrate || 0,
					volumePeaks: [],
					sampleRate: audio.sampleRate || 0,
					channels: audio.channels || 0,
					isDirectory: false,
					isFile: true,
					// File stats
					size: audio.size,
					mtime: audio.updatedAt,
					birthtime: audio.createdAt,
					type: 'file' as const,
					// EntityStats fields
					imageCount: 0,
					videoCount: 0,
					albumCount: 0,
					collectionCount: 0,
					tagCount: 0,
					characterCount: 0,
					placeCount: 0,
					worldItemCount: 0,
					conceptCount: 0,
					promptCount: 0,
					noteCount: 0,
					wildcardCount: 0,
					propertyCount: 0,
					groupCount: 0,
					totalItems: 0,
					totalAssociations: 0,
					lastUpdated: new Date(),
				},
				_count: {
					tags: 0,
					albums: 0,
					characters: 0,
					collections: 0,
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

			return audioWithStats;
		});

	// -------------------------------------------------------------------------------
	// GET ALL
	// -------------------------------------------------------------------------------
	const getAll = (filters: AudioFilters): Effect.Effect<AudiosListResult, AudioError> =>
		Effect.gen(function* () {
			audioServiceLogger.info('Obteniendo lista de audios con filtros:', filters);

			const favoriteEntityIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.AUDIO),
				catch: (error) => toAudioError(error, 'getAll:favoriteIds'),
			});

			const conditions = [visibleAssetLifecycleCondition(audios.assetId)];

			// Construir condiciones WHERE
			if (filters.folderId) conditions.push(eq(audios.folderId, filters.folderId));
			if (filters.isFavorite !== undefined) {
				if (filters.isFavorite) {
					if (favoriteEntityIds.length === 0) {
						return [];
					}

					conditions.push(inArray(audios.id, favoriteEntityIds));
				} else if (favoriteEntityIds.length > 0) {
					conditions.push(notInArray(audios.id, favoriteEntityIds));
				}
			}
			if (filters.isArchived !== undefined) conditions.push(eq(audios.isArchived, filters.isArchived));
			if (filters.format) conditions.push(eq(audios.format, filters.format));
			if (filters.genre) conditions.push(eq(audios.genre, filters.genre));
			if (filters.artist) conditions.push(eq(audios.artist, filters.artist));
			if (filters.album) conditions.push(eq(audios.album, filters.album));
			if (filters.minDuration !== undefined) conditions.push(gte(audios.duration, filters.minDuration));
			if (filters.maxDuration !== undefined) conditions.push(lte(audios.duration, filters.maxDuration));
			if (filters.minSize !== undefined) conditions.push(gte(audios.size, filters.minSize));
			if (filters.maxSize !== undefined) conditions.push(lte(audios.size, filters.maxSize));
			if (filters.minBitrate !== undefined) conditions.push(gte(audios.bitrate, filters.minBitrate));
			if (filters.maxBitrate !== undefined) conditions.push(lte(audios.bitrate, filters.maxBitrate));
			if (filters.search) {
				conditions.push(
					or(
						sql`${audios.name} LIKE ${`%${filters.search}%`}`,
						sql`${audios.title} LIKE ${`%${filters.search}%`}`,
						sql`${audios.artist} LIKE ${`%${filters.search}%`}`,
						sql`${audios.album} LIKE ${`%${filters.search}%`}`
					)
				);
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			// Construir ORDER BY
			const { sortColumn, sortDirection } = resolveAudioListOrder(filters);

			const orderByClause =
				sortColumn === 'name'
					? sortDirection === 'asc'
						? audios.name
						: desc(audios.name)
					: sortColumn === 'size'
						? sortDirection === 'asc'
							? audios.size
							: desc(audios.size)
						: sortColumn === 'duration'
							? sortDirection === 'asc'
								? audios.duration
								: desc(audios.duration)
							: sortColumn === 'bitrate'
								? sortDirection === 'asc'
									? audios.bitrate
									: desc(audios.bitrate)
								: sortColumn === 'updatedAt'
									? sortDirection === 'asc'
										? audios.updatedAt
										: desc(audios.updatedAt)
									: sortDirection === 'asc'
										? audios.createdAt
										: desc(audios.createdAt);

			const audioResults = yield* Effect.tryPromise({
				try: async () => {
					const query = db
						.select({
							assetId: audios.assetId,
							id: audios.id,
							name: audios.name,
							path: audios.path,
							size: audios.size,
							hash: audios.hash,
							mimeType: audios.mimeType,
							extension: audios.extension,
							folderId: audios.folderId,
							isFavorite: audios.isFavorite,
							isArchived: audios.isArchived,
							duration: audios.duration,
							bitrate: audios.bitrate,
							sampleRate: audios.sampleRate,
							channels: audios.channels,
							format: audios.format,
							codec: audios.codec,
							title: audios.title,
							artist: audios.artist,
							album: audios.album,
							year: audios.year,
							genre: audios.genre,
							track: audios.track,
							disc: audios.disc,
							albumArtist: audios.albumArtist,
							composer: audios.composer,
							comment: audios.comment,
							lyrics: audios.lyrics,
							bpm: audios.bpm,
							key: audios.key,
							mood: audios.mood,
							description: sql<string | null>`NULL`,
							createdAt: audios.createdAt,
							updatedAt: audios.updatedAt,
							folder: {
								id: folders.id,
								name: folders.name,
								path: folders.path,
							},
						})
						.from(audios)
						.leftJoin(folders, eq(audios.folderId, folders.id));

					if (whereClause) {
						query.where(whereClause);
					}

					const tieBreakOrder = sortDirection === 'desc' ? desc(audios.id) : asc(audios.id);
					return await query
						.orderBy(orderByClause, tieBreakOrder)
						.limit(filters.limit || 20)
						.offset(filters.offset || 0);
				},
				catch: (error) => toAudioError(error, 'getAll'),
			});

			const projectedResults = yield* Effect.tryPromise<AudiosListResult, AudioError>({
				try: async () => (await projectCanonicalMediaRows(audioResults, 'audio')) as AudiosListResult,
				catch: (error) => toAudioError(error, 'getAll.canonicalProjection'),
			});

			return favoriteService.applyFavoriteProjectionMany(projectedResults, favoriteEntityIds) as Audio[];
		});

	// -------------------------------------------------------------------------------
	// UPDATE
	// -------------------------------------------------------------------------------
	const update = (id: string, input: AudioUpdateInput): Effect.Effect<Audio, AudioError> =>
		Effect.gen(function* () {
			yield* validateAudioInput(input, 'update');

			audioServiceLogger.info('Actualizando audio:', id);

			// Verificar que existe y exigir una source autorizada para mover una fila enlazada.
			const current = yield* getById(id);
			if (current.assetId && (input.path !== undefined || input.folderId !== undefined) && !input.source) {
				return yield* Effect.fail(
					AudioErrors.audioValidationError(
						'source',
						input.source,
						'Mover un Audio canónico requiere una source autorizada'
					)
				);
			}
			if (current.assetId && input.source) {
				try {
					assertCanonicalMediaCreateCommand({
						assetType: 'audio',
						folderId: input.folderId ?? current.folderId,
						hash: input.hash ?? current.hash,
						name: input.name ?? current.name,
						path: input.path ?? current.path,
						size: input.size ?? current.size,
						source: input.source,
					});
				} catch (error) {
					return yield* Effect.fail(AudioErrors.audioValidationError('source', input.source, String(error)));
				}
			}

			const requestedIsFavorite = input.isFavorite;

			const { isFavorite: _ignoredIsFavorite, source, ...restInput } = input;

			// Actualizar entidad y favorito dentro de la misma transacción.
			const favoriteWrite = yield* Effect.tryPromise({
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
						await transaction
							.update(audios)
							.set({
								...restInput,
								updatedAt: new Date(),
							})
							.where(eq(audios.id, id));
						if (current.assetId) {
							await updateCanonicalMediaProjection(
								{
									assetId: current.assetId,
									folderId: input.folderId,
									hash: input.hash,
									name: input.name,
									size: input.size,
									source,
								},
								transaction as typeof db
							);
						}
						if (requestedIsFavorite !== undefined) {
							return setFavoriteStateForActiveProfile(transaction, FavoriteEntityType.AUDIO, id, requestedIsFavorite);
						}
						return null;
					});
				},
				catch: (error) => toAudioError(error, 'update'),
			});
			if (favoriteWrite?.changed && requestedIsFavorite !== undefined) {
				yield* Effect.promise(() =>
					emitCommittedFavoriteChange(favoriteWrite.profileId, FavoriteEntityType.AUDIO, id, requestedIsFavorite)
				);
			}

			audioServiceLogger.info('Audio actualizado exitosamente:', id);
			return yield* getById(id);
		});

	// -------------------------------------------------------------------------------
	// DELETE BY ID
	// -------------------------------------------------------------------------------
	const deleteById = (id: string, force = false): Effect.Effect<void, AudioError> =>
		Effect.gen(function* () {
			audioServiceLogger.info('Eliminando audio:', id, force ? '[FORCE]' : '');

			const [current] = yield* Effect.tryPromise<Array<{ assetId: string | null }>, AudioError>({
				try: () => db.select({ assetId: audios.assetId }).from(audios).where(eq(audios.id, id)).limit(1),
				catch: (error) => toAudioError(error, 'deleteById.lookup'),
			});
			if (!current) return yield* Effect.fail(AudioErrors.audioNotFound(id));
			if (current.assetId) {
				yield* Effect.tryPromise({
					try: () => tombstoneCanonicalAsset(current.assetId!),
					catch: (error) => toAudioError(error, 'deleteById.tombstone'),
				});
				return;
			}

			// TODO: Si force=false, verificar relaciones primero
			// Por ahora solo eliminamos directamente

			yield* Effect.tryPromise({
				try: async () => {
					await db.transaction(async (transaction: FavoriteWriteTransaction) => {
						await deleteFavoriteRecordsForEntities(transaction, FavoriteEntityType.AUDIO, [id]);
						await transaction.delete(audios).where(eq(audios.id, id));
					});
				},
				catch: (error) => toAudioError(error, 'deleteById'),
			});

			audioServiceLogger.info('Audio eliminado exitosamente:', id);
		});

	// -------------------------------------------------------------------------------
	// DELETE MANY BY IDS
	// -------------------------------------------------------------------------------
	const deleteManyByIds = (ids: string[], force = false): Effect.Effect<number, AudioError> =>
		Effect.gen(function* () {
			if (ids.length === 0) {
				return 0;
			}

			audioServiceLogger.info('Eliminando múltiples audios:', ids.length, force ? '[FORCE]' : '');

			// TODO: Si force=false, verificar relaciones primero

			const targets = yield* Effect.tryPromise<Array<{ assetId: string | null; id: string }>, AudioError>({
				try: () => db.select({ assetId: audios.assetId, id: audios.id }).from(audios).where(inArray(audios.id, ids)),
				catch: (error) => toAudioError(error, 'deleteManyByIds.lookup'),
			});
			const canonicalIds = targets.flatMap((target) => (target.assetId ? [target.assetId] : []));
			const legacyIds = targets.flatMap((target) => (target.assetId ? [] : [target.id]));

			const deletedCount = yield* Effect.tryPromise({
				try: async () => {
					return db.transaction(async (transaction: FavoriteWriteTransaction) => {
						await tombstoneCanonicalAssets(canonicalIds, transaction as typeof db);
						if (legacyIds.length > 0) {
							await deleteFavoriteRecordsForEntities(transaction, FavoriteEntityType.AUDIO, legacyIds);
							await transaction.delete(audios).where(inArray(audios.id, legacyIds));
						}
						return targets.length;
					});
				},
				catch: (error) => toAudioError(error, 'deleteManyByIds'),
			});

			audioServiceLogger.info('Audios eliminados exitosamente:', deletedCount);
			return deletedCount;
		});

	const restoreById = (id: string): Effect.Effect<Audio, AudioError> =>
		Effect.gen(function* () {
			const [current] = yield* Effect.tryPromise<Array<{ assetId: string | null }>, AudioError>({
				try: () => db.select({ assetId: audios.assetId }).from(audios).where(eq(audios.id, id)).limit(1),
				catch: (error) => toAudioError(error, 'restoreById.lookup'),
			});
			if (!current?.assetId) return yield* Effect.fail(AudioErrors.audioNotFound(id));
			yield* Effect.tryPromise({
				try: () => restoreCanonicalAsset(current.assetId!),
				catch: (error) => toAudioError(error, 'restoreById'),
			});
			return yield* getById(id);
		});

	// -------------------------------------------------------------------------------
	// GET BY HASH
	// -------------------------------------------------------------------------------
	const getByHashCandidates = (hash: string): Effect.Effect<Audio[], AudioError> =>
		Effect.gen(function* () {
			audioServiceLogger.info('Buscando candidatos de audio por hash:', hash);

			const audio = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({
							assetId: audios.assetId,
							id: audios.id,
							name: audios.name,
							path: audios.path,
							size: audios.size,
							hash: audios.hash,
							mimeType: audios.mimeType,
							extension: audios.extension,
							folderId: audios.folderId,
							isFavorite: audios.isFavorite,
							isArchived: audios.isArchived,
							duration: audios.duration,
							bitrate: audios.bitrate,
							sampleRate: audios.sampleRate,
							channels: audios.channels,
							format: audios.format,
							codec: audios.codec,
							title: audios.title,
							artist: audios.artist,
							album: audios.album,
							year: audios.year,
							genre: audios.genre,
							track: audios.track,
							disc: audios.disc,
							albumArtist: audios.albumArtist,
							composer: audios.composer,
							comment: audios.comment,
							lyrics: audios.lyrics,
							bpm: audios.bpm,
							key: audios.key,
							mood: audios.mood,
							description: sql<string | null>`NULL`,
							createdAt: audios.createdAt,
							updatedAt: audios.updatedAt,
							folder: {
								id: folders.id,
								name: folders.name,
								path: folders.path,
							},
						})
						.from(audios)
						.leftJoin(folders, eq(audios.folderId, folders.id))
						.where(and(eq(audios.hash, hash), visibleAssetLifecycleCondition(audios.assetId)))
						.orderBy(asc(audios.createdAt), asc(audios.id));

					return rows;
				},
				catch: (error) => toAudioError(error, 'getByHashCandidates'),
			});

			const projected = yield* Effect.tryPromise({
				try: () => projectCanonicalMediaRows(audio, 'audio'),
				catch: (error) => toAudioError(error, 'getByHashCandidates.canonicalProjection'),
			});
			if (projected.length === 0) return [];
			return yield* Effect.tryPromise({
				try: () =>
					Promise.all(
						projected.map((candidate) => favoriteService.projectEntity(FavoriteEntityType.AUDIO, candidate as Audio))
					),
				catch: (error) => toAudioError(error, 'getByHashCandidates.favoriteProjection'),
			});
		});
	const getByHash = (hash: string): Effect.Effect<Audio | null, AudioError> =>
		getByHashCandidates(hash).pipe(Effect.map((candidates) => candidates[0] ?? null));

	// -------------------------------------------------------------------------------
	// GET BY PATH AND FOLDER
	// -------------------------------------------------------------------------------
	const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<Audio | null, AudioError> =>
		Effect.gen(function* () {
			audioServiceLogger.info('Buscando audio por path y folder:', path, folderId);

			const audio = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({
							assetId: audios.assetId,
							id: audios.id,
							name: audios.name,
							path: audios.path,
							size: audios.size,
							hash: audios.hash,
							mimeType: audios.mimeType,
							extension: audios.extension,
							folderId: audios.folderId,
							isFavorite: audios.isFavorite,
							isArchived: audios.isArchived,
							duration: audios.duration,
							bitrate: audios.bitrate,
							sampleRate: audios.sampleRate,
							channels: audios.channels,
							format: audios.format,
							codec: audios.codec,
							title: audios.title,
							artist: audios.artist,
							album: audios.album,
							year: audios.year,
							genre: audios.genre,
							track: audios.track,
							disc: audios.disc,
							albumArtist: audios.albumArtist,
							composer: audios.composer,
							comment: audios.comment,
							lyrics: audios.lyrics,
							bpm: audios.bpm,
							key: audios.key,
							mood: audios.mood,
							description: sql<string | null>`NULL`,
							createdAt: audios.createdAt,
							updatedAt: audios.updatedAt,
							folder: {
								id: folders.id,
								name: folders.name,
								path: folders.path,
							},
						})
						.from(audios)
						.leftJoin(folders, eq(audios.folderId, folders.id))
						.where(
							and(eq(audios.path, path), eq(audios.folderId, folderId), visibleAssetLifecycleCondition(audios.assetId))
						)
						.limit(1);

					return rows[0] || null;
				},
				catch: (error) => toAudioError(error, 'getByPathAndFolder'),
			});

			const projected = audio
				? yield* Effect.tryPromise({
						try: () => projectCanonicalMediaRow(audio, 'audio'),
						catch: (error) => toAudioError(error, 'getByPathAndFolder.canonicalProjection'),
					})
				: null;
			if (!projected) return null;
			return yield* Effect.tryPromise({
				try: () => favoriteService.projectEntity(FavoriteEntityType.AUDIO, projected as Audio),
				catch: (error) => toAudioError(error, 'getByPathAndFolder.favoriteProjection'),
			});
		});

	// -------------------------------------------------------------------------------
	// GET ALL FAVORITES
	// -------------------------------------------------------------------------------
	const getAllFavorites = (filters: Omit<AudioFilters, 'isFavorite'>): Effect.Effect<AudiosListResult, AudioError> =>
		Effect.gen(function* () {
			return yield* getAll({ ...filters, isFavorite: true });
		});

	// -------------------------------------------------------------------------------
	// GET BY FOLDER
	// -------------------------------------------------------------------------------
	const getByFolder = (
		folderId: string,
		filters: Omit<AudioFilters, 'folderId'>
	): Effect.Effect<AudiosListResult, AudioError> =>
		Effect.gen(function* () {
			return yield* getAll({ ...filters, folderId });
		});

	// -------------------------------------------------------------------------------
	// COUNT BY FOLDER
	// -------------------------------------------------------------------------------
	const countByFolder = (folderId: string): Effect.Effect<number, AudioError> =>
		Effect.gen(function* () {
			audioServiceLogger.info('Contando audios en folder:', folderId);

			const result = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({ count: count() })
						.from(audios)
						.where(and(eq(audios.folderId, folderId), visibleAssetLifecycleCondition(audios.assetId)));
					return rows[0]?.count || 0;
				},
				catch: (error) => toAudioError(error, 'countByFolder'),
			});

			return result;
		});

	// -------------------------------------------------------------------------------
	// TOGGLE FAVORITE
	// -------------------------------------------------------------------------------
	const toggleFavorite = (id: string): Effect.Effect<Audio, AudioError> =>
		Effect.gen(function* () {
			audioServiceLogger.info('Toggling favorite para audio:', id);

			// Obtener estado actual
			yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIdsOrThrow(FavoriteEntityType.AUDIO),
				catch: (error) => toAudioError(error, 'toggleFavorite.favoriteScope'),
			});
			const currentFavoriteStatus = favoriteEntityIds.includes(id);
			const newFavoriteStatus = !currentFavoriteStatus;

			yield* Effect.tryPromise({
				try: () => favoriteService.set(FavoriteEntityType.AUDIO, id, newFavoriteStatus),
				catch: (error) => toAudioError(error, 'toggleFavorite.favorite'),
			});

			const updated = yield* getById(id);

			audioServiceLogger.info(`Favorite toggled: ${id}, nuevo estado: ${updated.isFavorite}`);
			return updated;
		});

	// -------------------------------------------------------------------------------
	// SET FAVORITE MANY
	// -------------------------------------------------------------------------------
	const setFavoriteMany = (ids: string[], isFavorite: boolean): Effect.Effect<number, AudioError> =>
		Effect.gen(function* () {
			if (ids.length === 0) {
				return 0;
			}

			audioServiceLogger.info(`Marcando múltiples audios como favoritos: ${ids.length}, isFavorite=${isFavorite}`);

			const updatedCount = yield* Effect.tryPromise({
				try: () => favoriteService.setMany(FavoriteEntityType.AUDIO, ids, isFavorite),
				catch: (error) => toAudioError(error, 'setFavoriteMany.favorite'),
			});

			audioServiceLogger.info('Audios actualizados exitosamente:', updatedCount);
			return updatedCount;
		});

	// -------------------------------------------------------------------------------
	// GET FORMAT STATS
	// -------------------------------------------------------------------------------
	const getFormatStats = (): Effect.Effect<AudioFormatStats[], AudioError> =>
		Effect.gen(function* () {
			audioServiceLogger.info('Obteniendo estadísticas de formato');

			const allAudios = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({
							size: audios.size,
							duration: audios.duration,
							bitrate: audios.bitrate,
							sampleRate: audios.sampleRate,
						})
						.from(audios)
						.where(visibleAssetLifecycleCondition(audios.assetId));
					return rows;
				},
				catch: (error) => toAudioError(error, 'getFormatStats'),
			});

			if (allAudios.length === 0) {
				return [];
			}

			// Estadísticas generales para todos los audios
			const totalCount = allAudios.length;
			const totalSize = allAudios.reduce((sum: number, audio: { size: number }) => sum + (audio.size || 0), 0);
			const validDurations = allAudios.filter((v: { duration: number | null }) => v.duration && v.duration > 0);
			const avgDuration =
				validDurations.length > 0
					? validDurations.reduce((sum: number, v: { duration: number | null }) => sum + (v.duration ?? 0), 0) /
						validDurations.length
					: 0;

			const validBitrates = allAudios.filter((v: { bitrate: number | null }) => v.bitrate && v.bitrate > 0);
			const avgBitrate =
				validBitrates.length > 0
					? validBitrates.reduce((sum: number, v: { bitrate: number | null }) => sum + (v.bitrate ?? 0), 0) /
						validBitrates.length
					: 0;

			const validSampleRates = allAudios.filter((v: { sampleRate: number | null }) => v.sampleRate && v.sampleRate > 0);
			const avgSampleRate =
				validSampleRates.length > 0
					? validSampleRates.reduce((sum: number, v: { sampleRate: number | null }) => sum + (v.sampleRate ?? 0), 0) /
						validSampleRates.length
					: 0;

			return [
				{
					format: 'all',
					count: totalCount,
					sumSize: totalSize,
					avgDuration,
					avgBitrate,
					avgSampleRate,
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
	};
};

// =================================================================================
// SERVICE LAYER
// =================================================================================

/**
 * Layer del servicio de audios
 */
export const AudioServiceLive = Layer.succeed(AudioService, make());

// =================================================================================
// EXPORTED OPERATIONS (for testing and direct use)
// =================================================================================

/**
 * Crear un nuevo audio
 */
export const create = (input: AudioCreateInput): Effect.Effect<Audio, AudioError> => make().create(input);

/**
 * Obtener audio por ID
 */
export const getById = (id: string): Effect.Effect<Audio, AudioError> => make().getById(id);

/**
 * Obtener audio por ID con estadísticas
 */
export const getByIdWithStats = (id: string): Effect.Effect<AudioWithStats, AudioError> => make().getByIdWithStats(id);

/**
 * Obtener todos los audios con filtros
 */
export const getAll = (filters: AudioFilters = {}): Effect.Effect<AudiosListResult, AudioError> =>
	make().getAll(filters);

/**
 * Actualizar un audio
 */
export const update = (id: string, input: AudioUpdateInput): Effect.Effect<Audio, AudioError> =>
	make().update(id, input);

/**
 * Eliminar un audio por ID
 */
export const deleteById = (id: string, force = false): Effect.Effect<void, AudioError> => make().deleteById(id, force);

/**
 * Eliminar múltiples audios por IDs
 */
export const deleteManyByIds = (ids: string[], force = false): Effect.Effect<number, AudioError> =>
	make().deleteManyByIds(ids, force);

/** Restaurar un Audio canónico desde su tombstone. */
export const restoreById = (id: string): Effect.Effect<Audio, AudioError> => make().restoreById(id);

/**
 * Obtener audio por hash
 */
export const getByHash = (hash: string): Effect.Effect<Audio | null, AudioError> => make().getByHash(hash);

/**
 * Obtener audio por path y folder
 */
export const getByPathAndFolder = (path: string, folderId: string): Effect.Effect<Audio | null, AudioError> =>
	make().getByPathAndFolder(path, folderId);

/**
 * Obtener todos los audios favoritos
 */
export const getAllFavorites = (
	filters: Omit<AudioFilters, 'isFavorite'> = {}
): Effect.Effect<AudiosListResult, AudioError> => make().getAllFavorites(filters);

/**
 * Obtener audios por folder
 */
export const getByFolder = (
	folderId: string,
	filters: Omit<AudioFilters, 'folderId'> = {}
): Effect.Effect<AudiosListResult, AudioError> => make().getByFolder(folderId, filters);

/**
 * Contar audios por folder
 */
export const countByFolder = (folderId: string): Effect.Effect<number, AudioError> => make().countByFolder(folderId);

/**
 * Toggle estado favorito
 */
export const toggleFavorite = (id: string): Effect.Effect<Audio, AudioError> => make().toggleFavorite(id);

/**
 * Marcar múltiples audios como favoritos o no favoritos
 */
export const setFavoriteMany = (ids: string[], isFavorite: boolean): Effect.Effect<number, AudioError> =>
	make().setFavoriteMany(ids, isFavorite);

/**
 * Obtener estadísticas por formato
 */
export const getFormatStats = (): Effect.Effect<AudioFormatStats[], AudioError> => make().getFormatStats();
