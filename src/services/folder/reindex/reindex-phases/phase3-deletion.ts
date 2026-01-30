/**
 * @file FASE 3: Eliminación de carpetas inexistentes
 * @description Elimina de la BD las carpetas que ya no existen físicamente
 *
 * ⚠️ IMPORTANTE: Esta fase NO se ejecuta cuando:
 * - Se reindexá una carpeta específica (folderId definido)
 * - Es un reindexado parcial de una carpeta recién agregada
 *
 * Esto evita que carpetas con rutas remotas (Windows desde WSL, NAS, etc.)
 * sean eliminadas incorrectamente por no ser accesibles desde el servidor.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from '../folder-reindex-types';

const logger = serverLogger.withContext('ReindexPhase3');

/**
 * FASE 3: 🗑️ ELIMINACIÓN DE CARPETAS INEXISTENTES
 * Elimina de la BD las carpetas que ya no existen físicamente
 *
 * ⚠️ SKIP: Cuando se reindexá una carpeta específica (folderId) no se ejecuta
 * la eliminación para evitar borrar carpetas con rutas no accesibles desde el servidor.
 */
export async function phase3_removeNonExistentFolders(
	analysisResult: ReindexAnalysisResult,
	options: ReindexOptions
): Promise<ReindexPhaseResult> {
	const startTime = Date.now();

	// ⚠️ SKIP: Si se está reindexando una carpeta específica, no eliminar nada
	// Esto protege carpetas con rutas remotas (Windows desde WSL, NAS, etc.)
	if (options.folderId) {
		logger.info('⏭️ Saltando eliminación de carpetas (reindexado de carpeta específica)', {
			folderId: options.folderId,
			missingFolders: analysisResult.missingFolders.length,
		});
		return {
			success: true,
			processed: 0,
			failed: 0,
			errors: [],
			duration: Date.now() - startTime,
			skipped: true,
		} as ReindexPhaseResult;
	}

	logger.info('🗑️ Eliminando carpetas inexistentes de la base de datos');

	const errors: string[] = [];
	let processed = 0;

	try {
		if (analysisResult.missingFolders.length === 0) {
			logger.info('✅ No hay carpetas inexistentes para eliminar');
			return {
				success: true,
				processed: 0,
				failed: 0,
				errors: [],
				duration: Date.now() - startTime,
			};
		}

		// Usar el servicio de sincronización que ya maneja la limpieza en cascada
		const { syncFoldersWithFileSystem } = await import('@/lib/filesystem/folder-sync');
		const syncResult = await syncFoldersWithFileSystem({
			dryRun: false,
			forceSync: true,
		});

		processed = syncResult.removed.length;
		errors.push(...syncResult.errors);

		logger.info('✅ Eliminación de carpetas inexistentes completada', {
			eliminadas: processed,
			errores: errors.length,
		});

		return {
			success: errors.length === 0,
			processed,
			failed: errors.length,
			errors,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		logger.error('❌ Error eliminando carpetas inexistentes:', error);
		return {
			success: false,
			processed,
			failed: analysisResult.missingFolders.length - processed,
			errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
			duration: Date.now() - startTime,
		};
	}
}
