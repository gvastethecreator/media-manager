// @ts-nocheck - Temporary suppression for implicit any parameter types and type mismatches
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	characters,
	collections,
	folders,
	imageStats,
	images,
	places,
	tags,
	videos,
	worldItems,
} from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
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
	console.log('🔍 [getSystemStats] Iniciando función...');
	statsLogger.info('📊 Obteniendo estadísticas del sistema');

	try {
		// Obtener conteos reales de la base de datos
		const [foldersCount, imagesCount, videosCount] = await Promise.all([
			db.select({ count: sql<number>`count(*)` }).from(folders),
			db.select({ count: sql<number>`count(*)` }).from(images),
			db.select({ count: sql<number>`count(*)` }).from(videos),
		]);

		// Calcular tamaño total
		const totalSizeResult = await db
			.select({ totalSize: sql<number>`COALESCE(SUM(${folders.totalSize}), 0)` })
			.from(folders);

		const result = {
			totalImages: imagesCount[0]?.count || 0,
			totalFolders: foldersCount[0]?.count || 0,
			totalTags: 0,
			totalCollections: 0,
			totalAlbums: 0,
			totalCharacters: 0,
			totalPlaces: 0,
			totalWorldItems: 0,
			totalFavorites: 0,
			totalViews: 0,
			totalDownloads: 0,
			totalSize: totalSizeResult[0]?.totalSize || 0,
			totalActivities: 0,
			topTags: [],
			recentActivity: [],
		} satisfies GeneralStats;

		statsLogger.info('✅ Estadísticas del sistema obtenidas');
		return result;
	} catch (error) {
		console.error('🚨 [getSystemStats] Error capturado:', error);
		statsLogger.error('Error al obtener estadísticas del sistema:', error);
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

// Función para obtener estadísticas detalladas de carpetas
export async function getFolderStats(): Promise<import('@/types/folders').FolderStats | null> {
	try {
		statsLogger.info('📊 Obteniendo estadísticas detalladas de carpetas');

		// Obtener conteos y estadísticas con logging detallado
		statsLogger.info('🔍 Ejecutando consultas a la base de datos...');
		const [foldersCount, imagesCount, videosCount, totalSizeResult] = await Promise.all([
			db
				.select({ count: sql<number>`count(*)` })
				.from(folders)
				.then((result: any) => {
					statsLogger.info('✅ Consulta folders completada:', result);
					return result;
				})
				.catch((error) => {
					statsLogger.error('❌ Error en consulta folders:', error);
					throw error;
				}),
			db
				.select({ count: sql<number>`count(*)` })
				.from(images)
				.then((result) => {
					statsLogger.info('✅ Consulta images completada:', result);
					return result;
				})
				.catch((error) => {
					statsLogger.error('❌ Error en consulta images:', error);
					throw error;
				}),
			db
				.select({ count: sql<number>`count(*)` })
				.from(videos)
				.then((result) => {
					statsLogger.info('✅ Consulta videos completada:', result);
					return result;
				})
				.catch((error) => {
					statsLogger.error('❌ Error en consulta videos:', error);
					throw error;
				}),
			db
				.select({ totalSize: sql<number>`COALESCE(SUM(${folders.totalSize}), 0)` })
				.from(folders)
				.then((result) => {
					statsLogger.info('✅ Consulta totalSize completada:', result);
					return result;
				})
				.catch((error) => {
					statsLogger.error('❌ Error en consulta totalSize:', error);
					throw error;
				}),
		]);

		const totalFolders = foldersCount[0]?.count || 0;
		const totalImages = imagesCount[0]?.count || 0;
		const totalVideos = videosCount[0]?.count || 0;
		const totalSize = totalSizeResult[0]?.totalSize || 0;
		const totalFiles = totalImages + totalVideos;

		// Formatear tamaño
		const formatBytes = (bytes: number): string => {
			if (bytes === 0) return '0 B';
			const k = 1024;
			const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
		};

		const result = {
			totalFolders,
			totalFiles,
			totalImages,
			totalVideos,
			totalAudio: 0, // TODO: Implementar cuando se agregue tabla de audio
			totalDocuments: 0, // TODO: Implementar cuando se agregue tabla de documentos
			totalOthers: 0, // TODO: Implementar cuando se agregue tabla de otros archivos
			totalSize,
			formattedSize: formatBytes(totalSize),
			directoryCount: totalFolders, // Para compatibilidad
			lastScanned: new Date().toISOString(),
		};

		statsLogger.info('✅ Estadísticas detalladas de carpetas obtenidas');
		return result;
	} catch (error) {
		statsLogger.error('❌ Error al obtener estadísticas de carpetas:', error);
		return null;
	}
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

		// Validación null-safe para evitar errores de Object.entries
		let stats;
		try {
			stats = await db.query.imageStats.findFirst({
				where: eq(imageStats.imageId, imageId),
			});
		} catch (queryError) {
			statsLogger.warn('⚠️ Error en query de imageStats, creando estadísticas por defecto:', queryError);
			stats = null;
		}

		if (!stats) {
			statsLogger.info('➕ Creando estadísticas para imagen:', imageId);
			const [newStats] = await db
				.insert(imageStats)
				.values({
					id: randomUUID(),
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
