/**
 * @file API Routes para detección automática de cambios
 * @module server/routes/file-changes
 * @description Endpoints para verificar cambios en archivos cuando son abiertos
 * @created 2025-10-11 - Sistema incremental de reindexado
 */

import { Effect } from 'effect';
import express from 'express';
import { runEffectForExpress } from '@/lib/effect/adapters/express.adapter';
import {
	FileChangeDetectorService,
	FileChangeDetectorServiceLive,
} from '@/services/file-changes/file-change-detector.service.effect';

const router = express.Router();

/**
 * POST /api/file-changes/check-on-open - Verifica cambios en un archivo al abrirlo
 *
 * Body:
 * {
 *   fileId: string,
 *   entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d'
 * }
 */
router.post('/check-on-open', async (req, res) => {
	const effect = Effect.gen(function* () {
		const fileChangeDetector = yield* FileChangeDetectorService;

		const { fileId, entityType } = req.body;

		if (!(fileId && entityType)) {
			return res.status(400).json({
				error: 'fileId and entityType are required',
			});
		}

		const result = yield* fileChangeDetector.checkFileOnOpen(fileId, entityType);

		return result;
	});

	await runEffectForExpress(effect.pipe(Effect.provide(FileChangeDetectorServiceLive)), res);
});

/**
 * POST /api/file-changes/check-batch - Verifica cambios en múltiples archivos
 *
 * Body:
 * {
 *   files: Array<{
 *     id: string,
 *     entityType: 'image' | 'video' | 'audio' | 'document' | 'file3d'
 *   }>
 * }
 */
router.post('/check-batch', async (req, res) => {
	const effect = Effect.gen(function* () {
		const fileChangeDetector = yield* FileChangeDetectorService;

		const { files } = req.body;

		if (!Array.isArray(files)) {
			return res.status(400).json({
				error: 'files must be an array',
			});
		}

		const results = yield* fileChangeDetector.checkFilesOnOpen(files);

		const changedCount = results.filter((r) => r.hasChanged).length;

		return {
			totalFiles: results.length,
			changedFiles: changedCount,
			unchangedFiles: results.length - changedCount,
			results,
		};
	});

	await runEffectForExpress(effect.pipe(Effect.provide(FileChangeDetectorServiceLive)), res);
});

export default router;
