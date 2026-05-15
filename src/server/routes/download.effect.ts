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

const isTaggedError = (error: unknown, tag: string): boolean =>
	typeof error === 'object' && error !== null && '_tag' in error && (error as { _tag?: string })._tag === tag;

const getDownloadErrorResponse = (error: unknown): { message: string; status: number } => {
	if (error instanceof FilePathRequired || isTaggedError(error, 'FilePathRequired')) {
		return { status: 400, message: 'Se requiere una ruta de archivo' };
	}

	if (error instanceof FileNotFound || isTaggedError(error, 'FileNotFound')) {
		return { status: 404, message: 'Archivo no encontrado' };
	}

	return { status: 500, message: 'Error al procesar la descarga' };
};

const runDownloadEffect = (filePath: string): Promise<DownloadFileResult> => {
	const effect = Effect.gen(function* () {
		const service = yield* DownloadService;
		return yield* service.downloadFile(filePath);
	}).pipe(Effect.provide(DownloadServiceLive));

	return Effect.runPromise(effect);
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
router.post('/', async (req, res) => {
	const filePath = req.body.path as string | undefined;

	try {
		const result = await runDownloadEffect(filePath ?? '');

		downloadLogger.info(`Enviando archivo para descarga: ${result.fileInfo.name} (${result.fileInfo.mimeType})`);
		sendDownloadResponse(res, result);
	} catch (error) {
		downloadLogger.error(`Error en descarga: ${filePath}`, error);
		const { status, message } = getDownloadErrorResponse(error);
		res.status(status).json({ error: message });
	}
});

/**
 * GET /api/download - Descargar archivo por query string
 */
router.get('/', async (req, res) => {
	const filePath = req.query.path as string | undefined;

	try {
		const result = await runDownloadEffect(filePath ?? '');

		downloadLogger.info(`Enviando archivo para descarga: ${result.fileInfo.name} (${result.fileInfo.mimeType})`);
		sendDownloadResponse(res, result);
	} catch (error) {
		downloadLogger.error(`Error en descarga: ${filePath}`, error);
		const { status, message } = getDownloadErrorResponse(error);
		res.status(status).json({ error: message });
	}
});

export default router;
export { router as downloadEffectRouter };
