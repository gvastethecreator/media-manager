/**
 * Constantes para el servicio de estadísticas
 */

import { serverLogger } from '@/lib/logger/server-logger';

/**
 * Tag de caché para Next.js
 */
export const STATS_CACHE_TAG = 'stats';

/**
 * Tiempo de revalidación de caché (5 minutos)
 */
export const STATS_REVALIDATE_SECONDS = 300;

/**
 * Logger dedicado para estadísticas
 */
export const statsLogger = serverLogger.withContext('StatsService');

/**
 * Códigos de error del servicio (enfoque funcional sin enum)
 */
export const StatsErrorCode = {
	NOT_FOUND: 'NOT_FOUND',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	OPERATION_FAILED: 'OPERATION_FAILED',
	ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
} as const;

export type StatsErrorCode = (typeof StatsErrorCode)[keyof typeof StatsErrorCode];

/**
 * Factory para crear errores tipados del servicio de estadísticas
 */
export const createStatsError = (
	message: string,
	code: StatsErrorCode = StatsErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'StatsError';
	Object.assign(error, { code, cause });
	return error;
};
