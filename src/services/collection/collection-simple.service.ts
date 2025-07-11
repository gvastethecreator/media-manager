/**
 * @file Servicio SIMPLIFICADO para colecciones (temporal para migración Drizzle)
 */

import { desc } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { collections } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import type { CollectionWithStats } from '@/types/entities/collection';

const logger = serverLogger.withContext('CollectionService');

/**
 * Obtiene todas las colecciones de forma simplificada
 */
export const getCollections = async (): Promise<CollectionWithStats[]> => {
	try {
		logger.info('📚 Obteniendo todas las colecciones');

		const drizzleCollections = await db.select().from(collections).orderBy(desc(collections.createdAt));

		const result = drizzleCollections.map((collection: any) => ({
			...collection,
			isFavorite: Boolean(collection.isFavorite),
			isPublic: Boolean(collection.isPublic),
			stats: {
				imageCount: collection.totalImages || 0,
				videoCount: collection.totalVideos || 0,
				albumCount: 0,
				tagCount: 0,
				characterCount: 0,
				placeCount: 0,
				worldItemCount: 0,
				conceptCount: 0,
				promptCount: 0,
				noteCount: 0,
				wildcardCount: 0,
				propertyCount: 0,
				groupCount: 0,
			},
		})) as CollectionWithStats[];

		logger.info(`✅ ${result.length} colecciones obtenidas`);
		return result;
	} catch (error) {
		logger.error('❌ Error al obtener colecciones', { error });
		return [];
	}
};
