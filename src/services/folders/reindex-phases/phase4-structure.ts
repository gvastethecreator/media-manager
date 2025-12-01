/**
 * @file FASE 4: Construcción de estructura de subcarpetas
 * @description Crea las subcarpetas encontradas en el sistema de archivos
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from '../folder-reindex-types';

const logger = serverLogger.withContext('ReindexPhase4');

/**
 * FASE 4: 🌳 CONSTRUCCIÓN DE ESTRUCTURA DE SUBCARPETAS
 * Crea las subcarpetas encontradas en el sistema de archivos
 */
export async function phase4_buildSubfolderStructure(
	analysisResult: ReindexAnalysisResult,
	_options: ReindexOptions
): Promise<ReindexPhaseResult> {
	const startTime = Date.now();
	logger.info('🌳 Construyendo estructura de subcarpetas');

	const errors: string[] = [];
	let processed = 0;

	try {
		if (analysisResult.newSubfolders.length === 0) {
			logger.info('✅ No hay nuevas subcarpetas para crear');
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
		const { generateFolderIdFromName } = await import('@/lib/utils/folder-id-generator');

		// Crear subcarpetas ordenadas por profundidad (padres primero)
		const sortedSubfolders = analysisResult.newSubfolders.sort((a, b) => {
			const depthA = a.path.split(/[\\/]/).length;
			const depthB = b.path.split(/[\\/]/).length;
			return depthA - depthB;
		});

		for (const subfolder of sortedSubfolders) {
			try {
				const folderId = await generateFolderIdFromName(subfolder.name);

				await db.insert(folders).values({
					id: folderId,
					name: subfolder.name,
					path: subfolder.path,
					parentId: subfolder.parentId,
					totalFiles: 0,
					totalSize: 0,
					lastIndexed: new Date(),
					description: null,
					emoji: null,
					color: null,
					featuredImage: null,
					isFavorite: false,
					presetId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				processed++;
				logger.debug(`✅ Subcarpeta creada: ${subfolder.path}`);
			} catch (error) {
				const errorMsg = `Error creando subcarpeta ${subfolder.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
				errors.push(errorMsg);
				logger.error(errorMsg);
			}
		}

		logger.info('✅ Construcción de estructura completada', {
			procesadas: processed,
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
		logger.error('❌ Error construyendo estructura:', error);
		return {
			success: false,
			processed,
			failed: analysisResult.newSubfolders.length - processed,
			errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
			duration: Date.now() - startTime,
		};
	}
}
