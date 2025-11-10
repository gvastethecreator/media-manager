/**
 * @file Funciones de estadísticas para el servicio de etiquetas
 * @module services/tag/stats
 */

import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { images, imageTags, tags } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { TagServiceError } from '../types/tag-service.types';

const logger = serverLogger.withContext('TagService');

/**
 * Interfaz para las estadísticas de una etiqueta
 */
export interface TagStats {
	id: string;
	name: string;
	totalImages: number;
	recentImagesCount: number;
	averageFileSize: number;
	topFormats: Array<{ format: string; count: number }>;
	sizeDistribution: {
		small: number; // < 1MB
		medium: number; // 1-10MB
		large: number; // > 10MB
	};
	createdAt: Date;
	lastImageAdded?: Date;
}

/**
 * Obtiene estadísticas detalladas de una etiqueta
 */
export async function getTagStats(id: string): Promise<TagStats | null> {
	try {
		const tagExists = await db.select().from(tags).where(eq(tags.id, id)).limit(1);

		if (tagExists.length === 0) {
			return null;
		}

		const tag = tagExists[0];

		// Obtener estadísticas de imágenes asociadas
		const imageStats = await db
			.select({
				totalImages: count(images.id),
				// Promedio real usando SUM(size)/COUNT(*). Drizzle no expone sum tipado directo en este snippet -> calculamos manual luego.
				totalSize: count(images.id), // placeholder; se recalcula abajo sumando iteración sizeDistribution
			})
			.from(images)
			.innerJoin(imageTags, eq(images.id, imageTags.A))
			.where(eq(imageTags.B, id));

		// Contar imágenes por tamaño
		const sizeDistribution = await db
			.select({ size: images.size })
			.from(images)
			.innerJoin(imageTags, eq(images.id, imageTags.A))
			.where(eq(imageTags.B, id));

		// Calcular distribución de tamaños
		let small = 0;
		let medium = 0;
		let large = 0;
		let totalSize = 0;

		for (const img of sizeDistribution) {
			const size = img.size || 0;
			totalSize += size;

			if (size < 1024 * 1024) {
				// < 1MB
				small++;
			} else if (size < 10 * 1024 * 1024) {
				// < 10MB
				medium++;
			} else {
				large++;
			}
		}

		const totalImages = imageStats[0]?.totalImages || 0;
		const averageFileSize = totalImages > 0 ? totalSize / totalImages : 0;

		// Obtener "formatos" más populares derivando de la extensión del nombre (name o path) dado que el schema Image no tiene columna format/mimeType.
		// Estrategia: consultar nombres y luego contar en memoria (volumen reducido por filtro de tag). Si escala, considerar vista materializada.
		const rawFormatRows = await db
			.select({
				name: images.name,
				path: images.path,
				id: images.id,
			})
			.from(images)
			.innerJoin(imageTags, eq(images.id, imageTags.A))
			.where(eq(imageTags.B, id));

		const formatCounter: Record<string, number> = {};
		for (const row of rawFormatRows) {
			const base = row.name || row.path || '';
			const extMatch = base.match(/\.([a-zA-Z0-9]+)$/);
			const ext = extMatch ? extMatch[1].toLowerCase() : 'unknown';
			formatCounter[ext] = (formatCounter[ext] || 0) + 1;
		}
		const formatStats = Object.entries(formatCounter)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([format, count]) => ({ format, count }));

		// Fecha de la última imagen agregada
		const lastImageResult = await db
			.select({ createdAt: images.createdAt })
			.from(images)
			.innerJoin(imageTags, eq(images.id, imageTags.A))
			.where(eq(imageTags.B, id))
			.orderBy(desc(images.createdAt))
			.limit(1);

		return {
			id: tag.id,
			name: tag.name,
			totalImages,
			recentImagesCount: totalImages, // Puede refinarse con filtro de fecha
			averageFileSize,
			topFormats: formatStats.map((f: { format: string | null; count: number }) => ({
				format: f.format || 'unknown',
				count: f.count,
			})),
			sizeDistribution: {
				small,
				medium,
				large,
			},
			createdAt: tag.createdAt,
			lastImageAdded: lastImageResult[0]?.createdAt,
		};
	} catch (error) {
		logger.error('Error obteniendo estadísticas de etiqueta', {
			tagId: id,
			error,
		});
		throw new TagServiceError(`Error al obtener estadísticas de la etiqueta: ${(error as Error).message}`);
	}
}
