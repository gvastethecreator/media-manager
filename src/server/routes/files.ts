/**
 * @file Rutas de API para operaciones con archivos
 * @module server/routes/files
 * ✅ MIGRADO DESDE SERVER ACTIONS - 2025-07-03
 */

import { Effect } from 'effect';
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

const router = express.Router();
const logger = serverLogger.withContext('FilesAPI');

/**
 * GET /api/files/directory/:path - Obtener contenido de un directorio
 */
router.get(
	'/directory/:path',
	effectHandler((req, res) =>
		Effect.tryPromise({
			try: async () => {
				const dirPath = req.params.path;
				if (!dirPath) {
					res.status(400);
					return { error: 'Ruta de directorio requerida' };
				}
				const decodedPath = decodeURIComponent(dirPath);
				const directoryInfo = await getDirectoryInfoConcurrent(decodedPath);
				return { success: true, data: directoryInfo };
			},
			catch: (error) => {
				logger.error('Error obteniendo contenido del directorio:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Error interno del servidor',
				};
			},
		})
	)
);

/**
 * POST /api/files/directory - Crear un nuevo directorio
 */
router.post(
	'/directory',
	effectHandler((req, res) =>
		Effect.tryPromise({
			try: async () => {
				const { path, options } = req.body;
				if (!path) {
					res.status(400);
					return { error: 'Ruta de directorio requerida' };
				}
				const result = await createDirectory(path, options);
				return { success: true, data: result };
			},
			catch: (error) => {
				logger.error('Error creando directorio:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Error interno del servidor',
				};
			},
		})
	)
);

/**
 * PUT /api/files/rename - Renombrar un archivo
 */
router.put(
	'/rename',
	effectHandler((req, res) =>
		Effect.tryPromise({
			try: async () => {
				const { oldPath, newPath, options } = req.body;
				if (!(oldPath && newPath)) {
					res.status(400);
					return { error: 'Rutas oldPath y newPath requeridas' };
				}
				const result = await renameFile(oldPath, newPath, options);
				return { success: true, data: result };
			},
			catch: (error) => {
				logger.error('Error renombrando archivo:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Error interno del servidor',
				};
			},
		})
	)
);

/**
 * POST /api/files/copy - Copiar un archivo
 */
router.post(
	'/copy',
	effectHandler((req, res) =>
		Effect.tryPromise({
			try: async () => {
				const { sourcePath, destPath, options } = req.body;
				if (!(sourcePath && destPath)) {
					res.status(400);
					return { error: 'Rutas sourcePath y destPath requeridas' };
				}
				const result = await copyFile(sourcePath, destPath, options);
				return { success: true, data: result };
			},
			catch: (error) => {
				logger.error('Error copiando archivo:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Error interno del servidor',
				};
			},
		})
	)
);

/**
 * POST /api/files/move - Mover un archivo
 */
router.post(
	'/move',
	effectHandler((req, res) =>
		Effect.tryPromise({
			try: async () => {
				const { sourcePath, destPath, options } = req.body;
				if (!(sourcePath && destPath)) {
					res.status(400);
					return { error: 'Rutas sourcePath y destPath requeridas' };
				}
				const result = await moveFile(sourcePath, destPath, options);
				return { success: true, data: result };
			},
			catch: (error) => {
				logger.error('Error moviendo archivo:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Error interno del servidor',
				};
			},
		})
	)
);

export default router;

// Exportación nombrada para compatibilidad con server/index.ts
export { router as filesRouter };
