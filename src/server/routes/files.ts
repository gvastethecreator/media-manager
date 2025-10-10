/**
 * @file Rutas de API para operaciones con archivos
 * @module server/routes/files
 * ✅ MIGRADO DESDE SERVER ACTIONS - 2025-07-03
 */

import express from 'express';
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
router.get('/directory/:path', async (req, res) => {
	try {
		const dirPath = req.params.path;

		if (!dirPath) {
			res.status(400).json({ error: 'Ruta de directorio requerida' });
			return;
		}

		// Decodificar la ruta URL-encoded
		const decodedPath = decodeURIComponent(dirPath);
		const directoryInfo = await getDirectoryInfoConcurrent(decodedPath);
		res.json({ success: true, data: directoryInfo });
	} catch (error) {
		logger.error('Error obteniendo contenido del directorio:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor',
		});
	}
});

/**
 * POST /api/files/directory - Crear un nuevo directorio
 */
router.post('/directory', async (req, res) => {
	try {
		const { path, options } = req.body;

		if (!path) {
			res.status(400).json({ error: 'Ruta de directorio requerida' });
			return;
		}

		const result = await createDirectory(path, options);
		res.json({ success: true, data: result });
	} catch (error) {
		logger.error('Error creando directorio:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor',
		});
	}
});

/**
 * PUT /api/files/rename - Renombrar un archivo
 */
router.put('/rename', async (req, res) => {
	try {
		const { oldPath, newPath, options } = req.body;

		if (!(oldPath && newPath)) {
			res.status(400).json({ error: 'Rutas oldPath y newPath requeridas' });
			return;
		}

		const result = await renameFile(oldPath, newPath, options);
		res.json({ success: true, data: result });
	} catch (error) {
		logger.error('Error renombrando archivo:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor',
		});
	}
});

/**
 * POST /api/files/copy - Copiar un archivo
 */
router.post('/copy', async (req, res) => {
	try {
		const { sourcePath, destPath, options } = req.body;

		if (!(sourcePath && destPath)) {
			res.status(400).json({ error: 'Rutas sourcePath y destPath requeridas' });
			return;
		}

		const result = await copyFile(sourcePath, destPath, options);
		res.json({ success: true, data: result });
	} catch (error) {
		logger.error('Error copiando archivo:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor',
		});
	}
});

/**
 * POST /api/files/move - Mover un archivo
 */
router.post('/move', async (req, res) => {
	try {
		const { sourcePath, destPath, options } = req.body;

		if (!(sourcePath && destPath)) {
			res.status(400).json({ error: 'Rutas sourcePath y destPath requeridas' });
			return;
		}

		const result = await moveFile(sourcePath, destPath, options);
		res.json({ success: true, data: result });
	} catch (error) {
		logger.error('Error moviendo archivo:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor',
		});
	}
});

export default router;

// Exportación nombrada para compatibilidad con server/index.ts
export { router as filesRouter };
