/**
 * @file FASE 8: Verificación final
 * @description Verifica que todo el proceso se completó correctamente
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from '../folder-reindex-types';

const logger = serverLogger.withContext('ReindexPhase8');

/**
 * FASE 8: ✅ VERIFICACIÓN FINAL
 * Verifica que todo el proceso se completó correctamente
 */
export async function phase8_verifyIntegrity(
	analysisResult: ReindexAnalysisResult,
	_options: ReindexOptions
): Promise<ReindexPhaseResult> {
	const startTime = Date.now();
	logger.info('✅ Iniciando verificación final');

	const errors: string[] = [];
	let processed = 0;

	try {
		const { db } = await import('@/lib/drizzle');
		const { folders, images } = await import('@/lib/drizzle/schema/index');
		const { eq, inArray, sql } = await import('drizzle-orm');

		// Verificar que todas las carpetas existentes están en BD
		for (const folder of analysisResult.existingFolders) {
			try {
				const folderInDB = await db.select({ id: folders.id }).from(folders).where(eq(folders.id, folder.id)).limit(1);

				if (folderInDB.length === 0) {
					errors.push(`Carpeta faltante en BD: ${folder.path}`);
				} else {
					processed++;
				}
			} catch (error) {
				errors.push(
					`Error verificando carpeta ${folder.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`
				);
			}
		}

		// Verificar estadísticas generales
		const stats = await db
			.select({
				totalFolders: sql<number>`COUNT(*)`,
			})
			.from(folders)
			.where(
				inArray(
					folders.id,
					analysisResult.existingFolders.map((f) => f.id)
				)
			);

		const imageStats = await db
			.select({
				totalImages: sql<number>`COUNT(*)`,
			})
			.from(images)
			.where(
				inArray(
					images.folderId,
					analysisResult.existingFolders.map((f) => f.id)
				)
			);

		logger.info('📊 Estadísticas finales:', {
			carpetas: stats[0]?.totalFolders || 0,
			imagenes: imageStats[0]?.totalImages || 0,
			erroresVerificacion: errors.length,
		});

		return {
			success: errors.length === 0,
			processed,
			failed: errors.length,
			errors,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		logger.error('❌ Error en verificación final:', error);
		return {
			success: false,
			processed,
			failed: analysisResult.totalFolders - processed,
			errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
			duration: Date.now() - startTime,
		};
	}
}
