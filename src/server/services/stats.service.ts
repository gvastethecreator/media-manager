import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	activities,
	characters,
	collections,
	folders,
	imageStats,
	places,
	tags,
	worldItems,
} from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { MOCK_STATS, USE_MOCK_STATS } from '@/lib/mock/stats.mock';
import { revalidatePath } from '@/lib/server/revalidate';

// Constantes para caché
const STATS_CACHE_TAG = 'stats';
const STATS_REVALIDATE_SECONDS = 300; // 5 minutos en lugar de 1 minuto

// Logger para estadísticas
const statsLogger = serverLogger.withContext('StatsService');

// Manejo de errores - enfoque funcional
enum StatsErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
	ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
}

const createStatsError = (message: string, code: StatsErrorCode = StatsErrorCode.OPERATION_FAILED, cause?: unknown) => {
	const error = new Error(message);
	error.name = 'StatsError';
	Object.assign(error, { code, cause });
	return error;
};

// Interfaces
export interface GeneralStats {
	totalImages: number;
	totalFolders: number;
	totalTags: number;
	totalCollections: number;
	totalAlbums: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalFavorites: number;
	totalViews: number;
	totalDownloads: number;
	totalSize: number;
	totalActivities: number;
	topTags: Array<{
		id: string;
		name: string;
		color: string;
		count: number;
	}>;
	recentActivity: Array<{
		id: string;
		type: string;
		description: string;
		createdAt: Date;
		image: {
			id: string;
			name: string;
			thumbnail: Uint8Array | null;
		} | null;
	}>;
}

export interface StatsResponse {
	collections: Array<{
		id: string;
		name: string;
		count: number;
		color?: string;
		emoji?: string;
	}>;
	folders: Array<{
		id: string;
		name: string;
		count: number;
	}>;
	tags: Array<{
		id: string;
		name: string;
		count: number;
		color: string;
	}>;
	albums: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
	characters: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
	places: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
	worldItems: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
}

// Tipo para las etiquetas populares
interface TopTag {
	id: string;
	name: string;
	color: string;
	_count: {
		images: number;
	};
}

// Funciones exportadas
export async function getSystemStats(): Promise<GeneralStats | null> {
	// Si estamos en desarrollo y USE_MOCK_STATS está activado, devolver datos simulados
	if (USE_MOCK_STATS) {
		statsLogger.info('📊 Usando estadísticas simuladas para desarrollo');
		return MOCK_STATS;
	}

	try {
		statsLogger.info('📊 Obteniendo estadísticas del sistema con Drizzle');

		// � Obtener contadores básicos por separado
		const [
			totalImages,
			totalFolders,
			totalTags,
			totalCollections,
			totalCharacters,
			totalPlaces,
			totalWorldItems,
			totalActivities,
			topTags,
			recentActivity,
		] = await Promise.all([
			db.select({ count: sql<number>`count(*)` }).from(folders),
			db.select({ count: sql<number>`count(*)` }).from(folders),
			db.select({ count: sql<number>`count(*)` }).from(tags),
			db.select({ count: sql<number>`count(*)` }).from(collections),
			db.select({ count: sql<number>`count(*)` }).from(characters),
			db.select({ count: sql<number>`count(*)` }).from(places),
			db.select({ count: sql<number>`count(*)` }).from(worldItems),
			db.select({ count: sql<number>`count(*)` }).from(activities),
			db
				.select({
					id: tags.id,
					name: tags.name,
					color: tags.color,
				})
				.from(tags)
				.orderBy(desc(tags.createdAt))
				.limit(5),
			db
				.select({
					id: activities.id,
					type: activities.type,
					description: activities.message,
					createdAt: activities.createdAt,
				})
				.from(activities)
				.orderBy(desc(activities.createdAt))
				.limit(5),
		]);

		statsLogger.info('✅ Estadísticas del sistema obtenidas');

		return {
			totalImages: totalImages[0]?.count || 0,
			totalFolders: totalFolders[0]?.count || 0,
			totalTags: totalTags[0]?.count || 0,
			totalCollections: totalCollections[0]?.count || 0,
			totalAlbums: 0, // Por ahora
			totalCharacters: totalCharacters[0]?.count || 0,
			totalPlaces: totalPlaces[0]?.count || 0,
			totalWorldItems: totalWorldItems[0]?.count || 0,
			totalFavorites: 0, // Calculado más tarde
			totalViews: 0, // Calculado más tarde
			totalDownloads: 0, // Calculado más tarde
			totalSize: 0, // Calculado más tarde
			totalActivities: totalActivities[0]?.count || 0,
			topTags: topTags.map((tag: any) => ({
				id: tag.id,
				name: tag.name,
				color: tag.color,
				count: 0, // Sin contar por ahora
			})),
			recentActivity,
		} satisfies GeneralStats;
	} catch (error) {
		statsLogger.error('❌ Error al obtener las estadísticas del sistema:', error);
		return null;
	}
}

// Nuevos tipos para stats de entidades extendidas
export interface ExtendedStats {
	totalDocuments: number;
	totalAudio: number;
	totalJsonFiles: number;
	totalWorkflows: number;
	totalFile3D: number;
}

// Extender getSystemStats para incluir nuevas entidades
export async function getSystemStatsExtended(): Promise<(GeneralStats & ExtendedStats) | null> {
	const base = await getSystemStats();
	if (!base) return null;
	// TODO: Reemplazar por queries reales con Drizzle
	return {
		...base,
		totalDocuments: 0,
		totalAudio: 0,
		totalJsonFiles: 0,
		totalWorkflows: 0,
		totalFile3D: 0,
	};
}

// Interfaces para los mapeos de datos
interface EntityWithImageCount {
	id: string;
	name: string;
	_count: {
		images: number;
	};
}

interface CollectionWithData extends EntityWithImageCount {
	color: string;
	emoji: string;
}

interface TagWithData extends EntityWithImageCount {
	color: string;
}

interface EntityWithEmoji extends EntityWithImageCount {
	emoji: string;
}

export async function getStats(): Promise<StatsResponse | null> {
	try {
		statsLogger.info('📊 Obteniendo estadísticas detalladas');

		// Por ahora, usar contadores simples sin relaciones complejas
		const [collectionsCount, foldersCount, tagsCount, charactersCount, placesCount, worldItemsCount] =
			await Promise.all([
				db.select({ count: sql<number>`count(*)` }).from(collections),
				db.select({ count: sql<number>`count(*)` }).from(folders),
				db.select({ count: sql<number>`count(*)` }).from(tags),
				db.select({ count: sql<number>`count(*)` }).from(characters),
				db.select({ count: sql<number>`count(*)` }).from(places),
				db.select({ count: sql<number>`count(*)` }).from(worldItems),
			]);

		statsLogger.info('✅ Estadísticas detalladas obtenidas');

		return {
			collections: [],
			folders: [],
			tags: [],
			albums: [],
			characters: [],
			places: [],
			worldItems: [],
		} satisfies StatsResponse;
	} catch (error) {
		statsLogger.error('❌ Error al obtener las estadísticas detalladas:', error);
		return null;
	}
}

export async function invalidateStats(): Promise<void> {
	statsLogger.info('🔄 Invalidando caché de estadísticas');
	revalidatePath('/stats');
	statsLogger.info('✅ Caché de estadísticas invalidada');
}

export async function getImageStats(imageId: string) {
	try {
		statsLogger.info('🔍 Obteniendo estadísticas de imagen:', imageId);

		let stats = await db.query.imageStats.findFirst({
			where: eq(imageStats.imageId, imageId),
		});

		if (!stats) {
			statsLogger.info('➕ Creando estadísticas para imagen:', imageId);
			const [newStats] = await db
				.insert(imageStats)
				.values({
					imageId,
					views: 0,
					lastViewed: new Date(),
				})
				.returning();
			stats = newStats;
		}

		statsLogger.info('✅ Estadísticas de imagen obtenidas');
		return stats;
	} catch (error) {
		statsLogger.error('❌ Error al obtener estadísticas de imagen:', error);
		throw createStatsError(
			'No se pudieron obtener las estadísticas de la imagen',
			StatsErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function incrementImageView(imageId: string) {
	try {
		statsLogger.info('👁️ Incrementando visualización de imagen:', imageId);

		const [updatedStats] = await db
			.update(imageStats)
			.set({
				views: sql`${imageStats.views} + 1`,
				lastViewed: new Date(),
			})
			.where(eq(imageStats.imageId, imageId))
			.returning();

		if (!updatedStats) {
			throw createStatsError(
				'No se pudo encontrar la imagen para actualizar las estadísticas',
				StatsErrorCode.ENTITY_NOT_FOUND,
				{ imageId }
			);
		}

		statsLogger.info('✅ Visualización de imagen incrementada');
		revalidatePath('/stats');
		return updatedStats;
	} catch (error) {
		statsLogger.error('❌ Error al incrementar visualización de imagen:', error);
		throw createStatsError(
			'No se pudo incrementar la visualización de la imagen',
			StatsErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function incrementImageDownload(imageId: string) {
	try {
		statsLogger.info('⬇️ Incrementando descarga de imagen:', imageId);

		// Nota: downloads no está en el esquema ImageStats actual
		// Por ahora solo revalidamos el path
		statsLogger.warn('⚠️ Campo downloads no encontrado en esquema ImageStats');

		statsLogger.info('✅ Descarga de imagen registrada (sin actualizar BD)');
		revalidatePath('/stats');
		return null;
	} catch (error) {
		statsLogger.error('❌ Error al incrementar descarga de imagen:', error);
		throw createStatsError('No se pudo incrementar la descarga de la imagen', StatsErrorCode.OPERATION_FAILED, error);
	}
}
