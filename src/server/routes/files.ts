/**
 * @file Rutas de API para operaciones con archivos
 * @module server/routes/files
 * ✅ MIGRADO DESDE SERVER ACTIONS - 2025-07-03
 */

import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	getFileInfo,
	getDirectoryInfo,
	createDirectory,
	deleteFile,
	getFileAsDataUrl,
	renameFile,
	copyFile,
	moveFile,
} from '@/services/file/file.service';

const router = express.Router();
const logger = serverLogger.withContext('FilesAPI');

/**
 * GET /api/files/info/:path - Obtener información de un archivo
 */
router.get('/info/*', async (req, res) => {
	try {
		const filePath = req.params[0]; // Captura toda la ruta después de /info/

		if (!filePath) {
			return res.status(400).json({ error: 'Ruta de archivo requerida' });
		}

		const fileInfo = await getFileInfo(filePath);
		res.json({ success: true, data: fileInfo });
	} catch (error) {
		logger.error('Error obteniendo información del archivo:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor'
		});
	}
});

/**
 * GET /api/files/directory/:path - Obtener contenido de un directorio
 */
router.get('/directory/*', async (req, res) => {
	try {
		const dirPath = req.params[0]; // Captura toda la ruta después de /directory/

		if (!dirPath) {
			return res.status(400).json({ error: 'Ruta de directorio requerida' });
		}

		const directoryInfo = await getDirectoryInfo(dirPath);
		res.json({ success: true, data: directoryInfo });
	} catch (error) {
		logger.error('Error obteniendo contenido del directorio:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor'
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
			return res.status(400).json({ error: 'Ruta de directorio requerida' });
		}

		const result = await createDirectory(path, options);
		res.json({ success: true, data: result });
	} catch (error) {
		logger.error('Error creando directorio:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor'
		});
	}
});

/**
 * DELETE /api/files/:path - Eliminar un archivo
 */
router.delete('/*', async (req, res) => {
	try {
		const filePath = req.params[0]; // Captura toda la ruta

		if (!filePath) {
			return res.status(400).json({ error: 'Ruta de archivo requerida' });
		}

		const result = await deleteFile(filePath);
		res.json({ success: true, data: result });
	} catch (error) {
		logger.error('Error eliminando archivo:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor'
		});
	}
});

/**
 * GET /api/files/dataurl/:path - Obtener archivo como Data URL
 */
router.get('/dataurl/*', async (req, res) => {
	try {
		const filePath = req.params[0]; // Captura toda la ruta después de /dataurl/

		if (!filePath) {
			return res.status(400).json({ error: 'Ruta de archivo requerida' });
		}

		const dataUrl = await getFileAsDataUrl(filePath);
		res.json({ success: true, data: dataUrl });
	} catch (error) {
		logger.error('Error obteniendo Data URL:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor'
		});
	}
});

/**
 * PUT /api/files/rename - Renombrar un archivo
 */
router.put('/rename', async (req, res) => {
	try {
		const { oldPath, newPath, options } = req.body;

		if (!oldPath || !newPath) {
			return res.status(400).json({ error: 'Rutas oldPath y newPath requeridas' });
		}

		const result = await renameFile(oldPath, newPath, options);
		res.json({ success: true, data: result });
	} catch (error) {
		logger.error('Error renombrando archivo:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor'
		});
	}
});

/**
 * POST /api/files/copy - Copiar un archivo
 */
router.post('/copy', async (req, res) => {
	try {
		const { sourcePath, destPath, options } = req.body;

		if (!sourcePath || !destPath) {
			return res.status(400).json({ error: 'Rutas sourcePath y destPath requeridas' });
		}

		const result = await copyFile(sourcePath, destPath, options);
		res.json({ success: true, data: result });
	} catch (error) {
		logger.error('Error copiando archivo:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor'
		});
	}
});

/**
 * POST /api/files/move - Mover un archivo
 */
router.post('/move', async (req, res) => {
	try {
		const { sourcePath, destPath, options } = req.body;

		if (!sourcePath || !destPath) {
			return res.status(400).json({ error: 'Rutas sourcePath y destPath requeridas' });
		}

		const result = await moveFile(sourcePath, destPath, options);
		res.json({ success: true, data: result });
	} catch (error) {
		logger.error('Error moviendo archivo:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Error interno del servidor'
		});
	}
});

export default router;
