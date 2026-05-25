/**
 * @file AudioService con Effect-TS
 * @module services/audio/audio.service.effect
 * @description Servicio de Audio usando Effect-TS para manejo funcional de errores
 * @created 2025-01-10 - Phase 6.3: Audio Service Migration
 */

import * as crypto from 'node:crypto';
import { and, count, desc, eq, gte, inArray, lte, notInArray, or, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import { audios, folders } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import type { AudioBase, AudioCreateInput, AudioUpdateInput, AudioWithStats } from '@/types/entities/audio';
import type { AudioError } from './audio-errors.effect';
import * as AudioErrors from './audio-errors.effect';

const audioServiceLogger = serverLogger.withContext('AudioService.Effect');

// =================================================================================
// TYPES
// =================================================================================

/**
 * Audio con folder incluido (LEFT JOIN)
 */
export type Audio = AudioBase & {
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
	readonly getById: (id: string) => Effect.Effect<Audio, AudioError>;
	readonly getByIdWithStats: (id: string) => Effect.Effect<AudioWithStats, AudioError>;
	readonly getByPathAndFolder: (path: string, folderId: string) => Effect.Effect<Audio | null, AudioError>;

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
		if (input.hash !== undefined && input.hash.length !== 64) {
			return yield* Effect.fail(
				AudioErrors.audioValidationError('hash', input.hash, 'Hash must be 64 characters long')
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

			audioServiceLogger.info('Creando nuevo audio:', input.name);

			const requestedIsFavorite = input.isFavorite ?? false;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite === true
					? yield* Effect.tryPromise({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.AUDIO)) !== null,
						catch: (error) => toAudioError(error, 'create.favoriteScope'),
					})
					: false;

			// Verificar si ya existe un audio con el mismo hash
			const existing = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db.select({ id: audios.id }).from(audios).where(eq(audios.hash, input.hash)).limit(1);
					return rows[0] || null;
				},
				catch: (error) => toAudioError(error, 'create.checkHash'),
			});

			if (existing) {
				return yield* Effect.fail(AudioErrors.audioHashConflict(input.hash, existing.id));
			}

			// Crear el audio
			const newAudio = yield* Effect.tryPromise({
				try: async () => {
					const audioId = crypto.randomUUID();
					const now = new Date();

					const [created] = await db
						.insert(audios)
						.values({
							id: audioId,
							...input,
							createdAt: now,
							updatedAt: now,
						})
						.returning();

					return created;
				},
				catch: (error) => toAudioError(error, 'create'),
			});

			if (requestedIsFavorite && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.AUDIO, newAudio.id, true),
					catch: (error) => toAudioError(error, 'create.favoriteBridge'),
				});
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

			if (!audio) {
				return yield* Effect.fail(AudioErrors.audioNotFound(id));
			}

			return audio as Audio;
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

			const favoriteEntityIds: string[] | null =
				filters.isFavorite !== undefined
					? yield* Effect.tryPromise({
						try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.AUDIO),
						catch: (error) => toAudioError(error, 'getAll:favoriteIds'),
					})
					: null;

			const conditions = [];

			// Construir condiciones WHERE
			if (filters.folderId) conditions.push(eq(audios.folderId, filters.folderId));
			if (filters.isFavorite !== undefined) {
				if (favoriteEntityIds === null) {
					conditions.push(eq(audios.isFavorite, filters.isFavorite));
				} else if (filters.isFavorite) {
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
			const sortColumn = filters.sortBy || 'createdAt';
			const sortDirection = filters.sortOrder || 'desc';

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

					return await query
						.orderBy(orderByClause)
						.limit(filters.limit || 20)
						.offset(filters.offset || 0);
				},
				catch: (error) => toAudioError(error, 'getAll'),
			});

			// Retornar solo el array de audios (simplificado)
			const usingCanonicalFavoriteFilter = filters.isFavorite !== undefined && favoriteEntityIds !== null;

			if (usingCanonicalFavoriteFilter) {
				return audioResults.map((audio: Audio) => ({ ...audio, isFavorite: filters.isFavorite })) as Audio[];
			}

			return audioResults as Audio[];
		});

	// -------------------------------------------------------------------------------
	// UPDATE
	// -------------------------------------------------------------------------------
	const update = (id: string, input: AudioUpdateInput): Effect.Effect<Audio, AudioError> =>
		Effect.gen(function* () {
			yield* validateAudioInput(input, 'update');

			audioServiceLogger.info('Actualizando audio:', id);

			// Verificar que existe
			yield* getById(id);

			const requestedIsFavorite = input.isFavorite;
			const useCanonicalFavoriteBridge =
				requestedIsFavorite !== undefined
					? yield* Effect.tryPromise({
						try: async () => (await favoriteService.getFavoriteEntityIds(FavoriteEntityType.AUDIO)) !== null,
						catch: (error) => toAudioError(error, 'update.favoriteScope'),
					})
					: false;

			if (requestedIsFavorite !== undefined && useCanonicalFavoriteBridge) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.AUDIO, id, requestedIsFavorite),
					catch: (error) => toAudioError(error, 'update.favoriteBridge'),
				});
			}

			const { isFavorite: _ignoredIsFavorite, ...restInput } = input;

			// Actualizar
			yield* Effect.tryPromise({
				try: async () => {
					await db
						.update(audios)
						.set({
							...restInput,
							updatedAt: new Date(),
						})
						.where(eq(audios.id, id))
						.returning();
				},
				catch: (error) => toAudioError(error, 'update'),
			});

			audioServiceLogger.info('Audio actualizado exitosamente:', id);
			return yield* getById(id);
		});

	// -------------------------------------------------------------------------------
	// DELETE BY ID
	// -------------------------------------------------------------------------------
	const deleteById = (id: string, force = false): Effect.Effect<void, AudioError> =>
		Effect.gen(function* () {
			audioServiceLogger.info('Eliminando audio:', id, force ? '[FORCE]' : '');

			// Verificar que existe
			yield* getById(id);

			// TODO: Si force=false, verificar relaciones primero
			// Por ahora solo eliminamos directamente

			yield* Effect.tryPromise({
				try: async () => {
					await db.delete(audios).where(eq(audios.id, id));
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

			const deletedCount = yield* Effect.tryPromise({
				try: async () => {
					const result = await db.delete(audios).where(inArray(audios.id, ids));
					// libsql usa rowsAffected, better-sqlite3 usa changes
					return (result as any).rowsAffected ?? (result as any).changes ?? 0;
				},
				catch: (error) => toAudioError(error, 'deleteManyByIds'),
			});

			audioServiceLogger.info('Audios eliminados exitosamente:', deletedCount);
			return deletedCount;
		});

	// -------------------------------------------------------------------------------
	// GET BY HASH
	// -------------------------------------------------------------------------------
	const getByHash = (hash: string): Effect.Effect<Audio | null, AudioError> =>
		Effect.gen(function* () {
			audioServiceLogger.info('Buscando audio por hash:', hash);

			const audio = yield* Effect.tryPromise({
				try: async () => {
					const rows = await db
						.select({
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
						.where(eq(audios.hash, hash))
						.limit(1);

					return rows[0] || null;
				},
				catch: (error) => toAudioError(error, 'getByHash'),
			});

			return audio as Audio | null;
		});

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
						.where(and(eq(audios.path, path), eq(audios.folderId, folderId)))
						.limit(1);

					return rows[0] || null;
				},
				catch: (error) => toAudioError(error, 'getByPathAndFolder'),
			});

			return audio as Audio | null;
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
					const rows = await db.select({ count: count() }).from(audios).where(eq(audios.folderId, folderId));
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
			const audio = yield* getById(id);
			const favoriteEntityIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.AUDIO),
				catch: (error) => toAudioError(error, 'toggleFavorite.favoriteScope'),
			});
			const currentFavoriteStatus =
				favoriteEntityIds === null ? audio.isFavorite : favoriteEntityIds.includes(id);
			const newFavoriteStatus = !currentFavoriteStatus;

			if (favoriteEntityIds !== null) {
				yield* Effect.tryPromise({
					try: () => favoriteService.set(FavoriteEntityType.AUDIO, id, newFavoriteStatus),
					catch: (error) => toAudioError(error, 'toggleFavorite.favoriteBridge'),
				});
			}

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

			const favoriteEntityIds = yield* Effect.tryPromise({
				try: () => favoriteService.getFavoriteEntityIds(FavoriteEntityType.AUDIO),
				catch: (error) => toAudioError(error, 'setFavoriteMany.favoriteScope'),
			});

			const updatedCount =
				favoriteEntityIds === null
					? ids.length
					: yield* Effect.tryPromise({
						try: () => favoriteService.setMany(FavoriteEntityType.AUDIO, ids, isFavorite),
						catch: (error) => toAudioError(error, 'setFavoriteMany.favoriteBridge'),
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
						.from(audios);
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
