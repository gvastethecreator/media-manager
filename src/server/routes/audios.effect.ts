/**
 * @file Express Routes para Audios usando Effect
 * @module server/routes/audios.effect
 * @description Rutas REST para Audios implementadas con Effect-TS
 * @created 2025-01-10 - Phase 6.3 AudioService Effect Implementation
 */

import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { getAudioRecordById } from '@/services/audio/audio-record.service';
import { serverLogger } from '@/lib/logger/server-logger';
import { setAuthorizedAssetCacheHeaders } from '@/server/security/authorized-asset-cache';
import {
	authorizeMediaAssetBodyIds,
	authorizeMediaAssetParam,
	authorizeMediaPlacementInput,
	authorizeMediaPathInput,
	filterAuthorizedMediaEntities,
	authorizeFolderPathById,
	getAuthorizedRootRegistry,
} from '@/server/security/authorized-root-request';
import { countAuthorizedMediaAssetsByFolder } from '@/server/security/media-asset-reference';
import { sanitizeJsonResponses } from '@/server/security/sanitize-public-payload';
import {
	type Audio,
	AudioService,
	type AudioServiceInterface,
	AudioServiceLive,
} from '@/services/audio/audio.service.effect';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = express.Router();
router.use(sanitizeJsonResponses);
const logger = serverLogger.withContext('AudiosRoutes');
type AudioListOptions = Parameters<AudioServiceInterface['getAll']>[0];

function listAuthorizedAudios(
	request: { app: { locals: Record<string, unknown> } },
	service: AudioServiceInterface,
	options: AudioListOptions,
	page: { limit: number; offset: number }
) {
	return Effect.gen(function* () {
		const authorized: Audio[] = [];
		let rawOffset = 0;
		const chunkSize = 500;
		while (true) {
			const chunk = yield* service.getAll({ ...options, limit: chunkSize, offset: rawOffset });
			authorized.push(
				...(yield* Effect.promise(() => filterAuthorizedMediaEntities(request, chunk, 'audio', ['read', 'index'])))
			);
			rawOffset += chunk.length;
			if (chunk.length < chunkSize) break;
		}
		return {
			hasNext: page.offset + page.limit < authorized.length,
			items: authorized.slice(page.offset, page.offset + page.limit),
			total: authorized.length,
		};
	});
}

/**
 * GET /audios - Listar audios con filtros y paginación
 */
router.get(
	'/',
	effectHandler((req) =>
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

			const result = yield* listAuthorizedAudios(req, audioService, filters, {
				limit: filters.limit,
				offset: filters.offset,
			});

			const data = result.items.map((audio) => ({
				...audio,
				entityType: 'audio' as const,
				thumbnailUrl: `/api/audio/${audio.id}/waveform`,
			}));

			return data;
		}).pipe(Effect.provide(AudioServiceLive))
	)
);

/**
 * GET /audios/favorites - Listar solo audios favoritos
 */
router.get(
	'/favorites',
	effectHandler((req) =>
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

			const result = yield* listAuthorizedAudios(
				req,
				audioService,
				{
					isFavorite: true,
					search: filters.search,
					sortBy: filters.sortBy,
					sortOrder: filters.sortOrder,
				},
				{
					limit: filters.limit,
					offset: filters.offset,
				}
			);

			return result.items.map((audio) => ({
				...audio,
				entityType: 'audio' as const,
				thumbnailUrl: `/api/audio/${audio.id}/waveform`,
			}));
		}).pipe(Effect.provide(AudioServiceLive))
	)
);

/**
 * GET /audios/stats/format - Obtener estadísticas por formato
 */
router.get('/stats/format', (_req, res) => {
	res.status(410).json({
		code: 'AUTHORIZED_SCOPE_REQUIRED',
		message: 'Las estadísticas globales fueron retiradas hasta disponer de agregados por media root.',
		retryable: false,
	});
});

/**
 * GET /audios/by-hash/:hash - Buscar audio por hash
 */
router.get(
	'/by-hash/:hash',
	effectHandler((req, res) => {
		const { hash } = req.params;

		return Effect.gen(function* () {
			const audioService = yield* AudioService;

			const candidates = yield* audioService.getByHashCandidates(hash);
			const [audio] = yield* Effect.promise(() =>
				filterAuthorizedMediaEntities(req, candidates, 'audio', ['read', 'index'])
			);

			if (!audio) {
				res.status(404).json({
					error: 'NOT_FOUND',
					message: `Audio con hash ${hash} no encontrado`,
				});
				return;
			}
			return audio;
		}).pipe(Effect.provide(AudioServiceLive));
	})
);

/**
 * GET /audios/folder/:folderId - Listar audios por folder
 */
router.get(
	'/folder/:folderId',
	authorizeFolderPathById('index'),
	effectHandler((req) => {
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

			const result = yield* listAuthorizedAudios(
				req,
				audioService,
				{ ...filters, folderId },
				{
					limit: filters.limit,
					offset: filters.offset,
				}
			);

			const data = result.items.map((audio) => ({
				...audio,
				entityType: 'audio' as const,
				thumbnailUrl: `/api/audio/${audio.id}/waveform`,
			}));

			return data;
		}).pipe(Effect.provide(AudioServiceLive));
	})
);

/**
 * GET /audios/folder/:folderId/count - Contar audios en un folder
 */
router.get(
	'/folder/:folderId/count',
	authorizeFolderPathById('index'),
	effectHandler((req) => {
		const { folderId } = req.params;

		return Effect.gen(function* () {
			const count = yield* Effect.promise(() =>
				countAuthorizedMediaAssetsByFolder(getAuthorizedRootRegistry(req), 'audio', folderId, 'index')
			);

			return { count };
		}).pipe(Effect.provide(AudioServiceLive));
	})
);

/**
 * GET /audios/:id/waveform - Obtener waveform de audio
 */
router.get('/:id/waveform', authorizeMediaAssetParam({ assetType: 'audio' }), async (req, res) => {
	try {
		const { id } = req.params;
		const options: any = {
			width: Number.parseInt(req.query.width as string, 10) || 300,
			height: Number.parseInt(req.query.height as string, 10) || 100,
			color: `#${(req.query.color as string) || '3b82f6'}`,
			backgroundColor: `#${(req.query.backgroundColor as string) || 'ffffff'}`,
		};

		// Obtener audio de la base de datos
		const audio = await getAudioRecordById(id);

		if (!audio) {
			res.status(404).json({ error: 'Audio not found' });
			return;
		}
		let metadata: any = null;

		// Parsear metadata si existe
		if (audio.metadata) {
			try {
				metadata = JSON.parse(audio.metadata);
			} catch (e) {
				logger.warn('No se pudo interpretar metadata de audio', { assetId: id, error: e });
			}
		}

		// Si ya tiene waveform generado en metadata
		if (metadata?.waveform?.data && typeof metadata.waveform.data === 'string') {
			const format = String(metadata.waveform.format || 'png').toLowerCase();
			const waveform = Buffer.from(metadata.waveform.data, 'base64');
			res.setHeader('Content-Type', format === 'svg' ? 'image/svg+xml' : 'image/png');
			setAuthorizedAssetCacheHeaders(res, 'revalidate');
			res.send(waveform);
			return;
		}

		if (typeof metadata?.waveform === 'string') {
			res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
			res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
			setAuthorizedAssetCacheHeaders(res, 'revalidate');
			res.send(metadata.waveform);
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
		res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
		setAuthorizedAssetCacheHeaders(res, 'no-store');
		res.send(errorSVG);
	} catch (error) {
		logger.error('No se pudo generar el waveform', { error });
		res.status(500).json({ error: 'Error generating waveform' });
	}
});

/**
 * GET /audios/:id - Obtener un audio por ID
 */
router.get(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'audio', permissions: ['read', 'index'] }),
	effectHandler((req) => {
		const { id } = req.params;

		return Effect.gen(function* () {
			const audioService = yield* AudioService;

			const audio = yield* audioService.getById(id);

			return audio;
		}).pipe(Effect.provide(AudioServiceLive));
	})
);

/**
 * GET /audios/:id/stats - Obtener audio con estadísticas completas
 */
router.get(
	'/:id/stats',
	authorizeMediaAssetParam({ assetType: 'audio', permissions: ['read', 'index'] }),
	effectHandler((req) => {
		const { id } = req.params;

		return Effect.gen(function* () {
			const audioService = yield* AudioService;

			const audio = yield* audioService.getByIdWithStats(id);

			return audio;
		}).pipe(Effect.provide(AudioServiceLive));
	})
);

/**
 * POST /audios - Crear un nuevo audio
 */
router.post(
	'/',
	authorizeMediaPathInput({ expected: 'file', required: true }),
	authorizeMediaPlacementInput(),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const audioService = yield* AudioService;

			const audio = yield* audioService.create(req.body);

			res.status(201);
			return audio;
		}).pipe(Effect.provide(AudioServiceLive))
	)
);

/**
 * PATCH /audios/:id - Actualizar un audio
 */
router.patch(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'audio', permissions: ['read', 'write'] }),
	authorizeMediaPathInput({ expected: 'file', permissions: ['read', 'index', 'write'], required: false }),
	effectHandler((req) => {
		const { id } = req.params;

		return Effect.gen(function* () {
			const audioService = yield* AudioService;

			const audio = yield* audioService.update(id, req.body);

			return audio;
		}).pipe(Effect.provide(AudioServiceLive));
	})
);

/**
 * DELETE /audios/batch - Eliminar múltiples audios
 */
router.delete(
	'/batch',
	authorizeMediaAssetBodyIds({ allowMissing: true, assetType: 'audio', permissions: ['delete'] }),
	effectHandler((req) => {
		const { ids, force } = req.body;

		return Effect.gen(function* () {
			const audioService = yield* AudioService;

			const deletedCount = yield* audioService.deleteManyByIds(ids, force === true);

			return { deletedCount };
		}).pipe(Effect.provide(AudioServiceLive));
	})
);

/**
 * DELETE /audios/:id - Eliminar un audio
 */
router.delete(
	'/:id',
	authorizeMediaAssetParam({ allowMissing: true, assetType: 'audio', permissions: ['delete'] }),
	effectHandler((req, res) => {
		const { id } = req.params;
		const { force } = req.query;

		return Effect.gen(function* () {
			const audioService = yield* AudioService;

			yield* audioService.deleteById(id, force === 'true');

			res.status(204);
			return undefined;
		}).pipe(Effect.provide(AudioServiceLive));
	})
);

/** POST /audios/:id/restore - Restaurar un tombstone canónico. */
router.post(
	'/:id/restore',
	authorizeMediaAssetParam({
		allowDeleted: true,
		allowMissing: true,
		assetType: 'audio',
		permissions: ['read', 'write'],
	}),
	effectHandler((req) =>
		Effect.gen(function* () {
			const audioService = yield* AudioService;
			return yield* audioService.restoreById(req.params.id);
		}).pipe(Effect.provide(AudioServiceLive))
	)
);

export default router;
