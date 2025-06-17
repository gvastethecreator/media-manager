import { NextResponse } from 'next/server';
import { serverLogger } from '@/lib/logger/server-logger';
import { appMonitor } from '@/lib/server/app-monitor';

// Logger específico para esta ruta
const logger = serverLogger.withContext('AppStatsAPI');

/**
 * Ruta de API para obtener estadísticas de la aplicación
 *
 * Proporciona información sobre solicitudes, rendimiento, errores,
 * base de datos y caché.
 */
export async function GET() {
	try {
		logger.info('Solicitud de estadísticas de la aplicación recibida');

		// Obtener estadísticas de la aplicación
		const rawStats = appMonitor.getStats();

		// Formatear estadísticas para la API
		const stats = {
			requests: {
				total: rawStats.requests.total,
				success: rawStats.requests.success,
				error: rawStats.requests.error,
				pending: rawStats.requests.pending,
				successRate:
					rawStats.requests.total > 0
						? `${((rawStats.requests.success / rawStats.requests.total) * 100).toFixed(2)}%`
						: 'N/A',
			},
			performance: {
				avgResponseTime: `${rawStats.performance.avgResponseTime.toFixed(2)}ms`,
				minResponseTime: `${rawStats.performance.minResponseTime.toFixed(2)}ms`,
				maxResponseTime: `${rawStats.performance.maxResponseTime.toFixed(2)}ms`,
				p95ResponseTime: `${rawStats.performance.p95ResponseTime.toFixed(2)}ms`,
			},
			errors: {
				count: rawStats.errors.count,
				byType: rawStats.errors.byType,
				last: rawStats.errors.lastError
					? {
							mensaje: rawStats.errors.lastError.message,
							tipo: rawStats.errors.lastError.name,
						}
					: undefined,
			},
			database: {
				queries: rawStats.database.queries,
				avgQueryTime: `${rawStats.database.avgQueryTime.toFixed(2)}ms`,
				slowQueries: rawStats.database.slowQueries,
			},
			cache: {
				hits: rawStats.cache.hits,
				misses: rawStats.cache.misses,
				ratio: `${(rawStats.cache.ratio * 100).toFixed(2)}%`,
			},
		};

		logger.info('Estadísticas de la aplicación enviadas', {
			requests: stats.requests.total,
			errors: stats.errors.count,
		});

		return NextResponse.json(stats);
	} catch (error) {
		logger.error('Error al obtener estadísticas de la aplicación', {
			error: error instanceof Error ? error.message : String(error),
		});

		return NextResponse.json(
			{
				error: 'Error al obtener estadísticas de la aplicación',
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
