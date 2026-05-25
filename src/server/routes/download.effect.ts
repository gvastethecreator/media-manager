/**
 * @file Express Routes para Download usando Effect
 * @module server/routes/download.effect
 * @description Rutas REST para descargas de archivos implementadas con Effect-TS
 * @created 2026-02-02 - Migración completa desde download.ts
 */

import { Context, Data, Effect, Layer } from 'effect';
import express from 'express';
import fs from 'fs/promises';
import { serverLogger } from '@/lib/logger/server-logger';
import { getFileInfo } from '@/services/file/file.service';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';

// ==========================================
// 1. Definir errores tipados
// ==========================================

export class FilePathRequired extends Data.TaggedError('FilePathRequired')<{
	readonly field: string;
}> {}

export class FileNotFound extends Data.TaggedError('FileNotFound')<{
	readonly path: string;
}> {}

export class FileReadError extends Data.TaggedError('FileReadError')<{
	readonly path: string;
	readonly message: string;
}> {}

// ==========================================
// 2. Crear servicio Effect
// ==========================================

export interface DownloadServiceInterface {
	readonly downloadFile: (
		filePath: string
	) => Effect.Effect<
		{ buffer: Buffer; fileInfo: { name: string; mimeType: string; path: string; size: number } },
		FilePathRequired | FileNotFound | FileReadError
	>;
}

export class DownloadService extends Context.Tag('DownloadService')<DownloadService, DownloadServiceInterface>() {}

type DownloadFileResult = {
	buffer: Buffer;
	fileInfo: { name: string; mimeType: string; path: string; size: number };
};

const encodeRFC5987Value = (value: string): string =>
	encodeURIComponent(value)
		.replace(/['()]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
		.replace(/\*/g, '%2A');

const createAttachmentHeader = (fileName: string): string => {
	const fallbackName =
		fileName
			.replace(/[^\x20-\x7E]/g, '_')
			.replace(/["\\;]/g, '_')
			.trim() || 'download';

	return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeRFC5987Value(fileName)}`;
};

const sendDownloadResponse = (res: express.Response, result: DownloadFileResult): void => {
	res.set({
		'Content-Type': result.fileInfo.mimeType,
		'Content-Disposition': createAttachmentHeader(result.fileInfo.name),
		'Content-Length': result.fileInfo.size.toString(),
		'X-Content-Type-Options': 'nosniff',
	});
	res.send(result.buffer);
};

// ==========================================
// 3. Implementar Live Layer
// ==========================================

export const DownloadServiceLive = Layer.succeed(
	DownloadService,
	DownloadService.of({
		downloadFile: (filePath: string) =>
			Effect.tryPromise({
				try: async () => {
					if (!filePath?.trim()) {
						throw new FilePathRequired({ field: 'path' });
					}

					const fileInfo = await getFileInfo(filePath.trim());
					const buffer = await fs.readFile(fileInfo.path);

					return {
						buffer,
						fileInfo: {
							name: fileInfo.name,
							mimeType: fileInfo.mimeType,
							path: fileInfo.path,
							size: fileInfo.size,
						},
					};
				},
				catch: (error) => {
					if (error instanceof FilePathRequired) {
						return error;
					}
					if (error instanceof Error && error.message.includes('No se pudo obtener')) {
						return new FileNotFound({ path: filePath });
					}
					return new FileReadError({
						path: filePath,
						message: error instanceof Error ? error.message : 'Error al leer archivo',
					});
				},
			}),
	})
);

// ==========================================
// 4. Crear Router Express
// ==========================================

const router = express.Router();
const downloadLogger = serverLogger.withContext('DownloadAPI');

/**
 * POST /api/download - Descargar archivo
 */
router.post('/', effectHandler(
	(req) => {
		const filePath = (req.body.path as string) ?? '';
		return Effect.gen(function* () {
			const service = yield* DownloadService;
			return { result: yield* service.downloadFile(filePath), filePath };
		}).pipe(Effect.provide(DownloadServiceLive));
	},
	{
		onSuccess: ({ result, filePath }, res) => {
			downloadLogger.info(`Enviando archivo para descarga: ${result.fileInfo.name} (${result.fileInfo.mimeType})`);
			sendDownloadResponse(res, result);
		},
	}
));

/**
 * GET /api/download - Descargar archivo por query string
 */
router.get('/', effectHandler(
	(req) => {
		const filePath = (req.query.path as string) ?? '';
		return Effect.gen(function* () {
			const service = yield* DownloadService;
			return { result: yield* service.downloadFile(filePath), filePath };
		}).pipe(Effect.provide(DownloadServiceLive));
	},
	{
		onSuccess: ({ result, filePath }, res) => {
			downloadLogger.info(`Enviando archivo para descarga: ${result.fileInfo.name} (${result.fileInfo.mimeType})`);
			sendDownloadResponse(res, result);
		},
	}
));

export default router;
export { router as downloadEffectRouter };
