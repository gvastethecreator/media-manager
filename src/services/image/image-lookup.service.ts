/**
 * @file Servicio de búsqueda de imágenes
 * @module services/image/image-lookup
 * @description Métodos de búsqueda y lookup de imágenes por diferentes criterios
 */

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { fileStats, images } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { ServiceErrorCode, toServiceError } from '@/lib/utils/errors/service-errors';
import type { ImageWithStats } from '@/types/entities/image/types';
import { SERVICE_NAME } from './image-utils';

const lookupLogger = serverLogger.withContext(`${SERVICE_NAME}:Lookup`);

/**
 * Construye objeto ImageWithStats desde un registro raw de la base de datos
 */
export function buildImageWithStats(image: typeof images.$inferSelect): ImageWithStats {
	return {
		...image,
		isFavorite: Boolean(image.isFavorite),
		updatedAt: image.updatedAt ?? image.createdAt,
		// Campos opcionales de ImageWithStats
		statistics: {
			views: 0,
			likes: 0,
			shares: 0,
			downloads: 0,
			qualityScore: 0,
			aestheticScore: 0,
			technicalScore: 0,
			popularityScore: 0,
		},
		dimensions: {
			width: image.width,
			height: image.height,
			aspectratio: image.width / image.height,
			orientation: image.width > image.height ? 'landscape' : image.width < image.height ? 'portrait' : 'square',
		},
		url: `/api/images/${image.id}/original`,
	} as ImageWithStats;
}

/**
 * Busca una imagen por su hash
 *
 * @param hash - Hash de la imagen
 * @returns Imagen con estadísticas o null si no se encuentra
 */
export async function getImageByHash(hash: string): Promise<ImageWithStats | null> {
	try {
		lookupLogger.info('🔍 Buscando imagen por hash:', hash);

		const result = await db.select().from(images).where(eq(images.hash, hash)).limit(1);

		if (result.length === 0) {
			lookupLogger.info('Imagen no encontrada por hash:', hash);
			return null;
		}

		lookupLogger.info('✅ Imagen encontrada por hash:', result[0].name);
		return buildImageWithStats(result[0]);
	} catch (error) {
		lookupLogger.error('❌ Error al buscar imagen por hash:', error);
		throw toServiceError(error, {
			code: ServiceErrorCode.DATABASE_ERROR,
			message: 'Error al buscar imagen por hash',
			context: { hash },
			serviceName: SERVICE_NAME,
		});
	}
}

/**
 * Busca una imagen por path y folderId para evitar duplicados
 *
 * @param path - Ruta del archivo
 * @param folderId - ID de la carpeta
 * @returns Imagen con estadísticas o null si no se encuentra
 */
export async function getImageByPathAndFolder(path: string, folderId: string): Promise<ImageWithStats | null> {
	try {
		lookupLogger.info('🔍 Buscando imagen por path y folderId:', { path, folderId });

		const result = await db
			.select()
			.from(images)
			.where(and(eq(images.path, path), eq(images.folderId, folderId)))
			.limit(1);

		if (result.length === 0) {
			lookupLogger.info('Imagen no encontrada por path y folderId');
			return null;
		}

		const image = result[0];

		// Obtener estadísticas de la imagen
		const statsResult = await db.select().from(fileStats).where(eq(fileStats.fileId, image.id)).limit(1);

		const stats = statsResult[0] || { views: 0 };

		// Construir ImageWithStats con stats actualizadas
		const imageWithStats = buildImageWithStats(image);
		if (imageWithStats.statistics) {
			imageWithStats.statistics.views = (stats as any).views ?? 0;
		}

		return imageWithStats;
	} catch (error) {
		lookupLogger.error('❌ Error al buscar imagen por path y folderId:', error);
		throw toServiceError(error, {
			code: ServiceErrorCode.DATABASE_ERROR,
			message: 'Error al buscar imagen por path y folderId',
			context: { path, folderId },
			serviceName: SERVICE_NAME,
		});
	}
}
