/**
 * @file Express Routes para Audios usando Effect
 * @module server/routes/audios.effect
 * @description Rutas REST para Audios implementadas con Effect-TS
 * @created 2025-01-10 - Phase 6.3 AudioService Effect Implementation
 */

import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import express from 'express';
import { db } from '@/lib/drizzle/index.js';
import { audios } from '@/lib/drizzle/schema/index.js';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { AudioService, AudioServiceLive } from '@/services/audio/audio.service.effect';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { markFavoriteToggleFacadeDeprecated } from '../utils/favorite-facade-deprecation';
import { sanitizeLimit, sanitizeOffset, validateBatchSize } from '../utils/pagination';

const router = express.Router();

function normalizeSortValue(value: unknown): number | string {
	if (value instanceof Date) {
		return value.getTime();
	}

	if (typeof value === 'number') {
		return value;
	}

	if (typeof value === 'string') {
		return value.toLowerCase();
	}

	if (typeof value === 'boolean') {
		return value ? 1 : 0;
	}

	if (value && typeof value === 'object' && 'getTime' in value && typeof value.getTime === 'function') {
		return value.getTime();
	}

	return 0;
}

function sortEntitiesByField<T extends Record<string, unknown>>(
	items: T[],
	sortBy: string,
	sortOrder: 'asc' | 'desc'
): T[] {
	const direction = sortOrder === 'asc' ? 1 : -1;

	return [...items].sort((left, right) => {
		const leftValue = normalizeSortValue(left[sortBy]);
		const rightValue = normalizeSortValue(right[sortBy]);

		if (leftValue < rightValue) {
			return -1 * direction;
		}

		if (leftValue > rightValue) {
			return 1 * direction;
		}

		return 0;
	});
}

/**
 * GET /audios - Listar audios con filtros y paginación
 */
router.get('/', effectHandler((req) =>
	Effect.gen(function* () {
		const audioService = yield* AudioService;

		const {
			search,
			limit = '50',
			offset = '0',
			sortBy = 'createdAt',
			sortOrder = 'desc',
			folderId,
			isFavorite,
			isArchived,
			format,
			genre,
			artist,
			album,
			minDuration,
			maxDuration,
			minSize,
			maxSize,
			minBitrate,
			maxBitrate,
		} = req.query;

		const filters = {
			search: search as string | undefined,
			limit: sanitizeLimit(limit as string),
			offset: sanitizeOffset(offset as string),
			sortBy: (sortBy as 'name' | 'size' | 'duration' | 'bitrate' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
			folderId: folderId as string | undefined,
			isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
			isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
			format: format as string | undefined,
			genre: genre as string | undefined,
			artist: artist as string | undefined,
			album: album as string | undefined,
			minDuration: minDuration ? Number.parseInt(minDuration as string, 10) : undefined,
			maxDuration: maxDuration ? Number.parseInt(maxDuration as string, 10) : undefined,
			minSize: minSize ? Number.parseInt(minSize as string, 10) : undefined,
			maxSize: maxSize ? Number.parseInt(maxSize as string, 10) : undefined,
			minBitrate: minBitrate ? Number.parseInt(minBitrate as string, 10) : undefined,
			maxBitrate: maxBitrate ? Number.parseInt(maxBitrate as string, 10) : undefined,
		};

		const result = yield* audioService.getAll(filters);

		const data = result.map((audio) => ({
			...audio,
			entityType: 'audio' as const,
			thumbnailUrl: `/api/audio/${audio.id}/waveform`,
		}));

		return data;
	}).pipe(Effect.provide(AudioServiceLive))
));

/**
 * GET /audios/favorites - Listar solo audios favoritos
 */
router.get('/favorites', effectHandler((req) =>
	Effect.gen(function* () {
		const audioService = yield* AudioService;

		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

		const filters = {
			search: search as string | undefined,
			limit: sanitizeLimit(limit as string),
			offset: sanitizeOffset(offset as string),
			sortBy: (sortBy as 'name' | 'size' | 'duration' | 'bitrate' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
		};

		const favoriteCounts = yield* Effect.tryPromise({
			try: () => favoriteService.getCountsByType(),
			catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
		});

		const totalFavorites = favoriteCounts[FavoriteEntityType.AUDIO] ?? 0;

		if (totalFavorites === 0) {
			return [];
		}

		const favoriteResult = yield* Effect.tryPromise({
			try: () =>
				favoriteService.list({
					entityType: FavoriteEntityType.AUDIO,
					search: filters.search,
					limit: totalFavorites,
					offset: 0,
					sortBy: 'addedAt',
					sortOrder: 'desc',
				}),
			catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
		});

		const favoriteAudios = yield* Effect.all(
			favoriteResult.items.map((favorite) =>
				audioService.getByIdWithStats(favorite.entityId).pipe(
					Effect.map((audio) => ({
						...audio,
						entityType: 'audio' as const,
						thumbnailUrl: `/api/audio/${audio.id}/waveform`,
					})),
					Effect.catchAll(() => Effect.succeed(null))
				)
			)
		);

		const data = sortEntitiesByField(
			favoriteAudios.flatMap((audio) => (audio ? [audio] : [])),
			filters.sortBy,
			filters.sortOrder
		).slice(filters.offset, filters.offset + filters.limit);

		return data;
	}).pipe(Effect.provide(AudioServiceLive))
));

/**
 * GET /audios/stats/format - Obtener estadísticas por formato
 */
router.get('/stats/format', effectHandler((req) =>
	Effect.gen(function* () {
		const audioService = yield* AudioService;

		const stats = yield* audioService.getFormatStats();

		return { stats };
	}).pipe(Effect.provide(AudioServiceLive))
));

/**
 * GET /audios/by-hash/:hash - Buscar audio por hash
 */
router.get('/by-hash/:hash', effectHandler((req, res) => {
	const { hash } = req.params;

	return Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.getByHash(hash);

		if (!audio) {
			res.status(404).json({
				error: 'NOT_FOUND',
				message: `Audio con hash ${hash} no encontrado`,
			});
			return;
		}

		return audio;
	}).pipe(Effect.provide(AudioServiceLive));
}));

/**
 * GET /audios/folder/:folderId - Listar audios por folder
 */
router.get('/folder/:folderId', effectHandler((req) => {
	const { folderId } = req.params;

	return Effect.gen(function* () {
		const audioService = yield* AudioService;

		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

		const filters = {
			search: search as string | undefined,
			limit: sanitizeLimit(limit as string),
			offset: sanitizeOffset(offset as string),
			sortBy: (sortBy as 'name' | 'size' | 'duration' | 'bitrate' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
		};

		const result = yield* audioService.getByFolder(folderId, filters);

		const data = result.map((audio) => ({
			...audio,
			entityType: 'audio' as const,
			thumbnailUrl: `/api/audio/${audio.id}/waveform`,
		}));

		return data;
	}).pipe(Effect.provide(AudioServiceLive));
}));

/**
 * GET /audios/folder/:folderId/count - Contar audios en un folder
 */
router.get('/folder/:folderId/count', effectHandler((req) => {
	const { folderId } = req.params;

	return Effect.gen(function* () {
		const audioService = yield* AudioService;

		const count = yield* audioService.countByFolder(folderId);

		return { count };
	}).pipe(Effect.provide(AudioServiceLive));
}));

/**
 * GET /audios/:id/waveform - Obtener waveform de audio
 */
router.get('/:id/waveform', async (req, res) => {
	try {
		const { id } = req.params;
		const options: any = {
			width: Number.parseInt(req.query.width as string, 10) || 300,
			height: Number.parseInt(req.query.height as string, 10) || 100,
			color: `#${(req.query.color as string) || '3b82f6'}`,
			backgroundColor: `#${(req.query.backgroundColor as string) || 'ffffff'}`,
		};

		// Obtener audio de la base de datos
		const audioRecords = await db.select({ metadata: audios.metadata }).from(audios).where(eq(audios.id, id));

		if (audioRecords.length === 0) {
			res.status(404).json({ error: 'Audio not found' });
			return;
		}

		const audio = audioRecords[0];
		let metadata: any = null;

		// Parsear metadata si existe
		if (audio.metadata) {
			try {
				metadata = JSON.parse(audio.metadata);
			} catch (e) {
				console.warn(`Error parsing metadata for audio ${id}:`, e);
			}
		}

		// Si ya tiene waveform generado en metadata
		if (metadata?.waveform) {
			const waveformSvg = metadata.waveform;
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=3600');
			res.send(waveformSvg);
			return;
		}

		// Fallback: generar placeholder
		const errorSVG = `
<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${options.backgroundColor}"/>
  <g transform="translate(${options.width / 2},${options.height / 2})">
    <text text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#1f2937">
      🎵 Audio
    </text>
  </g>
</svg>`;

		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'public, max-age=60');
		res.send(errorSVG);
	} catch (error) {
		console.error('Error generando waveform:', error);
		res.status(500).json({ error: 'Error generating waveform' });
	}
});

/**
 * GET /audios/:id - Obtener un audio por ID
 */
router.get('/:id', effectHandler((req) => {
	const { id } = req.params;

	return Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.getById(id);

		return audio;
	}).pipe(Effect.provide(AudioServiceLive));
}));

/**
 * GET /audios/:id/stats - Obtener audio con estadísticas completas
 */
router.get('/:id/stats', effectHandler((req) => {
	const { id } = req.params;

	return Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.getByIdWithStats(id);

		return audio;
	}).pipe(Effect.provide(AudioServiceLive));
}));

/**
 * POST /audios - Crear un nuevo audio
 */
router.post('/', effectHandler((req, res) =>
	Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.create(req.body);

		res.status(201);
		return audio;
	}).pipe(Effect.provide(AudioServiceLive))
));

/**
 * POST /audios/:id/favorite - Toggle estado favorito de un audio
 */
router.post('/:id/favorite', effectHandler((req, res) => {
	const { id } = req.params;

	return Effect.gen(function* () {
		markFavoriteToggleFacadeDeprecated(res, FavoriteEntityType.AUDIO);
		const audioService = yield* AudioService;
		const audio = yield* audioService.toggleFavorite(id);

		return audio;
	}).pipe(Effect.provide(AudioServiceLive));
}));

/**
 * POST /audios/batch/favorite - Marcar múltiples audios como favoritos/no favoritos
 */
router.post('/batch/favorite', effectHandler((req) => {
	const { ids, isFavorite } = req.body;

	return Effect.gen(function* () {
		if (!Array.isArray(ids) || typeof isFavorite !== 'boolean') {
			yield* Effect.fail(new Error('Invalid request: ids must be array and isFavorite must be boolean'));
		}

		validateBatchSize(ids);

		const updatedCount = yield* Effect.tryPromise({
			try: () => favoriteService.setMany(FavoriteEntityType.AUDIO, ids, isFavorite),
			catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
		});

		return { updatedCount };
	});
}));

/**
 * PATCH /audios/:id - Actualizar un audio
 */
router.patch('/:id', effectHandler((req) => {
	const { id } = req.params;

	return Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.update(id, req.body);

		return audio;
	}).pipe(Effect.provide(AudioServiceLive));
}));

/**
 * DELETE /audios/:id - Eliminar un audio
 */
router.delete('/:id', effectHandler((req, res) => {
	const { id } = req.params;
	const { force } = req.query;

	return Effect.gen(function* () {
		const audioService = yield* AudioService;

		yield* audioService.deleteById(id, force === 'true');

		res.status(204);
		return undefined;
	}).pipe(Effect.provide(AudioServiceLive));
}));

/**
 * DELETE /audios/batch - Eliminar múltiples audios
 */
router.delete('/batch', effectHandler((req) => {
	const { ids, force } = req.body;

	return Effect.gen(function* () {
		const audioService = yield* AudioService;

		const deletedCount = yield* audioService.deleteManyByIds(ids, force === true);

		return { deletedCount };
	}).pipe(Effect.provide(AudioServiceLive));
}));

export default router;
