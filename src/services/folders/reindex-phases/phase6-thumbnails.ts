/**
 * @file FASE 6: Generación de thumbnails
 * @description Genera thumbnails para todos los archivos indexados
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from '../folder-reindex-types';

const logger = serverLogger.withContext('ReindexPhase6');

/**
 * FASE 6: 🖼️ GENERACIÓN DE THUMBNAILS
 * Genera thumbnails para todos los archivos indexados
 */
export async function phase6_generateThumbnails(
	analysisResult: ReindexAnalysisResult,
	_options: ReindexOptions
): Promise<ReindexPhaseResult> {
	const startTime = Date.now();
	logger.info('🖼️ Iniciando generación de thumbnails');

	const errors: string[] = [];
	let processed = 0;

	try {
		const { bulkGenerateThumbnails } = await import('@/server/services/thumbnail.service');

		// Procesar thumbnails por tipo de entidad
		const entityTypes = ['image', 'video', 'document', 'file3d', 'json'];

		for (const entityType of entityTypes) {
			try {
				logger.debug(`🖼️ Generando thumbnails para: ${entityType}`);

				// Obtener entidades sin thumbnail
				const { db } = await import('@/lib/drizzle');

				switch (entityType) {
					case 'image': {
						const { images } = await import('@/lib/drizzle/schema/index');
						const { inArray } = await import('drizzle-orm');
						const entities = await db
							.select({ id: images.id, path: images.path, folderId: images.folderId })
							.from(images)
							.where(
								inArray(
									images.folderId,
									analysisResult.existingFolders.map((f) => f.id)
								)
							);

						for (const entity of entities) {
							try {
								// Usar la función bulkGenerateThumbnails con un solo elemento
								await bulkGenerateThumbnails([entity.id]);
								processed++;
							} catch (error) {
								const errorMsg = `Error generando thumbnail para ${entity.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
								errors.push(errorMsg);
							}
						}
						break;
					}
					// Agregar casos para video, document, etc.
					default:
						continue;
				}
			} catch (error) {
				const errorMsg = `Error procesando thumbnails de tipo ${entityType}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
				errors.push(errorMsg);
				logger.error(errorMsg);
			}
		}

		logger.info('✅ Generación de thumbnails completada', {
			procesados: processed,
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
		logger.error('❌ Error en generación de thumbnails:', error);
		return {
			success: false,
			processed,
			failed: analysisResult.totalFiles - processed,
			errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
			duration: Date.now() - startTime,
		};
	}
}
