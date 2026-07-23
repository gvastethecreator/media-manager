/**
 * @file Servicio de generación de thumbnails
 * @module services/image/image-thumbnail
 * @description Gestión completa de thumbnails: generación, compresión, caché y estadísticas
 */

import { and, count, desc, eq, isNotNull, sum } from 'drizzle-orm';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { db } from '@/lib/drizzle';
import { images } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { visibleImageLifecycleCondition } from './image-lifecycle-query';
import {
	createEntityNotFoundError,
	createFileNotFoundError,
	ServiceErrorCode,
	toServiceError,
} from '@/lib/utils/errors/service-errors';
import type { ImageWithStats } from '@/types/entities/image/types';
import type { ThumbnailStats } from '@/types/thumbnails';
import { emitImageEvent, IMAGE_EVENTS } from './image-events';
import { type ImageProcessingOptions, processImage } from './image-processing';
import { MAX_THUMBNAIL_SIZE_BYTES, SERVICE_NAME } from './image-utils';

const thumbnailLogger = serverLogger.withContext(SERVICE_NAME);

/**
 * Configuración fija para thumbnails
 */
const THUMBNAIL_CONFIG: ImageProcessingOptions = {
	width: 512,
	height: 512,
	quality: 80,
	format: 'webp',
	fit: 'cover',
};

/**
 * Clase singleton para gestión de thumbnails
 */
class ThumbnailService {
	private static instance: ThumbnailService;

	private constructor() {}

	static getInstance(): ThumbnailService {
		if (!ThumbnailService.instance) {
			ThumbnailService.instance = new ThumbnailService();
		}
		return ThumbnailService.instance;
	}

	/**
	 * Genera thumbnail para una imagen con recompresión automática si excede el límite
	 *
	 * @param imageId - ID de la imagen
	 * @throws ServiceError si falla la generación
	 */
	async generateThumbnail(imageId: string, authorizedSourcePath?: string): Promise<void> {
		// Logging defensivo para diagnosticar posibles caídas en reindex masivo
		const startHr = process.hrtime.bigint();
		const memBefore = process.memoryUsage();
		thumbnailLogger.info('[thumbnail] ▶️ start', {
			imageId,
			memRssMB: (memBefore.rss / 1024 / 1024).toFixed(1),
			memHeapUsedMB: (memBefore.heapUsed / 1024 / 1024).toFixed(1),
		});

		try {
			const image = await db.query.images.findFirst({
				where: eq(images.id, imageId),
			});

			if (!image) {
				throw createEntityNotFoundError('Image', imageId, SERVICE_NAME);
			}

			const sourcePath = authorizedSourcePath || image.path;

			// Protección contra rutas corruptas o demasiado largas
			if (!sourcePath || sourcePath.length > 1024) {
				const errorMsg = `Ruta de archivo inválida o demasiado larga: ${sourcePath ? `${sourcePath.substring(0, 50)}...` : 'null'}`;
				thumbnailLogger.error(`[thumbnail] ❌ ${errorMsg}`);
				throw createFileNotFoundError(sourcePath || 'unknown', { imageId, error: errorMsg }, SERVICE_NAME);
			}

			// Verificar existencia y permisos del archivo
			try {
				await fs.access(sourcePath, fs.constants.R_OK);
			} catch (permError: any) {
				const code = permError?.code;
				if (code === 'ENOENT' || code === 'ENOTDIR') {
					thumbnailLogger.error('[thumbnail] Archivo no encontrado:', { path: sourcePath, code });
					throw createFileNotFoundError(sourcePath, { imageId }, SERVICE_NAME);
				}
				if (code === 'EACCES' || code === 'EPERM') {
					thumbnailLogger.error('[thumbnail] Permiso denegado al leer:', {
						path: sourcePath,
						code,
						message: permError.message,
					});
					throw toServiceError(permError, {
						code: ServiceErrorCode.FILE_ACCESS_DENIED,
						message: `Permiso denegado: ${sourcePath}`,
						serviceName: SERVICE_NAME,
						context: { imageId, path: sourcePath },
					});
				}
				thumbnailLogger.error('[thumbnail] Error comprobando acceso:', {
					path: sourcePath,
					code,
					message: permError instanceof Error ? permError.message : String(permError),
				});
				throw toServiceError(permError, {
					code: ServiceErrorCode.FILE_READ_ERROR,
					message: `No se pudo acceder al archivo: ${sourcePath}`,
					serviceName: SERVICE_NAME,
					context: { imageId, path: sourcePath },
				});
			}

			// Procesar la imagen para crear el thumbnail (primero en WebP)
			let { buffer, metadata } = await processImage(sourcePath, THUMBNAIL_CONFIG);

			// Si el resultado supera el tope, recomprimir con ajustes más fuertes
			let mime = 'image/webp';
			if (buffer.length > MAX_THUMBNAIL_SIZE_BYTES) {
				thumbnailLogger.info('[thumbnail] buffer grande, recomprimiendo', {
					imageId,
					sizeKB: (buffer.length / 1024).toFixed(1),
				});
				try {
					// Intento 1: WebP con menor calidad
					const webpRetry = await sharp(buffer).webp({ quality: 60, effort: 5 }).toBuffer({
						resolveWithObject: true,
					});
					buffer = webpRetry.data;
					metadata = webpRetry.info;
					mime = 'image/webp';
				} catch {
					// Intento 2: JPEG como fallback
					const jpegRetry = await sharp(sourcePath)
						.resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
							fit: THUMBNAIL_CONFIG.fit || 'cover',
							withoutEnlargement: true,
						})
						.jpeg({ quality: 75, progressive: true, mozjpeg: true })
						.toBuffer({ resolveWithObject: true });
					buffer = jpegRetry.data;
					metadata = jpegRetry.info;
					mime = 'image/jpeg';
				}
			}

			// Guardar resultado (try separado para capturar posibles errores DB sin perder métricas)
			try {
				await db
					.update(images)
					.set({
						thumbnail: buffer.toString('base64'), // Convertir Buffer a string base64
						thumbnailSize: buffer.length,
						thumbnailWidth: metadata.width ?? THUMBNAIL_CONFIG.width,
						thumbnailHeight: metadata.height ?? THUMBNAIL_CONFIG.height,
						thumbnailMimeType: mime,
						thumbnailError: null,
						thumbnailErrorAt: null,
						thumbnailOptimizedAt: new Date(),
					})
					.where(eq(images.id, imageId));
			} catch (dbErr) {
				thumbnailLogger.error('[thumbnail] 💥 DB update failed', {
					imageId,
					error: dbErr instanceof Error ? dbErr.message : String(dbErr),
				});
				throw dbErr;
			}

			// Emitir evento de thumbnail generado
			await emitImageEvent(IMAGE_EVENTS.THUMBNAIL_GENERATED, { imageId });

			const memAfter = process.memoryUsage();
			const durationMs = Number((process.hrtime.bigint() - startHr) / 1000000n);
			thumbnailLogger.info('[thumbnail] ✅ done', {
				imageId,
				durationMs,
				bufferKB: (buffer.length / 1024).toFixed(1),
				memHeapDeltaMB: ((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2),
				memRssMB: (memAfter.rss / 1024 / 1024).toFixed(1),
			});
		} catch (error: any) {
			// Registrar error en columnas dedicadas para permitir reintentos controlados
			try {
				await db
					.update(images)
					.set({
						thumbnailError: error instanceof Error ? error.message : String(error),
						thumbnailErrorAt: new Date(),
					})
					.where(eq(images.id, imageId));
			} catch (e) {
				thumbnailLogger.warn('[thumbnail] No se pudo registrar thumbnailError', {
					imageId,
					error: e instanceof Error ? e.message : String(e),
				});
			}
			await emitImageEvent(IMAGE_EVENTS.ERROR, {
				message: 'Error al generar thumbnail',
				imageId,
				error: error instanceof Error ? error.message : String(error),
			});
			thumbnailLogger.error('[thumbnail] ❌ failed', {
				imageId,
				error: error instanceof Error ? error.message : String(error),
			});
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_WRITE_ERROR,
				message: 'Error al generar thumbnail',
				context: { imageId },
				serviceName: SERVICE_NAME,
			});
		}
	}

	/**
	 * Variante segura: intenta generar thumbnail y NO lanza excepción
	 * Devuelve true si se generó con éxito, false en caso contrario
	 *
	 * @param imageId - ID de la imagen
	 * @returns true si la generación fue exitosa, false si falló
	 */
	async generateThumbnailSafe(imageId: string): Promise<boolean> {
		try {
			await this.generateThumbnail(imageId);
			return true;
		} catch (err: any) {
			// Asegurar registro de error ya fue hecho en generateThumbnail catch; redundancia defensiva
			try {
				await db
					.update(images)
					.set({
						thumbnailError: err instanceof Error ? err.message : String(err),
						thumbnailErrorAt: new Date(),
					})
					.where(eq(images.id, imageId));
			} catch {}
			return false;
		}
	}

	/**
	 * Obtiene el thumbnail de una imagen (buffer)
	 * Si no existe, lo genera en caliente y lo cachea
	 * Si está corrupto, lo regenera automáticamente
	 *
	 * @param imageId - ID de la imagen
	 * @param getImage - Función para obtener la imagen por ID
	 * @returns Buffer del thumbnail
	 * @throws ServiceError si no se puede obtener el thumbnail
	 */
	async getThumbnail(
		imageId: string,
		getImage: (id: string) => Promise<ImageWithStats | null>,
		authorizedSourcePath?: string
	): Promise<Buffer> {
		try {
			const image = await getImage(imageId);
			if (!image) {
				throw createEntityNotFoundError('Image', imageId, SERVICE_NAME);
			}

			if (image.thumbnail) {
				// Intentar convertir base64 -> Buffer y validar que sea una imagen legible
				try {
					const buf = Buffer.from(image.thumbnail, 'base64');
					// Validación ligera con sharp: obtener metadata; si falla, regenerar
					await sharp(buf).metadata();
					return buf;
				} catch (_e) {
					// Thumbnail corrupto o no válido: regenerar
					await this.generateThumbnail(imageId, authorizedSourcePath);
					const refreshed = await getImage(imageId);
					if (refreshed?.thumbnail) {
						return Buffer.from(refreshed.thumbnail, 'base64');
					}
					throw createFileNotFoundError(
						`Miniatura corrupta reparada pero no disponible para la imagen ${imageId}`,
						{},
						SERVICE_NAME
					);
				}
			}

			await this.generateThumbnail(imageId, authorizedSourcePath);
			const updatedImage = await getImage(imageId);
			if (!updatedImage?.thumbnail) {
				throw createFileNotFoundError(
					`Miniatura para la imagen ${imageId} no encontrada después de la generación`,
					{},
					SERVICE_NAME
				);
			}
			// Convertir string base64 a Buffer
			return Buffer.from(updatedImage.thumbnail, 'base64');
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_READ_ERROR,
				message: 'Error al obtener miniatura',
				context: { imageId },
				serviceName: SERVICE_NAME,
			});
		}
	}

	/**
	 * Obtiene la imagen original (sin procesar)
	 *
	 * @param imageId - ID de la imagen
	 * @param getImage - Función para obtener la imagen por ID
	 * @returns Buffer del archivo original
	 * @throws ServiceError si no se puede leer el archivo
	 */
	async getOriginalImage(imageId: string, getImage: (id: string) => Promise<ImageWithStats | null>): Promise<Buffer> {
		try {
			const image = await getImage(imageId);
			if (!image) {
				throw createEntityNotFoundError('Image', imageId, SERVICE_NAME);
			}

			if (!image.path) {
				throw createFileNotFoundError(`Ruta original para la imagen ${imageId} no encontrada`, {}, SERVICE_NAME);
			}

			return await fs.readFile(image.path);
		} catch (error) {
			throw toServiceError(error, {
				code: ServiceErrorCode.FILE_READ_ERROR,
				message: 'Error al obtener la imagen original',
				context: { imageId },
				serviceName: SERVICE_NAME,
			});
		}
	}

	/**
	 * Obtiene estadísticas agregadas de procesamiento de thumbnails
	 *
	 * @returns Estadísticas completas
	 * @throws ServiceError si falla la consulta
	 */
	async getThumbnailProcessingStats(): Promise<ThumbnailStats> {
		try {
			const totalImages = await db.select({ count: count() }).from(images).where(visibleImageLifecycleCondition());
			const processedImages = await db
				.select({ count: count() })
				.from(images)
				.where(and(isNotNull(images.thumbnailOptimizedAt), visibleImageLifecycleCondition()));
			const erroredImages = await db
				.select({ count: count() })
				.from(images)
				.where(and(isNotNull(images.thumbnailError), visibleImageLifecycleCondition()));
			const totalThumbnailSize = await db
				.select({ sum: sum(images.thumbnailSize) })
				.from(images)
				.where(and(isNotNull(images.thumbnailSize), visibleImageLifecycleCondition()));
			const lastProcessedImage = await db
				.select({ date: images.thumbnailOptimizedAt })
				.from(images)
				.where(and(isNotNull(images.thumbnailOptimizedAt), visibleImageLifecycleCondition()))
				.orderBy(desc(images.thumbnailOptimizedAt))
				.limit(1);

			return {
				total: totalImages[0]?.count || 0,
				processed: processedImages[0]?.count || 0,
				failed: erroredImages[0]?.count || 0,
				pending: (totalImages[0]?.count || 0) - (processedImages[0]?.count || 0),
				totalFiles: totalImages[0]?.count || 0,
				totalSize: Number(totalThumbnailSize[0]?.sum || 0),
				processedSize: Number(totalThumbnailSize[0]?.sum || 0),
				errors: [],
				averageProcessingTime: 0,
				lastProcessedAt: lastProcessedImage[0]?.date || undefined,
			};
		} catch (error) {
			thumbnailLogger.error('Error al obtener estadísticas de miniaturas:', error);
			throw toServiceError(error, {
				code: ServiceErrorCode.DATABASE_ERROR,
				message: 'Error al obtener estadísticas de miniaturas',
				serviceName: SERVICE_NAME,
			});
		}
	}
}

/**
 * Instancia singleton del servicio de thumbnails
 */
export const thumbnailService = ThumbnailService.getInstance();
