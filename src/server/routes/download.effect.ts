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

// ==========================================
// 3. Implementar Live Layer
// ==========================================

export const DownloadServiceLive = Layer.succeed(
	DownloadService,
	DownloadService.of({
		downloadFile: (filePath: string) =>
			Effect.tryPromise({
				try: async () => {
					if (!filePath) {
						throw new FilePathRequired({ field: 'path' });
					}

					const fileInfo = await getFileInfo(filePath);
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

	if (!filePath) {
		downloadLogger.error('Descarga fallida: No se proporcionó ruta de archivo');
		res.status(400).json({ error: 'Se requiere una ruta de archivo' });
		return;
	}

	try {
		const effect = Effect.gen(function* () {
			const service = yield* DownloadService;
			return yield* service.downloadFile(filePath);
		}).pipe(Effect.provide(DownloadServiceLive));

		const { buffer, fileInfo } = await Effect.runPromise(effect);

		res.set({
			'Content-Type': fileInfo.mimeType,
			'Content-Disposition': `attachment; filename="${fileInfo.name}"`,
			'Content-Length': fileInfo.size.toString(),
		});
		downloadLogger.info(`Enviando archivo para descarga: ${fileInfo.name} (${fileInfo.mimeType})`);
		res.send(buffer);
	} catch (error) {
		downloadLogger.error(`Error en descarga: ${filePath}`, error);
		res.status(500).json({ error: 'Error al procesar la descarga' });
	}
});

/**
 * GET /api/download - Interfaz de descarga HTML
 */
router.get('/', async (req, res) => {
	const filePath = req.query.path as string | undefined;

	if (!filePath) {
		downloadLogger.error('Descarga fallida: No se proporcionó ruta de archivo');
		res.status(400).json({ error: 'Se requiere una ruta de archivo' });
		return;
	}

	res.send(`<!DOCTYPE html>
<html>
  <head>
	<title>Descargando archivo...</title>
	<style>
	  body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; color: #333; }
	  .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
	  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
	</style>
  </head>
  <body>
	<div class="loader"></div>
	<p>Iniciando descarga...</p>
	<form id="downloadForm" method="POST" action="/api/download">
	  <input type="hidden" name="path" value="${filePath}">
	</form>
	<script>document.addEventListener('DOMContentLoaded',function(){document.getElementById('downloadForm').submit();});</script>
  </body>
</html>`);
});

export default router;
export { router as downloadEffectRouter };
