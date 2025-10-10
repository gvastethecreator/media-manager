/**
 * ⚡ FOLDER STATS - UTILIDADES DE CONCURRENCIA Y PROGRESO
 *
 * Funciones auxiliares para procesamiento concurrente y emisión de progreso
 */

import type { ProcessStatus } from '@/types/folders';

/**
 * Ejecuta tareas con concurrencia limitada preservando orden de resultados
 */
export async function mapWithConcurrency<T, R>(
	items: T[],
	limit: number,
	worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let cursor = 0;
	async function run(): Promise<void> {
		const i = cursor++;
		if (i >= items.length) return;
		results[i] = await worker(items[i], i);
		await run();
	}
	const effective = Math.max(1, Math.min(limit || 1, items.length || 1));
	await Promise.all(Array.from({ length: effective }, () => run()));
	return results;
}

/**
 * Emite progreso de forma segura (silencioso en tests o sin servidor)
 */
export async function safeEmitProgress(payload: ProcessStatus): Promise<void> {
	try {
		const { emitProgress } = await import('@/lib/server/events.server');
		await emitProgress('folder:progress', {
			...payload,
			timestamp: payload.timestamp || Date.now(),
		});
	} catch {
		// silencioso en tests o cuando no está el servidor
	}
}

/**
 * Calcula progreso global basado en fase actual (3 fases: index, thumbnails, metadata)
 * Cada fase representa 33% del progreso total (0-33, 33-66, 66-99)
 */
export function computeOverallProgress(stage: 1 | 2 | 3, stageProcessed: number, stageTotal: number): number {
	const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
	const base = stage === 1 ? 0 : stage === 2 ? 33 : 66;
	const portion = stageTotal > 0 ? (stageProcessed / stageTotal) * 33 : 0;
	return clamp(Math.floor(base + portion), 0, 99);
}
