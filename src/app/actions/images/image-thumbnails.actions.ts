/**
 * NOTA: Este archivo contiene las funciones específicas para
 * manejar miniaturas de imágenes en el contexto de entidades de imágenes.
 *
 * Para funcionalidades generales de miniaturas, incluida la obtención
 * y manejo de miniaturas firmadas, consulte:
 * @see {@link '../thumbnails/thumbnails.actions.ts'}
 */
'use server';

import { thumbnailCache } from '@/lib/cache';
import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { imageService } from '@/services/image-service-export';
import { ThumbnailQuality } from '@/types/thumbnails';
import {
	createEntityNotFoundError,
	createServiceError,
	ServiceErrorCode,
	toServiceError,
} from '@/utils/errors/service-errors';
import fs from 'fs/promises';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import type { CleanupThumbnailsResult, ReprocessThumbnailsResult, ThumbnailStatsResult } from './image-types.actions';

const SERVER_ACTION_NAME = 'ImageThumbnails';
const imageLogger = serverLogger.withContext(SERVER_ACTION_NAME);

/**
 * Obtiene la miniatura de una imagen
 */
export async function getThumbnail(
	imageId: string,
	_quality: ThumbnailQuality = ThumbnailQuality.MEDIUM
): Promise<Buffer> {
	try {
		const thumbnail = await imageService.getThumbnail(imageId);
		return thumbnail;
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'Error al obtener el thumbnail',
		});
	}
}

/**
 * Genera la miniatura para una imagen
 */
export async function generateThumbnail(imageId: string, _quality: ThumbnailQuality): Promise<void> {
	try {
		await imageService.generateThumbnail(imageId);
		revalidatePath(`/api/thumbnails/${imageId}`);
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'Error al generar el thumbnail',
		});
	}
}

/**
 * Optimiza la miniatura de una imagen
 */
export async function optimizeThumbnail(imageId: string): Promise<void> {
	try {
		const prisma = await getPrismaClient();
		// Obtener la imagen con su thumbnail
		const image = await prisma.image.findUnique({
			where: { id: imageId },
			select: {
				id: true,
				thumbnail: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
			},
		});

		if (!image) {
			throw createEntityNotFoundError('Imagen', imageId, SERVER_ACTION_NAME);
		}

		if (!image.thumbnail) {
			throw createServiceError({
				code: ServiceErrorCode.ENTITY_NOT_FOUND,
				message: 'La imagen no tiene thumbnail que optimizar',
				serviceName: SERVER_ACTION_NAME,
			});
		}

		// Optimizar el thumbnail con Sharp
		const optimized = await sharp(image.thumbnail)
			.jpeg({ quality: 70, progressive: true }) // Usar un nivel medio de calidad
			.toBuffer();

		// Actualizar en la base de datos
		await prisma.image.update({
			where: { id: imageId },
			data: {
				thumbnail: optimized,
				thumbnailSize: optimized.length,
			},
		});

		// Limpiar caché
		thumbnailCache.delete(imageId);

		imageLogger.info('Thumbnail optimizado:', {
			imageId,
			oldSize: image.thumbnail.length,
			newSize: optimized.length,
			reduction: `${Math.round(((image.thumbnail.length - optimized.length) / image.thumbnail.length) * 100)}%`,
		});
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'Error al optimizar el thumbnail',
		});
	}
}

/**
 * Limpia las miniaturas que no se usan
 */
export async function cleanupThumbnails(): Promise<CleanupThumbnailsResult> {
	let cleaned = 0;
	let errors = 0;
	let totalSize = 0;

	try {
		const prisma = await getPrismaClient();
		// Obtener todas las imágenes con thumbnails
		const images = await prisma.image.findMany({
			where: {
				thumbnail: { not: null },
				thumbnailSize: { gt: 50000 }, // Más de 50KB
			},
			select: {
				id: true,
				path: true,
				thumbnail: true,
				thumbnailSize: true,
			},
		});

		imageLogger.info(`Limpiando ${images.length} miniaturas grandes...`);

		// Procesar cada imagen
		for (const image of images) {
			try {
				if (!image.thumbnail || !image.thumbnailSize) {
					continue;
				}

				// Verificar que la imagen original existe
				if (!(await fs.stat(image.path).catch(() => false))) {
					// La imagen original ya no existe, limpiar su thumbnail
					await prisma.image.update({
						where: { id: image.id },
						data: {
							thumbnail: null,
							thumbnailSize: null,
							thumbnailWidth: null,
							thumbnailHeight: null,
						},
					});
					cleaned++;
					totalSize += image.thumbnailSize;
					continue;
				}

				// Optimizar miniaturas grandes
				if (image.thumbnailSize > 100000) {
					// 100KB
					await optimizeThumbnail(image.id);
					cleaned++;
					totalSize += image.thumbnailSize;
				}
			} catch (error) {
				errors++;
				imageLogger.error('Error procesando thumbnail:', { imageId: image.id, error });
			}
		}

		imageLogger.info('Limpieza de thumbnails completada', { cleaned, errors, totalSize });
		return { cleaned, errors, totalSize };
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'Error al limpiar los thumbnails',
		});
	}
}

/**
 * Obtiene estadísticas de miniaturas
 */
export async function getThumbnailStats(): Promise<ThumbnailStatsResult> {
	try {
		const prisma = await getPrismaClient();
		// Contar todas las imágenes
		const total = await prisma.image.count();

		// Contar imágenes con thumbnail
		const withThumbnail = await prisma.image.count({
			where: { thumbnail: { not: null } },
		});

		// Contar con errores (sin thumbnail pero procesadas)
		const withError = await prisma.image.count({
			where: {
				thumbnail: null,
			},
		});

		// Contar optimizadas (thumbnail size < 50KB)
		const optimized = await prisma.image.count({
			where: {
				thumbnail: { not: null },
				thumbnailSize: { lt: 50000 },
			},
		});

		// Calcular tamaño promedio de thumbnails
		const avgSizeResult = await prisma.image.aggregate({
			_avg: { thumbnailSize: true },
			where: { thumbnail: { not: null } },
		});

		const averageSize = avgSizeResult._avg.thumbnailSize || 0;

		return {
			total,
			withThumbnail,
			withError,
			optimized,
			averageSize,
		};
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'Error al obtener estadísticas de thumbnails',
		});
	}
}

/**
 * Reprocesa las miniaturas de todas las imágenes
 */
export async function reprocessThumbnails(
	options: { force?: boolean; quality?: ThumbnailQuality } = {}
): Promise<ReprocessThumbnailsResult> {
	const startTime = Date.now();
	let processed = 0;
	let errors = 0;

	try {
		const prisma = await getPrismaClient();
		const { force = false, quality = ThumbnailQuality.MEDIUM } = options;

		// Preparar consulta
		const where: Record<string, unknown> = {};

		if (!force) {
			// Si no es forzado, solo procesar las que no tienen thumbnail
			where.OR = [
				{ thumbnail: null },
				{ thumbnailSize: { gt: 200000 } }, // Muy grandes (>200KB)
			];
		}

		// Obtener imágenes para procesar
		const images = await prisma.image.findMany({
			where,
			select: {
				id: true,
				path: true,
			},
		});

		imageLogger.info(`Reprocesando ${images.length} miniaturas...`);

		// Procesar cada imagen
		for (const image of images) {
			try {
				await generateThumbnail(image.id, quality);
				processed++;
			} catch (error) {
				errors++;
				imageLogger.error('Error reprocesando thumbnail:', { imageId: image.id, error });
			}
		}

		const totalTime = (Date.now() - startTime) / 1000;

		imageLogger.info('Reprocesamiento completado', {
			processed,
			errors,
			totalTime,
			imagesPerSecond: (processed / totalTime).toFixed(2),
		});

		return { processed, errors, totalTime };
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: 'Error al reprocesar los thumbnails',
		});
	}
}

export async function generateThumbnailWithForce(
	imageId: string,
	quality: ThumbnailQuality = ThumbnailQuality.MEDIUM,
	force = false
): Promise<void> {
	if (!force) {
		await generateThumbnail(imageId, quality);
		return;
	}

	const prisma = await getPrismaClient();
	const image = await prisma.image.findUnique({ where: { id: imageId } });
	if (!image) {
		throw createEntityNotFoundError('Imagen', imageId, SERVER_ACTION_NAME);
	}

	await imageService.generateThumbnail(imageId);
	revalidatePath(`/api/thumbnails/${imageId}`);
}
