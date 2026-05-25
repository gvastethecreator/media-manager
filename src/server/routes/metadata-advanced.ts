/**
 * Rutas API para el sistema avanzado de extracción de metadatos
 * Soporta detección completa de IA engines y metadatos técnicos
 */

import express from 'express';
import { Effect } from 'effect';
import { serverLogger } from '@/lib/logger/server-logger';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { createFileNotFoundError, ServiceErrorCode, toServiceError } from '@/lib/utils/errors/service-errors';

const router = express.Router();

// Log para verificar que el router se carga
const logger = serverLogger.withContext('MetadataAdvancedAPI');
logger.info('🤖 Router metadata-advanced cargado correctamente');

/**
 * GET /api/metadata-advanced/test
 * Ruta de prueba para verificar que el router funciona
 */
router.get('/test', effectHandler(() =>
	Effect.succeed({
		success: true,
		message: 'Router metadata-advanced funcionando correctamente',
		timestamp: new Date().toISOString(),
	})
));

/**
 * GET /api/metadata-advanced/simple-test
 * Otra ruta de prueba
 */
router.get('/simple-test', effectHandler((req) =>
	Effect.succeed({
		success: true,
		message: 'Ruta simple de prueba',
		path: req.path,
		originalUrl: req.originalUrl,
		method: req.method,
	})
));

/**
 * POST /api/metadata-advanced/extract-from-path
 * Extraer metadata de un archivo específico por su ruta
 */
router.post('/extract-from-path', effectHandler((req) =>
	Effect.tryPromise({
		try: async () => {
			const { filePath } = req.body;

			if (!filePath || typeof filePath !== 'string') {
				throw Object.assign(new Error('Debe proporcionar un filePath válido en el body de la request'), { _tag: 'ValidationError' });
			}

			logger.info('🔍 Extrayendo metadata', { filePath });

			const { extractAllMetadata } = await import('@/server/services/metadata/unified-parser.service');

			const fsp = await import('node:fs/promises');
			const { constants } = await import('node:fs');

			try {
				await fsp.access(filePath, constants.R_OK);
			} catch (e: any) {
				if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) {
					const err = createFileNotFoundError(filePath, { op: 'metadata-extract' }, 'MetadataAdvancedAPI');
					throw Object.assign(new Error(err.message), { _tag: 'FileNotFound', status: err.httpStatus, _code: err.code });
				}
				if (e && (e.code === 'EACCES' || e.code === 'EPERM')) {
					const err = toServiceError(e, {
						code: ServiceErrorCode.FILE_ACCESS_DENIED,
						message: `Permiso denegado al leer: ${filePath}`,
						serviceName: 'MetadataAdvancedAPI',
					});
					throw Object.assign(new Error(err.message), { status: err.httpStatus, _code: err.code });
				}
				throw e;
			}

			const fileBuffer = await fsp.readFile(filePath);

			const path = await import('node:path');
			const filename = path.basename(filePath);
			const metadata = await extractAllMetadata(fileBuffer, filename, {}, filePath);

			logger.info('✅ Metadata extraída', { filePath, size: fileBuffer.length });

			return {
				success: true,
				filePath,
				metadata,
				extractedAt: new Date().toISOString(),
			};
		},
		catch: (error) => new Error(String(error)),
	})
));

export default router;
