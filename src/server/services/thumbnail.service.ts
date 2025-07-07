import { count, desc, eq, isNull, not, sql, sum } from 'drizzle-orm';
import { existsSync } from 'fs';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { db } from '@/lib/drizzle';
import { images } from '@/lib/drizzle/schema';
import { generateThumbnail } from '@/lib/image/thumbnail';
import { serverLogger } from '@/lib/logger/server-logger';
import { thumbnailService as baseThumbnailService } from '@/services/thumbnail/index'; // Renombrado para evitar conflicto
import type { LastProcessedThumbnail, ProcessOptions, ThumbnailStats } from '@/types/thumbnails';

const thumbLogger = serverLogger.withContext('ThumbnailService');

export interface ThumbnailResponse {
	thumbnailUrl?: string;
	width?: number;
	height?: number;
	size?: number;
	mimeType?: string;
	error?: string;
}

export async function getThumbnail(
	id: string,
	quality: ThumbnailQuality = ThumbnailQuality.MEDIUM
): Promise<ThumbnailResponse> {
	try {
		// Validar que la calidad sea una de las opciones válidas
		let validQuality = quality;
		if (!Object.values(ThumbnailQuality).includes(quality as ThumbnailQuality)) {
			thumbLogger.warn('⚠️ Calidad inválida, usando MEDIUM por defecto:', quality);
			validQuality = ThumbnailQuality.MEDIUM;
		}

		// Validar el ID de forma estricta
		if (!id || typeof id !== 'string' || id.trim() === '') {
			const error = 'ID no proporcionado o inválido';
			thumbLogger.error(`❌ ${error}`);
			return {
				thumbnailUrl: '',
				error,
			};
		}

		thumbLogger.info('🔄 Obteniendo thumbnail:', { id, quality: validQuality });

		const image = await db.query.images.findFirst({
			where: eq(images.id, id),
			columns: {
				id: true,
				path: true,
				thumbnail: true,
				thumbnailSize: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				thumbnailError: true,
				thumbnailMimeType: true,
			},
		});

		if (!image) {
			const error = `Imagen no encontrada: ${id}`;
			thumbLogger.error(`❌ ${error}`);
			return {
				thumbnailUrl: '',
				error,
			};
		}

		// Si hay un error previo, intentar regenerar
		if (image.thumbnailError) {
			thumbLogger.warn('⚠️ Error previo detectado, intentando regenerar:', {
				id,
				error: image.thumbnailError,
			});
		}

		// Si ya tiene thumbnail, devolverlo
		if (image.thumbnail) {
			// No devolver la base64, sino la URL de la API
			const thumbnailUrl = `/api/images/${image.id}/thumbnail`;

			thumbLogger.info('✅ Thumbnail encontrado en caché (servido por API):', {
				id,
				size: image.thumbnailSize,
				width: image.thumbnailWidth,
				height: image.thumbnailHeight,
				url: thumbnailUrl,
			});

			return {
				thumbnailUrl,
				width: image.thumbnailWidth || undefined,
				height: image.thumbnailHeight || undefined,
				size: image.thumbnailSize || undefined,
				mimeType: image.thumbnailMimeType || 'image/webp',
			};
		}

		// Validar que la ruta del archivo exista
		if (!image.path || !existsSync(image.path)) {
			const error = `Archivo no encontrado en ruta: ${image.path}`;
			// Registrar el error en la base de datos
			await db
				.update(images)
				.set({
					thumbnailError: error,
				})
				.where(eq(images.id, id));
			thumbLogger.error(`❌ ${error}`);
			return {
				thumbnailUrl: '',
				error,
			};
		}

		// Si no tiene thumbnail, generarlo
		thumbLogger.info('🔄 Generando nuevo thumbnail:', { id, path: image.path });

		try {
			const thumbnail = await generateThumbnail(image.path, { quality: validQuality });

			if (!thumbnail || !thumbnail.buffer) {
				throw new Error('No se pudo generar el thumbnail');
			}

			// Actualizar la imagen con el nuevo thumbnail
			await db
				.update(images)
				.set({
					thumbnail: thumbnail.buffer,
					thumbnailSize: thumbnail.buffer.length,
					thumbnailWidth: thumbnail.width,
					thumbnailHeight: thumbnail.height,
					thumbnailError: null, // Limpiar error previo si existía
					thumbnailMimeType: `image/${thumbnail.format}`,
				})
				.where(eq(images.id, id));

			thumbLogger.info('✅ Nuevo thumbnail generado (servido por API):', {
				id,
				size: thumbnail.buffer.length,
				width: thumbnail.width,
				height: thumbnail.height,
			});

			return {
				thumbnailUrl: `/api/images/${id}/thumbnail`,
				width: thumbnail.width,
				height: thumbnail.height,
				size: thumbnail.buffer.length,
				mimeType: `image/${thumbnail.format}`,
			};
		} catch (genError) {
			// Registrar el error en la imagen
			const errorMessage = genError instanceof Error ? genError.message : 'Error desconocido';
			await db
				.update(images)
				.set({
					thumbnailError: errorMessage,
				})
				.where(eq(images.id, id));

			thumbLogger.error('❌ Error generando thumbnail:', genError);
			return {
				thumbnailUrl: '',
				error: errorMessage,
			};
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
		thumbLogger.error('❌ Error obteniendo thumbnail:', { error: errorMessage, id });
		return {
			thumbnailUrl: '',
			error: errorMessage,
		};
	}
}

export async function optimizeThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando optimización de thumbnails');
		return await baseThumbnailService.optimizeThumbnails(options);
	} catch (error) {
		thumbLogger.error('❌ Error optimizando thumbnails:', error);
		throw error;
	}
}

export async function reprocessThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando reprocesamiento de thumbnails');
		return await baseThumbnailService.reprocessAll(options);
	} catch (error) {
		thumbLogger.error('❌ Error reprocesando thumbnails:', error);
		throw error;
	}
}

export async function cleanThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando limpieza de thumbnails');
		return await baseThumbnailService.cleanThumbnails(options);
	} catch (error) {
		thumbLogger.error('❌ Error limpiando thumbnails:', error);
		throw error;
	}
}

export async function getLastProcessedThumbnails(limit = 9): Promise<LastProcessedThumbnail[]> {
	try {
		thumbLogger.info('🔄 Obteniendo últimas miniaturas procesadas:', { limit });

		const imagesData = await db.query.images.findMany({
			where: not(isNull(images.thumbnail)),
			orderBy: desc(images.updatedAt),
			limit: limit,
			columns: {
				id: true,
				path: true,
				updatedAt: true,
				thumbnailSize: true,
			},
		});

		return imagesData.map((image) => ({
			id: image.id,
			path: image.path,
			processedAt: image.updatedAt,
			status: 'success' as const,
		}));
	} catch (error) {
		thumbLogger.error('❌ Error obteniendo últimas miniaturas:', error);
		throw error;
	}
}

export async function getThumbnailStats(): Promise<ThumbnailStats> {
	try {
		thumbLogger.info('🔄 Obteniendo estadísticas de thumbnails');

		// Verificar la conexión a la base de datos antes de continuar
		try {
			// Consulta simple para verificar la conexión
			await db.execute(sql`SELECT 1`);
		} catch (dbError) {
			thumbLogger.error('❌ Error de conexión a la base de datos:', dbError);
			throw new Error('No se pudo conectar a la base de datos. Verifica tu conexión.');
		}

		const [totalFilesResult, withThumbnailResult, pendingResult, errorsData, totalSizeResult] = await Promise.all([
			db.select({ count: count() }).from(images),
			db
				.select({ count: count() })
				.from(images)
				.where(not(isNull(images.thumbnail))),
			db.select({ count: count() }).from(images).where(isNull(images.thumbnail)),
			db.query.images.findMany({
				where: not(isNull(images.thumbnailError)),
				columns: {
					id: true,
					path: true,
					thumbnailError: true,
					updatedAt: true,
				},
			}),
			db
				.select({ totalSize: sum(images.thumbnailSize) })
				.from(images)
				.where(not(isNull(images.thumbnailSize))),
		]);

		const totalFiles = totalFilesResult[0].count;
		const withThumbnail = withThumbnailResult[0].count;
		const pending = pendingResult[0].count;
		const errors = errorsData;
		const totalSize = totalSizeResult[0].totalSize || 0;

		return {
			total: totalFiles,
			processed: withThumbnail,
			errors: errors.length,
			totalSize: totalSize,
		};
	} catch (error) {
		thumbLogger.error('❌ Error obteniendo estadísticas:', error);

		if (error instanceof Error) {
			throw error;
		}
		throw new Error('Error al obtener estadísticas de miniaturas. Por favor, intenta más tarde.');
	}
}

export async function verifySignedToken(token: string): Promise<{ buffer: Buffer; mimeType: string }> {
	try {
		thumbLogger.info('🔄 Verificando token firmado:', token);

		// TODO: Implementar lógica real de verificación de token
		// Por ahora retornamos un placeholder
		throw new Error('Token verification not implemented yet');
	} catch (error) {
		thumbLogger.error('❌ Error verificando token:', error);
		throw new Error(`Token inválido: ${token}`);
	}
}

export async function bulkGenerateThumbnails(imageIds: string[], options?: ProcessOptions) {
	thumbLogger.info(`🔄 Generando thumbnails en lote para ${imageIds.length} imágenes`);
	const generated: string[] = [];
	const errors: { id: string; error: string }[] = [];

	for (const imageId of imageIds) {
		try {
			await getThumbnail(imageId, options?.quality);
			generated.push(imageId);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			errors.push({ id: imageId, error: errorMessage });
		}
	}

	thumbLogger.info(`✅ Generación en lote completada. Generados: ${generated.length}, Errores: ${errors.length}`);
	return { generated, errors };
}

export async function deleteThumbnail(imageId: string): Promise<{ success: boolean; message: string }> {
	try {
		thumbLogger.info(`🗑️ Eliminando thumbnail para imagen: ${imageId}`);

		const image = await db.query.images.findFirst({
			where: eq(images.id, imageId),
			columns: { id: true, thumbnail: true },
		});

		if (!image) {
			return { success: false, message: 'Imagen no encontrada' };
		}

		if (!image.thumbnail) {
			return { success: true, message: 'Thumbnail no existe para esta imagen' };
		}

		await db
			.update(images)
			.set({
				thumbnail: null,
				thumbnailSize: null,
				thumbnailWidth: null,
				thumbnailHeight: null,
				thumbnailMimeType: null,
				thumbnailError: null,
			})
			.where(eq(images.id, imageId));

		thumbLogger.info(`✅ Thumbnail eliminado para imagen: ${imageId}`);
		return { success: true, message: 'Thumbnail eliminado exitosamente' };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
		thumbLogger.error(`❌ Error eliminando thumbnail para imagen ${imageId}:`, error);
		return { success: false, message: `Error eliminando thumbnail: ${errorMessage}` };
	}
}
