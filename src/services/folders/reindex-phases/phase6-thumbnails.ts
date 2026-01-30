/**
 * @file FASE 6: Generación de thumbnails
 * @description Genera thumbnails para archivos indexados que no tienen thumbnail o tienen errores previos
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from '../folder-reindex-types';

const logger = serverLogger.withContext('ReindexPhase6');

/**
 * FASE 6: 🖼️ GENERACIÓN DE THUMBNAILS
 * Genera thumbnails para todos los archivos indexados que no tienen thumbnail o tienen errores
 */
export async function phase6_generateThumbnails(
	analysisResult: ReindexAnalysisResult,
	_options: ReindexOptions
): Promise<ReindexPhaseResult> {
	const startTime = Date.now();
	logger.info('🖼️ Iniciando generación de thumbnails');

	const errors: string[] = [];
	let processed = 0;
	let skipped = 0;

	try {
		// Procesar thumbnails por tipo de entidad
		const folderIds = analysisResult.existingFolders.map((f) => f.id);

		// ===== IMAGENES =====
		try {
			logger.debug('🖼️ Procesando thumbnails para imágenes');
			const { db } = await import('@/lib/drizzle');
			const { images } = await import('@/lib/drizzle/schema/index');
			const { inArray, or, isNull, not } = await import('drizzle-orm');
			const { bulkGenerateThumbnails } = await import('@/server/services/thumbnail.service');

			// Buscar imágenes SIN thumbnail o CON error de thumbnail
			const imagesNeedingThumbnail = await db
				.select({
					id: images.id,
					path: images.path,
					folderId: images.folderId,
					thumbnail: images.thumbnail,
					thumbnailError: images.thumbnailError,
				})
				.from(images)
				.where(inArray(images.folderId, folderIds), or(isNull(images.thumbnail), not(isNull(images.thumbnailError))));

			logger.info(`🖼️ Encontradas ${imagesNeedingThumbnail.length} imágenes que necesitan thumbnail`);

			if (imagesNeedingThumbnail.length > 0) {
				const imageIds = imagesNeedingThumbnail.map((img: { id: string }) => img.id);
				const result = await bulkGenerateThumbnails(imageIds);
				processed += result.generated.length;
				errors.push(...result.errors.map((e) => `Imagen ${e.id}: ${e.error}`));
				skipped += imagesNeedingThumbnail.length - result.generated.length - result.errors.length;
			}
		} catch (error) {
			const errorMsg = `Error procesando thumbnails de imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`;
			errors.push(errorMsg);
			logger.error(errorMsg);
		}

		// ===== VIDEOS =====
		try {
			logger.debug('🎥 Procesando thumbnails para videos');
			const { db } = await import('@/lib/drizzle');
			const { videos } = await import('@/lib/drizzle/schema/index');
			const { inArray, isNull, eq } = await import('drizzle-orm');

			// Buscar videos SIN thumbnail
			const videosNeedingThumbnail = await db
				.select({
					id: videos.id,
					path: videos.path,
					folderId: videos.folderId,
					thumbnail: videos.thumbnail,
				})
				.from(videos)
				.where(inArray(videos.folderId, folderIds), isNull(videos.thumbnail));

			logger.info(`🎥 Encontrados ${videosNeedingThumbnail.length} videos que necesitan thumbnail`);

			for (const video of videosNeedingThumbnail) {
				try {
					const { generateStaticVideoThumbnailFFmpeg } = await import('@/lib/utils/video/ffmpeg-thumbnails');
					const thumbnailBuffer = await generateStaticVideoThumbnailFFmpeg(video.path, {
						time: 1,
						width: 320,
						height: 240,
						quality: 'medium',
					});

					if (thumbnailBuffer) {
						// Guardar thumbnail en la base de datos
						await db
							.update(videos)
							.set({
								thumbnail: thumbnailBuffer.toString('base64'),
								thumbnailSize: thumbnailBuffer.length,
								thumbnailWidth: 320,
								thumbnailHeight: 240,
								updatedAt: new Date(),
							})
							.where(eq(videos.id, video.id));

						processed++;
						logger.debug(`✅ Thumbnail generado para video: ${video.path}`);
					} else {
						skipped++;
						logger.warn(`⚠️ No se pudo generar thumbnail para video: ${video.path}`);
					}
				} catch (error) {
					const errorMsg = `Error generando thumbnail para video ${video.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
					errors.push(errorMsg);
					logger.error(errorMsg);
				}
			}
		} catch (error) {
			const errorMsg = `Error procesando thumbnails de videos: ${error instanceof Error ? error.message : 'Error desconocido'}`;
			errors.push(errorMsg);
			logger.error(errorMsg);
		}

		logger.info('✅ Generación de thumbnails completada', {
			procesados: processed,
			skipped,
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
			failed: errors.length,
			errors: [...errors, error instanceof Error ? error.message : 'Error desconocido'],
			duration: Date.now() - startTime,
		};
	}
}
