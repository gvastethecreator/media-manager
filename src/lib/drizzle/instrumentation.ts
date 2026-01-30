import { type SQL } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { serverLogger } from '@/lib/logger/server-logger';

const perfLogger = serverLogger.withContext('DB:Perf');

export interface QueryMetrics {
	label: string;
	ms: number;
	rows: number | null;
	iso: string;
}

/**
 * Ejecuta db.all(sql) midiendo latencia y filas devueltas.
 * Loggea en nivel debug (<50ms) o info (>=50ms) para análisis p95.
 */
export async function instrumentedAll<T = unknown>(label: string, query: SQL): Promise<T[]> {
	const start = performance.now();
	const rows = (await db.all(query)) as T[];
	const ms = performance.now() - start;
	const metrics: QueryMetrics = {
		label,
		ms: Math.round(ms * 100) / 100,
		rows: rows?.length ?? null,
		iso: new Date().toISOString(),
	};
	if (ms >= 50) {
		perfLogger.info('query', metrics);
	} else {
		perfLogger.debug('query', metrics);
	}
	return rows;
}
