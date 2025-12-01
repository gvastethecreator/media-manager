import { Router } from 'express';
import type { ExpressHandler } from '@/lib/express-types';
import { serverLogger } from '@/lib/logger/server-logger';
import { FileEntityMapperService } from '@/services/file-entity-mapper/file-entity-mapper.service';

const router = Router();
const fileEntityMapperService = FileEntityMapperService.getInstance();

/**
 * Endpoint de diagnóstico para validar mapeo de tipos de entidad
 * POST /api/debug-entity-types/test
 */
router.post('/test', (async (req, res) => {
	try {
		const { extensions } = req.body;

		if (!(extensions && Array.isArray(extensions))) {
			return res.status(400).json({
				error: 'Se requiere un array de extensiones en el body',
			});
		}

		const results = extensions.map((ext: string) => {
			const entityType = fileEntityMapperService.getEntityTypeFromExtension(ext);
			return {
				extension: ext,
				entityType,
				isSupported: entityType !== 'unknown',
			};
		});

		res.json({
			success: true,
			results,
			summary: {
				total: results.length,
				supported: results.filter((r) => r.isSupported).length,
				unsupported: results.filter((r) => !r.isSupported).length,
			},
		});
	} catch (error) {
		serverLogger.error('Error en test de mapeo de tipos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			details: error instanceof Error ? error.message : String(error),
		});
	}
}) as ExpressHandler);

export default router;
