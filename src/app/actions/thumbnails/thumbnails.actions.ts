'use server';

import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { generateThumbnail } from '@/lib/thumbnail';
import { thumbnailService } from '@/services/thumbnail.service';
import type { ProcessOptions } from '@/services/thumbnail.service';
import type { LastProcessedThumbnail, ThumbnailStats } from '@/types/thumbnails';
import { revalidatePath } from 'next/cache';

const thumbLogger = logger.withContext('ThumbnailActions');

export interface ThumbnailResponse {
	thumbnail: string;
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
		thumbLogger.info('🔄 Obteniendo thumbnail:', { id, quality });

		if (!id) {
			throw new Error('ID no proporcionado');
		}

		const image = await prisma.image.findUnique({
			where: { id },
			select: {
				id: true,
				path: true,
				thumbnail: true,
				thumbnailSize: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				thumbnailError: true,
			},
		});

		if (!image) {
			throw new Error(`Imagen no encontrada: ${id}`);
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
			const base64Thumbnail = Buffer.from(image.thumbnail).toString('base64');

			thumbLogger.info('✅ Thumbnail encontrado en caché:', {
				id,
				size: image.thumbnailSize,
				width: image.thumbnailWidth,
				height: image.thumbnailHeight,
			});

			return {
				thumbnail: base64Thumbnail,
				width: image.thumbnailWidth || undefined,
				height: image.thumbnailHeight || undefined,
				size: image.thumbnailSize || undefined,
				mimeType: 'image/webp',
			};
		}

		// Si no tiene thumbnail, generarlo
		thumbLogger.info('🔄 Generando nuevo thumbnail:', { id, path: image.path });

		try {
			const thumbnail = await generateThumbnail(image.path, { quality });

			if (!thumbnail || !thumbnail.buffer) {
				throw new Error('No se pudo generar el thumbnail');
			}

			// Convertir el buffer a base64
			const base64Thumbnail = Buffer.from(thumbnail.buffer).toString('base64');

			// Actualizar la imagen con el nuevo thumbnail
			await prisma.image.update({
				where: { id },
				data: {
					thumbnail: thumbnail.buffer,
					thumbnailSize: thumbnail.buffer.length,
					thumbnailWidth: thumbnail.width,
					thumbnailHeight: thumbnail.height,
					thumbnailError: null, // Limpiar error previo si existía
				},
			});

			thumbLogger.info('✅ Nuevo thumbnail generado:', {
				id,
				size: thumbnail.buffer.length,
				width: thumbnail.width,
				height: thumbnail.height,
			});

			return {
				thumbnail: base64Thumbnail,
				width: thumbnail.width,
				height: thumbnail.height,
				size: thumbnail.buffer.length,
				mimeType: 'image/webp',
			};
		} catch (error) {
			const genError = error as Error;
			// Registrar el error en la base de datos
			await prisma.image.update({
				where: { id },
				data: {
					thumbnailError: genError.message,
				},
			});

			throw genError;
		}
	} catch (error) {
		const err = error as Error;
		thumbLogger.error('❌ Error obteniendo thumbnail:', { id, error: err });

		return {
			thumbnail: '',
			error: err.message || 'Error desconocido generando thumbnail',
		};
	}
}

export async function optimizeThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando optimización de thumbnails');
		return await thumbnailService.optimizeThumbnails(options);
	} catch (error) {
		thumbLogger.error('❌ Error optimizando thumbnails:', error);
		throw error;
	}
}

export async function reprocessThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando reprocesamiento de thumbnails');
		return await thumbnailService.reprocessAll(options);
	} catch (error) {
		thumbLogger.error('❌ Error reprocesando thumbnails:', error);
		throw error;
	}
}

export async function cleanThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando limpieza de thumbnails');
		return await thumbnailService.cleanThumbnails(options);
	} catch (error) {
		thumbLogger.error('❌ Error limpiando thumbnails:', error);
		throw error;
	}
}

export async function getLastProcessedThumbnails(limit = 9): Promise<LastProcessedThumbnail[]> {
	try {
		thumbLogger.info('🔄 Obteniendo últimas miniaturas procesadas:', { limit });

		const images = await prisma.image.findMany({
			where: {
				thumbnail: { not: null },
				thumbnailSize: { not: null },
			},
			orderBy: {
				updatedAt: 'desc',
			},
			take: limit,
			select: {
				id: true,
				path: true,
				updatedAt: true,
				thumbnailSize: true,
			},
		});

		return images.map((image) => ({
			id: image.id,
			path: image.path,
			processedAt: image.updatedAt.toISOString(),
			saved: image.thumbnailSize || 0,
		}));
	} catch (error) {
		thumbLogger.error('❌ Error obteniendo últimas miniaturas:', error);
		throw error;
	}
}

export async function getThumbnailStats(): Promise<ThumbnailStats> {
	try {
		thumbLogger.info('🔄 Obteniendo estadísticas de thumbnails');

		const [totalFiles, withThumbnail, pending, errors] = await Promise.all([
			prisma.image.count(),
			prisma.image.count({
				where: {
					thumbnail: { not: null },
				},
			}),
			prisma.image.count({
				where: {
					thumbnail: null,
				},
			}),
			prisma.image.findMany({
				where: {
					thumbnailError: { not: null },
				},
				select: {
					id: true,
					path: true,
					thumbnailError: true,
					updatedAt: true,
				},
			}),
		]);

		const totalSize = await prisma.image.aggregate({
			_sum: {
				thumbnailSize: true,
			},
			where: {
				thumbnailSize: { not: null },
			},
		});

		return {
			totalFiles,
			withThumbnail,
			pending,
			processed: withThumbnail,
			totalSize: totalSize._sum.thumbnailSize || 0,
			errors: errors.map((error) => ({
				imageId: error.id,
				imagePath: error.path,
				error: error.thumbnailError || 'Error desconocido',
				timestamp: error.updatedAt,
			})),
		};
	} catch (error) {
		thumbLogger.error('❌ Error obteniendo estadísticas:', error);
		throw error;
	}
}

export async function verifySignedToken(token: string): Promise<{ buffer: Buffer; mimeType: string }> {
	try {
		thumbLogger.info('🔄 Verificando token firmado:', token);
		const result = await thumbnailService.verifySignedToken(token);
		thumbLogger.info('✅ Token verificado correctamente');
		return result;
	} catch (error) {
		thumbLogger.error('❌ Error verificando token:', error);
		throw new Error('Token inválido o expirado');
	}
}
