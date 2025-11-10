/**
 * @file FASE 3: Eliminación de carpetas inexistentes
 * @module services/folders/reindex/phases
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from '../../folder-reindex-types';

const logger = serverLogger.withContext('FolderReindex:Phase3');

/**
 * FASE 3: 🗑️ ELIMINACIÓN DE CARPETAS INEXISTENTES
 * Elimina de la BD las carpetas que ya no existen físicamente
 */
export async function phase3_removeNonExistentFolders(
	analysisResult: ReindexAnalysisResult,
	options: ReindexOptions
): Promise<ReindexPhaseResult> {
	const startTime = Date.now();
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

		const { db } = await import('@/lib/drizzle');
		const { folders } = await import('@/lib/drizzle/schema/index');
		const { inArray } = await import('drizzle-orm');

		// Eliminar carpetas inexistentes (esto también eliminará su contenido en cascada)
		const folderIdsToDelete = analysisResult.missingFolders.map((f: { id: string }) => f.id);

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
