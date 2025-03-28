/**
 * Monitor de aplicación para Next.js
 *
 * Este módulo proporciona funcionalidades para monitorear el rendimiento
 * de la aplicación y mostrar estadísticas en tiempo real.
 */

import { serverLogger } from '../logger/server-logger';
import { logSystemShutdown, logSystemStartup, logSystemStatsOnce, startSystemMonitor } from './system-monitor';

// Logger específico para el monitor de aplicación
const appLogger = serverLogger.withContext('AppMonitor');

// Interfaz para las estadísticas de la aplicación
interface AppStats {
	requests: {
		total: number;
		success: number;
		error: number;
		pending: number;
	};
	performance: {
		avgResponseTime: number;
		minResponseTime: number;
		maxResponseTime: number;
		p95ResponseTime: number;
	};
	errors: {
		count: number;
		lastError?: Error;
		byType: Record<string, number>;
	};
	database: {
		queries: number;
		avgQueryTime: number;
		slowQueries: number;
	};
	cache: {
		hits: number;
		misses: number;
		ratio: number;
	};
}

// Estado global de las estadísticas
const appStatsState: AppStats = {
	requests: {
		total: 0,
		success: 0,
		error: 0,
		pending: 0,
	},
	performance: {
		avgResponseTime: 0,
		minResponseTime: 0,
		maxResponseTime: 0,
		p95ResponseTime: 0,
	},
	errors: {
		count: 0,
		byType: {},
	},
	database: {
		queries: 0,
		avgQueryTime: 0,
		slowQueries: 0,
	},
	cache: {
		hits: 0,
		misses: 0,
		ratio: 0,
	},
};

// Historial de tiempos de respuesta para cálculos estadísticos
const responseTimes: number[] = [];
const MAX_RESPONSE_TIMES = 1000; // Limitar el historial para evitar problemas de memoria

/**
 * Registra una solicitud HTTP
 * @param status Código de estado HTTP
 * @param responseTime Tiempo de respuesta en ms
 */
export function trackRequest(status: number, responseTime: number): void {
	// Actualizar contadores de solicitudes
	appStatsState.requests.total++;

	if (status >= 200 && status < 400) {
		appStatsState.requests.success++;
	} else if (status >= 400) {
		appStatsState.requests.error++;
	}

	// Actualizar tiempos de respuesta
	responseTimes.push(responseTime);
	if (responseTimes.length > MAX_RESPONSE_TIMES) {
		responseTimes.shift(); // Eliminar el más antiguo
	}

	// Recalcular estadísticas de rendimiento
	if (responseTimes.length > 0) {
		const sum = responseTimes.reduce((a, b) => a + b, 0);
		appStatsState.performance.avgResponseTime = sum / responseTimes.length;
		appStatsState.performance.minResponseTime = Math.min(...responseTimes);
		appStatsState.performance.maxResponseTime = Math.max(...responseTimes);

		// Calcular percentil 95
		const sortedTimes = [...responseTimes].sort((a, b) => a - b);
		const p95Index = Math.floor(sortedTimes.length * 0.95);
		appStatsState.performance.p95ResponseTime = sortedTimes[p95Index] || 0;
	}
}

/**
 * Registra una solicitud pendiente
 * @param increment Incremento (1) o decremento (-1)
 */
export function trackPendingRequest(increment: 1 | -1): void {
	appStatsState.requests.pending += increment;
	// Asegurar que no sea negativo
	if (appStatsState.requests.pending < 0) {
		appStatsState.requests.pending = 0;
	}
}

/**
 * Registra un error
 * @param error Objeto de error
 * @param type Tipo de error (opcional)
 */
export function trackError(error: Error, type = 'general'): void {
	appStatsState.errors.count++;
	appStatsState.errors.lastError = error;

	// Incrementar contador por tipo
	if (!appStatsState.errors.byType[type]) {
		appStatsState.errors.byType[type] = 0;
	}
	appStatsState.errors.byType[type]++;
}

/**
 * Registra una consulta a la base de datos
 * @param queryTime Tiempo de consulta en ms
 * @param isSlow Indica si es una consulta lenta
 */
export function trackDatabaseQuery(queryTime: number, isSlow = false): void {
	appStatsState.database.queries++;

	// Actualizar tiempo promedio
	const prevTotal = appStatsState.database.avgQueryTime * (appStatsState.database.queries - 1);
	appStatsState.database.avgQueryTime = (prevTotal + queryTime) / appStatsState.database.queries;

	// Incrementar contador de consultas lentas
	if (isSlow) {
		appStatsState.database.slowQueries++;
	}
}

/**
 * Registra un acceso a la caché
 * @param isHit Indica si fue un acierto o fallo
 */
export function trackCacheAccess(isHit: boolean): void {
	if (isHit) {
		appStatsState.cache.hits++;
	} else {
		appStatsState.cache.misses++;
	}

	// Recalcular ratio
	const total = appStatsState.cache.hits + appStatsState.cache.misses;
	appStatsState.cache.ratio = total > 0 ? appStatsState.cache.hits / total : 0;
}

/**
 * Obtiene las estadísticas actuales de la aplicación
 * @returns Objeto con estadísticas de la aplicación
 */
export function getAppStats(): AppStats {
	return { ...appStatsState };
}

/**
 * Muestra estadísticas de la aplicación en la consola
 */
function logAppStats(): void {
	const stats = getAppStats();

	appLogger.separator('Estadísticas de la Aplicación');

	// Solicitudes
	appLogger.info('Solicitudes', {
		total: stats.requests.total,
		success: stats.requests.success,
		error: stats.requests.error,
		pending: stats.requests.pending,
		successRate:
			stats.requests.total > 0 ? `${((stats.requests.success / stats.requests.total) * 100).toFixed(2)}%` : 'N/A',
	});

	// Rendimiento
	appLogger.info('Rendimiento', {
		promedio: `${stats.performance.avgResponseTime.toFixed(2)}ms`,
		mínimo: `${stats.performance.minResponseTime.toFixed(2)}ms`,
		máximo: `${stats.performance.maxResponseTime.toFixed(2)}ms`,
		p95: `${stats.performance.p95ResponseTime.toFixed(2)}ms`,
	});

	// Errores
	appLogger.info('Errores', {
		total: stats.errors.count,
		porTipo: stats.errors.byType,
		último: stats.errors.lastError
			? {
					mensaje: stats.errors.lastError.message,
					tipo: stats.errors.lastError.name,
				}
			: 'Ninguno',
	});

	// Base de datos
	appLogger.info('Base de Datos', {
		consultas: stats.database.queries,
		tiempoPromedio: `${stats.database.avgQueryTime.toFixed(2)}ms`,
		consultasLentas: stats.database.slowQueries,
	});

	// Caché
	appLogger.info('Caché', {
		aciertos: stats.cache.hits,
		fallos: stats.cache.misses,
		ratio: `${(stats.cache.ratio * 100).toFixed(2)}%`,
	});

	// Barras de progreso
	if (stats.requests.total > 0) {
		appLogger.progress('Tasa de Éxito', (stats.requests.success / stats.requests.total) * 100);
	}

	if (stats.cache.hits + stats.cache.misses > 0) {
		appLogger.progress('Ratio de Caché', stats.cache.ratio * 100);
	}

	appLogger.separatorEnd();
}

/**
 * Inicia el monitor de aplicación
 * @param options Opciones de configuración
 * @returns Función para detener el monitor
 */
export async function start(
	options: {
		interval?: number;
		includeSystemStats?: boolean;
		systemStatsInterval?: number;
	} = {}
): Promise<() => void> {
	const { interval = 60000, includeSystemStats = true, systemStatsInterval = 300000 } = options;

	// Mostrar estadísticas iniciales
	logAppStats();

	// Configurar intervalo para estadísticas de la aplicación
	const appTimer = setInterval(() => {
		logAppStats();
	}, interval);

	// Iniciar monitor de sistema si se solicita
	let stopSystemMonitor: (() => void) | null = null;
	if (includeSystemStats) {
		stopSystemMonitor = await startSystemMonitor(systemStatsInterval);
	}

	// Devolver función para detener ambos monitores
	return () => {
		clearInterval(appTimer);
		if (stopSystemMonitor) {
			stopSystemMonitor();
		}
		appLogger.info('Monitor de aplicación detenido');
	};
}

/**
 * Muestra estadísticas de la aplicación una sola vez
 * @param includeSystemStats Indica si se deben incluir estadísticas del sistema
 */
export async function logAppStatsOnce(includeSystemStats = true): Promise<void> {
	logAppStats();
	if (includeSystemStats) {
		await logSystemStatsOnce();
	}
}

/**
 * Registra estadísticas de la aplicación al inicio
 */
export async function logAppStartup(): Promise<void> {
	appLogger.separator('Inicio de la Aplicación');
	appLogger.info('Aplicación iniciada', {
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || 'development',
		nextVersion: process.env.NEXT_RUNTIME || 'unknown',
	});
	appLogger.separatorEnd();

	// Registrar estadísticas del sistema
	await logSystemStartup();
}

/**
 * Registra estadísticas de la aplicación al cierre
 */
export async function logAppShutdown(): Promise<void> {
	appLogger.separator('Cierre de la Aplicación');
	appLogger.info('Aplicación cerrando', {
		uptime: formatUptime(process.uptime()),
		requests: appStatsState.requests.total,
		errors: appStatsState.errors.count,
	});
	appLogger.separatorEnd();

	// Registrar estadísticas del sistema
	await logSystemShutdown();
}

// Formatea segundos a una unidad legible (duplicado de system-monitor para evitar dependencias circulares)
function formatUptime(seconds: number): string {
	const days = Math.floor(seconds / (3600 * 24));
	const hours = Math.floor((seconds % (3600 * 24)) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	const parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

	return parts.join(' ');
}

// Exportar funciones principales como un objeto para retrocompatibilidad con código existente
export const appMonitor = {
	trackRequest,
	trackPendingRequest,
	trackError,
	trackDatabaseQuery,
	trackCacheAccess,
	getAppStats,
	start,
	logStatsOnce: logAppStatsOnce,
	logStartup: logAppStartup,
	logShutdown: logAppShutdown,
};
