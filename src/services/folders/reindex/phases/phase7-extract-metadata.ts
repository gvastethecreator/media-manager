/**
 * @file FASE 7: Extracción de metadata
 * @module services/folders/reindex/phases
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from '../../folder-reindex-types';

const logger = serverLogger.withContext('FolderReindex:Phase7');

/**
 * FASE 7: 📊 EXTRACCIÓN DE METADATA
 * Extrae metadata de todos los archivos indexados
 */
export async function phase7_extractMetadata(
	analysisResult: ReindexAnalysisResult,
	options: ReindexOptions
): Promise<ReindexPhaseResult> {
	const startTime = Date.now();
	logger.info('📊 Iniciando extracción de metadata');

	const errors: string[] = [];
	let processed = 0;

	try {
		const { extractMetadata, clearMetadataCache } = await import('@/services/metadata/metadata.service');
		// Ya no necesitamos instanciar un servicio, usamos las funciones directamente

		// Obtener todos los archivos que necesitan metadata
		const { db } = await import('@/lib/drizzle');
		const { images, metadatas } = await import('@/lib/drizzle/schema/index');
		const { inArray, isNull, and, eq } = await import('drizzle-orm');

		// Buscar imágenes sin metadata
		const imagesWithoutMetadata = await db
			.select({ id: images.id, path: images.path })
			.from(images)
			.leftJoin(metadatas, and(eq(metadatas.entityId, images.id), eq(metadatas.entityType, 'image')))
			.where(
				and(
					inArray(
						images.folderId,
						analysisResult.existingFolders.map((f: { id: string }) => f.id)
					),
					isNull(metadatas.id)
				)
			);

		for (const image of imagesWithoutMetadata) {
			try {
				// Usar la función extractMetadata y almacenar la metadata
				const metadata = await extractMetadata(image.path);
				// TODO: Implementar almacenamiento de metadata extraída
				processed++;
			} catch (error) {
				const errorMsg = `Error extrayendo metadata de ${image.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
				errors.push(errorMsg);
			}
		}

		logger.info('✅ Extracción de metadata completada', {
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
		logger.error('❌ Error en extracción de metadata:', error);
		return {
			success: false,
			processed,
			failed: analysisResult.totalFiles - processed,
			errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
			duration: Date.now() - startTime,
		};
	}
}
