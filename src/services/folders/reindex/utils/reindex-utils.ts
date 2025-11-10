/**
 * @file Utilidades para el servicio de reindexado
 * @module services/folders/reindex/utils
 */

import { emitProgress as serverEmitProgress } from '@/lib/server/events.server';
import type { ProcessStatus } from '@/types/folders';

/**
 * Emite eventos de progreso si está habilitado
 * 🔧 FIX: Emite 'folder:reindexAll:progress' para eventos globales
 */
export async function emitReindexProgress(phase: string, progress: number, message: string): Promise<void> {
	try {
		// 🎯 Usar evento correcto para reindexado global
		await serverEmitProgress('folder:reindexAll:progress', {
			isProcessing: progress < 100,
			folderId: undefined,
			phase,
			progress,
			filesProcessed: 0,
			totalFiles: 0,
			message,
			timestamp: Date.now(),
		} as ProcessStatus);
	} catch (error) {
		// Silencioso - no bloquear el proceso por errores de eventos
	}
}

/**
 * Estima el tiempo de procesamiento basado en la cantidad de archivos y carpetas
 */
export function estimateProcessingTime(totalFiles: number, totalFolders: number): number {
	// Estimación basada en benchmarks típicos:
	// - ~100ms por archivo (indexado + thumbnail + metadata)
	// - ~50ms por carpeta (análisis + estructura)
	return totalFiles * 100 + totalFolders * 50;
}
