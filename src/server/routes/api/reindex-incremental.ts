/**
 * @file API Routes para reindexado incremental
 * @module server/routes/api/reindex-incremental
 * @description Endpoints para ejecutar reindexado incremental con detección de cambios basada en hash
 * @created 2025-10-11 - Sistema incremental de reindexado
 */

import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import {
	ReindexIncrementalService,
	ReindexIncrementalServiceLive,
} from '@/services/folder/reindex/reindex-incremental.service.effect';
import type { IncrementalReindexOptions } from '@/services/folder/reindex/reindex-incremental-types';

const router = express.Router();

/**
 * POST /api/reindex/incremental - Ejecuta reindexado incremental (solo cambios)
 */
router.post(
	'/incremental',
	effectHandler((req) =>
		Effect.gen(function* () {
			const reindexService = yield* ReindexIncrementalService;

			const options: IncrementalReindexOptions = {
				mode: 'incremental',
				forceFullReindex: req.body.forceFullReindex === true,
				fileTypes: req.body.fileTypes,
				folderId: req.body.folderId,
				includeSubfolders: req.body.includeSubfolders ?? true,
				includeHidden: req.body.includeHidden ?? false,
				concurrency: req.body.concurrency ?? 5,
				emitEvents: true,
				skipThumbnails: req.body.skipThumbnails === true,
				skipMetadata: req.body.skipMetadata === true,
				dryRun: req.body.dryRun === true,
			};

			const stats = yield* reindexService.executeIncrementalReindex(options);

			return {
				success: true,
				stats,
				message: `Reindexado completado: ${stats.changedFiles} archivos cambiados, ${stats.unchangedFiles} sin cambios`,
			};
		}).pipe(Effect.provide(ReindexIncrementalServiceLive))
	)
);

/**
 * POST /api/reindex/full - Ejecuta reindexado completo (todos los archivos)
 */
router.post(
	'/full',
	effectHandler((req) =>
		Effect.gen(function* () {
			const reindexService = yield* ReindexIncrementalService;

			const options: IncrementalReindexOptions = {
				mode: 'full',
				forceFullReindex: true,
				fileTypes: req.body.fileTypes,
				folderId: req.body.folderId,
				includeSubfolders: req.body.includeSubfolders ?? true,
				includeHidden: req.body.includeHidden ?? false,
				concurrency: req.body.concurrency ?? 5,
				emitEvents: true,
				skipThumbnails: req.body.skipThumbnails === true,
				skipMetadata: req.body.skipMetadata === true,
				dryRun: req.body.dryRun === true,
			};

			const stats = yield* reindexService.executeIncrementalReindex(options);

			return {
				success: true,
				stats,
				message: `Reindexado completo finalizado: ${stats.totalFiles} archivos procesados`,
			};
		}).pipe(Effect.provide(ReindexIncrementalServiceLive))
	)
);

/**
 * GET /api/reindex/needs-reindex/:folderId - Verifica si una carpeta necesita reindexado
 */
router.get(
	'/needs-reindex/:folderId',
	effectHandler((req) =>
		Effect.gen(function* () {
			const reindexService = yield* ReindexIncrementalService;
			const needsReindex = yield* reindexService.checkNeedsReindex(req.params.folderId);

			return {
				folderId: req.params.folderId,
				needsReindex,
				message: needsReindex ? 'La carpeta necesita reindexado' : 'La carpeta está actualizada',
			};
		}).pipe(Effect.provide(ReindexIncrementalServiceLive))
	)
);

/**
 * GET /api/reindex/stats - Obtiene estadísticas del último reindexado
 */
router.get(
	'/stats',
	effectHandler(() =>
		Effect.succeed({
			message: 'Estadísticas de reindexado',
			lastReindex: null,
			stats: null,
		})
	)
);

export { router as reindexIncrementalRouter };
export default router;
