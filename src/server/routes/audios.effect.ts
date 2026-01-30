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
import { runEffectForExpress } from '@/lib/effect/adapters/express.adapter';
import { AudioService, AudioServiceLive } from '@/services/audio/audio.service.effect';

const router = express.Router();

/**
 * GET /audios - Listar audios con filtros y paginación
 */
router.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
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
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
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

		return res.json(result);
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /audios/favorites - Listar solo audios favoritos
 */
router.get('/favorites', async (req, res) => {
	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

		const filters = {
			search: search as string | undefined,
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
			sortBy: (sortBy as 'name' | 'size' | 'duration' | 'bitrate' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
		};

		const result = yield* audioService.getAllFavorites(filters);

		return res.json(result);
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /audios/stats/format - Obtener estadísticas por formato
 */
router.get('/stats/format', async (req, res) => {
	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const stats = yield* audioService.getFormatStats();

		return res.json({ stats });
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /audios/by-hash/:hash - Buscar audio por hash
 */
router.get('/by-hash/:hash', async (req, res) => {
	const { hash } = req.params;

	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.getByHash(hash);

		if (!audio) {
			return res.status(404).json({
				error: 'NOT_FOUND',
				message: `Audio con hash ${hash} no encontrado`,
			});
		}

		return res.json(audio);
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /audios/folder/:folderId - Listar audios por folder
 */
router.get('/folder/:folderId', async (req, res) => {
	const { folderId } = req.params;

	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

		const filters = {
			search: search as string | undefined,
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
			sortBy: (sortBy as 'name' | 'size' | 'duration' | 'bitrate' | 'createdAt' | 'updatedAt') || 'createdAt',
			sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
		};

		const result = yield* audioService.getByFolder(folderId, filters);

		return res.json(result);
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /audios/folder/:folderId/count - Contar audios en un folder
 */
router.get('/folder/:folderId/count', async (req, res) => {
	const { folderId } = req.params;

	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const count = yield* audioService.countByFolder(folderId);

		return res.json({ count });
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

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
router.get('/:id', async (req, res) => {
	const { id } = req.params;

	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.getById(id);

		return res.json(audio);
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /audios/:id/stats - Obtener audio con estadísticas completas
 */
router.get('/:id/stats', async (req, res) => {
	const { id } = req.params;

	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.getByIdWithStats(id);

		return res.json(audio);
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * POST /audios - Crear un nuevo audio
 */
router.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.create(req.body);

		return res.status(201).json(audio);
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * POST /audios/:id/favorite - Toggle estado favorito de un audio
 */
router.post('/:id/favorite', async (req, res) => {
	const { id } = req.params;

	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.toggleFavorite(id);

		return res.json(audio);
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * POST /audios/batch/favorite - Marcar múltiples audios como favoritos/no favoritos
 */
router.post('/batch/favorite', async (req, res) => {
	const { ids, isFavorite } = req.body;

	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const updatedCount = yield* audioService.setFavoriteMany(ids, isFavorite);

		return res.json({ updatedCount });
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * PATCH /audios/:id - Actualizar un audio
 */
router.patch('/:id', async (req, res) => {
	const { id } = req.params;

	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const audio = yield* audioService.update(id, req.body);

		return res.json(audio);
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * DELETE /audios/:id - Eliminar un audio
 */
router.delete('/:id', async (req, res) => {
	const { id } = req.params;
	const { force } = req.query;

	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		yield* audioService.deleteById(id, force === 'true');

		return res.status(204).send();
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * DELETE /audios/batch - Eliminar múltiples audios
 */
router.delete('/batch', async (req, res) => {
	const { ids, force } = req.body;

	const effect = Effect.gen(function* () {
		const audioService = yield* AudioService;

		const deletedCount = yield* audioService.deleteManyByIds(ids, force === true);

		return res.json({ deletedCount });
	}).pipe(Effect.provide(AudioServiceLive));

	await runEffectForExpress(effect, res);
});

export default router;
