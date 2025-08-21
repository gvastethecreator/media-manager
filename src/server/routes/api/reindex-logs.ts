/**
 * @file Rutas API para logging de reindexado
 * @module server/routes/api/reindex-logs
 * @description Endpoints para consultar logs de errores y warnings del sistema de reindexado
 */

import express from 'express';
import { reindexFileLogger } from '../../../lib/logger/reindex-file-logger';
import { serverLogger } from '../../../lib/logger/server-logger';

export const reindexLogsRouter = express.Router();

/**
 * GET /api/reindex-logs/stats - Estadísticas de archivos de log
 */
reindexLogsRouter.get('/stats', (_req, res) => {
	try {
		const stats = reindexFileLogger.getLogStats();
		res.json({
			success: true,
			data: stats,
		});
	} catch (error) {
		serverLogger.error('Error obteniendo estadísticas de logs de reindexado:', error);
		res.status(500).json({
			success: false,
			error: 'Error obteniendo estadísticas de logs',
		});
	}
});

/**
 * GET /api/reindex-logs/errors - Logs de errores recientes
 */
reindexLogsRouter.get('/errors', (req, res) => {
	try {
		const maxLines = Number.parseInt(req.query.limit as string, 10) || 50;
		const errors = reindexFileLogger.readRecentLogs('error', maxLines);

		res.json({
			success: true,
			data: errors,
			count: errors.length,
		});
	} catch (error) {
		serverLogger.error('Error obteniendo logs de errores de reindexado:', error);
		res.status(500).json({
			success: false,
			error: 'Error obteniendo logs de errores',
		});
	}
});

/**
 * GET /api/reindex-logs/warnings - Logs de warnings recientes
 */
reindexLogsRouter.get('/warnings', (req, res) => {
	try {
		const maxLines = Number.parseInt(req.query.limit as string, 10) || 50;
		const warnings = reindexFileLogger.readRecentLogs('warning', maxLines);

		res.json({
			success: true,
			data: warnings,
			count: warnings.length,
		});
	} catch (error) {
		serverLogger.error('Error obteniendo logs de warnings de reindexado:', error);
		res.status(500).json({
			success: false,
			error: 'Error obteniendo logs de warnings',
		});
	}
});

/**
 * GET /api/reindex-logs/summary - Resumen de errores por fuente
 */
reindexLogsRouter.get('/summary', async (req, res) => {
	try {
		const days = Number.parseInt(req.query.days as string, 10) || 7;
		const summary = await reindexFileLogger.getErrorSummary(days);

		res.json({
			success: true,
			data: summary,
			period: `${days} days`,
		});
	} catch (error) {
		serverLogger.error('Error obteniendo resumen de logs de reindexado:', error);
		res.status(500).json({
			success: false,
			error: 'Error obteniendo resumen de logs',
		});
	}
});

/**
 * POST /api/reindex-logs/cleanup - Limpia logs antiguos
 */
reindexLogsRouter.post('/cleanup', (_req, res) => {
	try {
		reindexFileLogger.cleanupOldLogs();

		res.json({
			success: true,
			message: 'Limpieza de logs completada',
		});
	} catch (error) {
		serverLogger.error('Error en limpieza de logs de reindexado:', error);
		res.status(500).json({
			success: false,
			error: 'Error en limpieza de logs',
		});
	}
});

/**
 * GET /api/reindex-logs/recent - Logs combinados recientes (errores y warnings)
 */
reindexLogsRouter.get('/recent', (req, res) => {
	try {
		const maxLines = Number.parseInt(req.query.limit as string, 10) || 25;

		const errors = reindexFileLogger.readRecentLogs('error', maxLines);
		const warnings = reindexFileLogger.readRecentLogs('warning', maxLines);

		// Combinar y ordenar por timestamp
		const combined = [...errors, ...warnings]
			.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
			.slice(0, maxLines * 2); // Permitir más entradas para el combinado

		res.json({
			success: true,
			data: combined,
			count: combined.length,
			breakdown: {
				errors: errors.length,
				warnings: warnings.length,
			},
		});
	} catch (error) {
		serverLogger.error('Error obteniendo logs recientes de reindexado:', error);
		res.status(500).json({
			success: false,
			error: 'Error obteniendo logs recientes',
		});
	}
});
