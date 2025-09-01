// @ts-nocheck - Temporary suppression for Express handler parameter types
/**
 * Rutas API para el sistema avanzado de extracción de metadatos
 * Soporta detección completa de IA engines y metadatos técnicos
 */

import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
import { createFileNotFoundError, ServiceErrorCode, toServiceError } from '@/lib/utils/errors/service-errors';

const router = express.Router() as any;

// Log para verificar que el router se carga
const logger = serverLogger.withContext('MetadataAdvancedAPI');
logger.info('🤖 Router metadata-advanced cargado correctamente');

/**
 * GET /api/metadata-advanced/test
 * Ruta de prueba para verificar que el router funciona
 */
router.get('/test', (_req, res) => {
	logger.info('✅ Ruta /test ejecutándose');
	res.json({
		success: true,
		message: 'Router metadata-advanced funcionando correctamente',
		timestamp: new Date().toISOString(),
	});
});

/**
 * GET /api/metadata-advanced/simple-test
 * Otra ruta de prueba
 */
router.get('/simple-test', (req, res) => {
	logger.info('✅ Ruta /simple-test ejecutándose');
	res.json({
		success: true,
		message: 'Ruta simple de prueba',
		path: req.path,
		originalUrl: req.originalUrl,
		method: req.method,
	});
});

/**
 * POST /api/metadata-advanced/extract-from-path
 * Extraer metadata de un archivo específico por su ruta
 */
router.post('/extract-from-path', async (req, res) => {
	try {
		const { filePath } = req.body;

		if (!filePath || typeof filePath !== 'string') {
			return res.status(400).json({
				error: 'Path del archivo requerido',
				message: 'Debe proporcionar un filePath válido en el body de la request',
			});
		}

		logger.info('🔍 Extrayendo metadata', { filePath });

		// Importar el servicio de metadata integration
		const { extractAllMetadata } = await import('@/server/services/metadata/unified-parser.service');

		// Validar existencia y permisos de lectura antes de leer
		const fsp = await import('node:fs/promises');
		const { constants } = await import('node:fs');
		try {
			await fsp.access(filePath, constants.R_OK);
		} catch (e: any) {
			if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) {
				const err = createFileNotFoundError(filePath, { op: 'metadata-extract' }, 'MetadataAdvancedAPI');
				res.status(err.httpStatus).json({ error: true, code: err.code, message: err.message });
				return;
			}
			if (e && (e.code === 'EACCES' || e.code === 'EPERM')) {
				const err = toServiceError(e, {
					code: ServiceErrorCode.FILE_ACCESS_DENIED,
					message: `Permiso denegado al leer: ${filePath}`,
					serviceName: 'MetadataAdvancedAPI',
				});
				res.status(err.httpStatus).json({ error: true, code: err.code, message: err.message });
				return;
			}
			throw e;
		}

		// Leer el archivo como buffer
		const fileBuffer = await fsp.readFile(filePath);

		// Extraer metadata del archivo usando el servicio unificado
		const path = await import('node:path');
		const filename = path.basename(filePath);
		const metadata = await extractAllMetadata(fileBuffer, filename, {}, filePath);

		logger.info('✅ Metadata extraída', { filePath, size: fileBuffer.length });

		res.json({
			success: true,
			filePath,
			metadata,
			extractedAt: new Date().toISOString(),
		});
	} catch (error) {
		logger.error('❌ Error al extraer metadata', { error, filePath: req.body?.filePath });
		// Mapear errores comunes del FS a respuestas adecuadas
		const err = toServiceError(error, {
			code: ServiceErrorCode.FILE_READ_ERROR,
			message: 'Error al extraer metadata',
			serviceName: 'MetadataAdvancedAPI',
		});
		res
			.status(err.httpStatus)
			.json({ error: true, code: err.code, message: err.message, filePath: req.body?.filePath });
	}
});

export default router;
