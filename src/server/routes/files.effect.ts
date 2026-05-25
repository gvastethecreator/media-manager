/**
 * @file Express Routes para Files usando Effect
 * @module server/routes/files.effect
 * @description Rutas REST para operaciones con archivos implementadas con Effect-TS
 * @created 2026-02-02 - Migración desde files.ts
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { Context, Data, Effect, Layer } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	copyFile,
	createDirectory,
	getDirectoryInfoConcurrent,
	moveFile,
	renameFile,
} from '@/services/file/file.service';
import { getMimeTypeFromExtension } from '@/services/file-entity-mapper/utils/file-info.utils';

// ==========================================
// 1. Definir errores tipados
// ==========================================

export class DirectoryNotFound extends Data.TaggedError('DirectoryNotFound')<{
	readonly path: string;
}> {}

export class FilePathRequired extends Data.TaggedError('FilePathRequired')<{
	readonly field: string;
}> {}

export class FileOperationFailed extends Data.TaggedError('FileOperationFailed')<{
	readonly operation: string;
	readonly message: string;
}> {}

export class FileNotFound extends Data.TaggedError('FileNotFound')<{
	readonly path: string;
}> {}

// ==========================================
// 2. Crear servicio Effect
// ==========================================

export interface FileServiceInterface {
	readonly copyFile: (
		sourcePath: string,
		destPath: string,
		options?: { overwrite?: boolean }
	) => Effect.Effect<{ success: true; data: unknown }, FileOperationFailed>;
	readonly createDirectory: (
		path: string,
		options?: { recursive?: boolean }
	) => Effect.Effect<{ success: true; data: unknown }, FileOperationFailed>;
	readonly getDirectoryInfo: (
		path: string
	) => Effect.Effect<
		{ success: true; data: { path: string; items: unknown[]; total: number } },
		DirectoryNotFound | FileOperationFailed
	>;
	readonly moveFile: (
		sourcePath: string,
		destPath: string,
		options?: { overwrite?: boolean }
	) => Effect.Effect<{ success: true; data: unknown }, FileOperationFailed>;
	readonly renameFile: (
		oldPath: string,
		newPath: string,
		options?: { overwrite?: boolean }
	) => Effect.Effect<{ success: true; data: unknown }, FileOperationFailed>;
}

export class FileService extends Context.Tag('FileService')<FileService, FileServiceInterface>() {}

// ==========================================
// 3. Implementar Live Layer
// ==========================================

export const FileServiceLive = Layer.succeed(
	FileService,
	FileService.of({
		getDirectoryInfo: (path: string) =>
			Effect.tryPromise({
				try: async () => {
					const directoryInfo = await getDirectoryInfoConcurrent(path);
					return { success: true as const, data: directoryInfo };
				},
				catch: (error) => {
					if (error instanceof Error && error.message.includes('no es un directorio')) {
						return new DirectoryNotFound({ path });
					}
					return new FileOperationFailed({
						operation: 'getDirectoryInfo',
						message: error instanceof Error ? error.message : 'Error desconocido',
					});
				},
			}),

		createDirectory: (path: string, options?: { recursive?: boolean }) =>
			Effect.tryPromise({
				try: async () => {
					const result = await createDirectory(path, options);
					return { success: true as const, data: result };
				},
				catch: (error) =>
					new FileOperationFailed({
						operation: 'createDirectory',
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),

		renameFile: (oldPath: string, newPath: string, options?: { overwrite?: boolean }) =>
			Effect.tryPromise({
				try: async () => {
					const result = await renameFile(oldPath, newPath, options);
					return { success: true as const, data: result };
				},
				catch: (error) =>
					new FileOperationFailed({
						operation: 'renameFile',
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),

		copyFile: (sourcePath: string, destPath: string, options?: { overwrite?: boolean }) =>
			Effect.tryPromise({
				try: async () => {
					const result = await copyFile(sourcePath, destPath, options);
					return { success: true as const, data: result };
				},
				catch: (error) =>
					new FileOperationFailed({
						operation: 'copyFile',
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),

		moveFile: (sourcePath: string, destPath: string, options?: { overwrite?: boolean }) =>
			Effect.tryPromise({
				try: async () => {
					const result = await moveFile(sourcePath, destPath, options);
					return { success: true as const, data: result };
				},
				catch: (error) =>
					new FileOperationFailed({
						operation: 'moveFile',
						message: error instanceof Error ? error.message : 'Error desconocido',
					}),
			}),
	})
);

// ==========================================
// 4. Crear Router Express
// ==========================================

const router = express.Router();
const logger = serverLogger.withContext('FilesAPI');

/**
 * GET /api/files/directory/:path - Obtener contenido de un directorio
 */
router.get('/directory/:path', effectHandler((req) =>
	Effect.gen(function* () {
		const fileService = yield* FileService;
		const dirPath = req.params.path;

		if (!dirPath) {
			return yield* Effect.fail(new FilePathRequired({ field: 'path' }));
		}

		const decodedPath = decodeURIComponent(dirPath);
		return yield* fileService.getDirectoryInfo(decodedPath);
	}).pipe(Effect.provide(FileServiceLive))
));

/**
 * POST /api/files/directory - Crear un nuevo directorio
 */
router.post('/directory', effectHandler((req) =>
	Effect.gen(function* () {
		const fileService = yield* FileService;
		const { path, options } = req.body;

		if (!path) {
			return yield* Effect.fail(new FilePathRequired({ field: 'path' }));
		}

		return yield* fileService.createDirectory(path, options);
	}).pipe(Effect.provide(FileServiceLive))
));

/**
 * PUT /api/files/rename - Renombrar un archivo
 */
router.put('/rename', effectHandler((req) =>
	Effect.gen(function* () {
		const fileService = yield* FileService;
		const { oldPath, newPath, options } = req.body;

		if (!(oldPath && newPath)) {
			return yield* Effect.fail(new FilePathRequired({ field: 'oldPath/newPath' }));
		}

		return yield* fileService.renameFile(oldPath, newPath, options);
	}).pipe(Effect.provide(FileServiceLive))
));

/**
 * POST /api/files/copy - Copiar un archivo
 */
router.post('/copy', effectHandler((req) =>
	Effect.gen(function* () {
		const fileService = yield* FileService;
		const { sourcePath, destPath, options } = req.body;

		if (!(sourcePath && destPath)) {
			return yield* Effect.fail(new FilePathRequired({ field: 'sourcePath/destPath' }));
		}

		return yield* fileService.copyFile(sourcePath, destPath, options);
	}).pipe(Effect.provide(FileServiceLive))
));

/**
 * POST /api/files/move - Mover un archivo
 */
router.post('/move', effectHandler((req) =>
	Effect.gen(function* () {
		const fileService = yield* FileService;
		const { sourcePath, destPath, options } = req.body;

		if (!(sourcePath && destPath)) {
			return yield* Effect.fail(new FilePathRequired({ field: 'sourcePath/destPath' }));
		}

		return yield* fileService.moveFile(sourcePath, destPath, options);
	}).pipe(Effect.provide(FileServiceLive))
));

/**
 * GET /api/files/content - Servir contenido de archivo por path
 * Query params: path (ruta completa del archivo)
 */
router.get('/content', async (req, res) => {
	const filePath = typeof req.query.path === 'string' ? req.query.path.trim() : '';

	if (!filePath) {
		res.status(400).json({ error: 'Path query parameter requerido' });
		return;
	}

	try {
		// Verificar que el archivo existe
		const fileStat = await stat(filePath);

		if (!fileStat.isFile()) {
			res.status(404).json({ error: 'No es un archivo válido' });
			return;
		}

		res.set({
			'Content-Type': getMimeTypeFromExtension(extname(filePath)),
			'Content-Length': fileStat.size.toString(),
			'X-Content-Type-Options': 'nosniff',
		});

		// Crear stream de lectura
		const stream = createReadStream(filePath);

		// Manejar errores del stream
		stream.on('error', (error: Error) => {
			logger.error('Error leyendo archivo:', error);
			if (!res.headersSent) {
				res.status(500).json({ error: 'Error leyendo archivo' });
			}
		});

		// Enviar archivo
		stream.pipe(res);
	} catch (error) {
		logger.error('Error sirviendo archivo:', error);
		res.status(404).json({
			error: 'Archivo no encontrado',
			path: filePath,
		});
	}
});

export default router;
export { router as filesEffectRouter };
