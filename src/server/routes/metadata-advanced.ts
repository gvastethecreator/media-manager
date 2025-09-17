/**
 * Rutas API para el sistema avanzado de extracción de metadatos
 * Soporta detección completa de IA engines y metadatos técnicos
 */

import { Router, type Request, type Response } from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
import { createFileNotFoundError, ServiceErrorCode, toServiceError } from '@/lib/utils/errors/service-errors';

const router = Router();
const logger = serverLogger.withContext('MetadataAdvancedAPI');

logger.info('🔧 Router metadata-advanced cargado correctamente');

type ExtractMetadataRequest = Request<
	unknown,
	unknown,
	{
		filePath?: string;
	}
>;

router.get('/test', (_req: Request, res: Response) => {
	logger.info('✅ Ruta /test ejecutándose');
	res.json({
		success: true,
		message: 'Router metadata-advanced funcionando correctamente',
		timestamp: new Date().toISOString(),
	});
});

router.get('/simple-test', (req: Request, res: Response) => {
	logger.info('✅ Ruta /simple-test ejecutándose');
	res.json({
		success: true,
		message: 'Ruta simple de prueba',
		path: req.path,
		originalUrl: req.originalUrl,
		method: req.method,
	});
});

router.post('/extract-from-path', async (req: ExtractMetadataRequest, res: Response) => {
	try {
		const { filePath } = req.body ?? {};

		if (!filePath || typeof filePath !== 'string') {
			res.status(400).json({
				error: 'Path del archivo requerido',
				message: 'Debe proporcionar un filePath válido en el body de la request',
			});
			return;
		}

		logger.info('🧠 Extrayendo metadata', { filePath });

		const { extractAllMetadata } = await import('@/server/services/metadata/unified-parser.service');
		const fsp = await import('node:fs/promises');
		const { constants } = await import('node:fs');

		try {
			await fsp.access(filePath, constants.R_OK);
		} catch (error: unknown) {
			if (error && typeof error === 'object' && 'code' in error) {
				const code = (error as { code?: string }).code;
				if (code === 'ENOENT' || code === 'ENOTDIR') {
					const err = createFileNotFoundError(filePath, { op: 'metadata-extract' }, 'MetadataAdvancedAPI');
					res.status(err.httpStatus).json({ error: true, code: err.code, message: err.message });
					return;
				}
				if (code === 'EACCES' || code === 'EPERM') {
					const err = toServiceError(error, {
						code: ServiceErrorCode.FILE_ACCESS_DENIED,
						message: `Permiso denegado al leer: ${filePath}`,
						serviceName: 'MetadataAdvancedAPI',
					});
					res.status(err.httpStatus).json({ error: true, code: err.code, message: err.message });
					return;
				}
			}
			throw error;
		}

		const fileBuffer = await fsp.readFile(filePath);
		const pathModule = await import('node:path');
		const filename = pathModule.basename(filePath);
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
		const err = toServiceError(error, {
			code: ServiceErrorCode.FILE_READ_ERROR,
			message: 'Error al extraer metadata',
			serviceName: 'MetadataAdvancedAPI',
		});
		res.status(err.httpStatus).json({
			error: true,
			code: err.code,
			message: err.message,
			filePath: req.body?.filePath,
		});
	}
});

export default router;
