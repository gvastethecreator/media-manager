/**
 * @file Transformador principal para la entidad Collection
 * @module transformers/collection/transformer
 * @description Contiene la lógica para convertir un objeto Collection de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { CollectionWithStats, PrismaCollectionWithCounts } from '@/types/entities/collection';

const logger = serverLogger.withContext('CollectionTransformer');

/**
 * 🔄 Transforma un objeto Collection de Drizzle a nuestro tipo canónico CollectionWithStats.
 *
 * @param drizzleCollection - El objeto Collection obtenido de Drizzle con conteos.
 * @returns Un objeto CollectionWithStats compatible con nuestra aplicación, o null.
 */
export function fromDrizzleCollection(drizzleCollection: PrismaCollectionWithCounts | null): CollectionWithStats | null {
	if (!drizzleCollection) {
		return null;
	}

	try {
		const { _count, ...baseData } = drizzleCollection;

		// Calcular estadísticas
		const totalImages = _count?.images ?? 0;
		const totalVideos = _count?.videos ?? 0;
		const totalItems = totalImages + totalVideos;

		// Calcular total de entidades relacionadas
		const totalEntities =
			(_count?.albums ?? 0) +
			(_count?.tags ?? 0) +
			(_count?.characters ?? 0) +
			(_count?.places ?? 0) +
			(_count?.worldItems ?? 0) +
			(_count?.concepts ?? 0) +
			(_count?.prompts ?? 0) +
			(_count?.notes ?? 0) +
			(_count?.wildcards ?? 0) +
			(_count?.properties ?? 0) +
			(_count?.groups ?? 0);

		const stats = {
			totalItems,
			totalImages,
			totalVideos,
			totalEntities,
			lastUpdated: drizzleCollection.updatedAt,
		};

		return {
			...baseData,
			stats,
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				albums: _count?.albums ?? 0,
				tags: _count?.tags ?? 0,
				characters: _count?.characters ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando colección desde Drizzle', {
			error,
			collectionId: drizzleCollection?.id,
		});
		return null;
	}
}

/**
 * 🔄 Transforma una lista de colecciones de Drizzle a una lista de CollectionWithStats.
 *
 * @param drizzleCollections - Un array de objetos Collection de Drizzle.
 * @returns Un array de objetos CollectionWithStats.
 */
export function fromDrizzleCollections(drizzleCollections: PrismaCollectionWithCounts[]): CollectionWithStats[] {
	return drizzleCollections.map(fromDrizzleCollection).filter((c): c is CollectionWithStats => c !== null);
}
