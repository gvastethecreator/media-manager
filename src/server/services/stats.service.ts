// @ts-nocheck - Temporary suppression for implicit any parameter types and type mismatches
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	albums,
	audios,
	characters,
	collections,
	concepts,
	documents,
	favorites,
	file3Ds,
	folders,
	imageStats,
	images,
	jsonFiles,
	metadatas,
	notes,
	places,
	prompts,
	properties,
	tags,
	thumbnails,
	videos,
	wildcards,
	workflows,
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
	totalVideos: number;
	totalAudio: number;
	totalDocuments: number;
	totalJsonFiles: number;
	totalFile3D: number;
	totalWorkflows: number;
	totalFolders: number;
	totalAlbums: number;
	totalCollections: number;
	totalTags: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalConcepts: number;
	totalPrompts: number;
	totalNotes: number;
	totalProperties: number;
	totalWildcards: number;
	totalFavorites: number;
	totalThumbnails: number;
	totalMetadata: number;
	totalViews: number;
	totalDownloads: number;
	totalSize: number;
	totalActivities: number;
	// Información de espacio
	usedSpace?: number;
	freeSpace?: number;
	diskUsage?: {
		total: number;
		used: number;
		free: number;
		usedPercentage: number;
	};
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
export async function getGeneralSystemStats(): Promise<GeneralStats | null> {
	console.log('🎯🎯🎯 [NUEVA FUNCIÓN] getGeneralSystemStats MEJORADA iniciando...');
	statsLogger.info('📊 Obteniendo estadísticas del sistema CON 22 ENTIDADES');

	try {
		console.log('🎯🎯🎯 [NUEVA FUNCIÓN] Ejecutando 22 consultas en paralelo...');

		// Obtener conteos de todas las entidades en paralelo para mejor rendimiento
		const [
			foldersCount,
			imagesCount,
			videosCount,
			audiosCount,
			documentsCount,
			jsonFilesCount,
			file3DsCount,
			workflowsCount,
			albumsCount,
			collectionsCount,
			tagsCount,
			charactersCount,
			placesCount,
			worldItemsCount,
			conceptsCount,
			promptsCount,
			notesCount,
			propertiesCount,
			wildcardsCount,
			favoritesCount,
			thumbnailsCount,
			metadataCount,
		] = await Promise.all([
			db.select({ count: sql<number>`count(*)` }).from(folders),
			db.select({ count: sql<number>`count(*)` }).from(images),
			db.select({ count: sql<number>`count(*)` }).from(videos),
			db.select({ count: sql<number>`count(*)` }).from(audios),
			db.select({ count: sql<number>`count(*)` }).from(documents),
			db.select({ count: sql<number>`count(*)` }).from(jsonFiles),
			db.select({ count: sql<number>`count(*)` }).from(file3Ds),
			db.select({ count: sql<number>`count(*)` }).from(workflows),
			db.select({ count: sql<number>`count(*)` }).from(albums),
			db.select({ count: sql<number>`count(*)` }).from(collections),
			db.select({ count: sql<number>`count(*)` }).from(tags),
			db.select({ count: sql<number>`count(*)` }).from(characters),
			db.select({ count: sql<number>`count(*)` }).from(places),
			db.select({ count: sql<number>`count(*)` }).from(worldItems),
			db.select({ count: sql<number>`count(*)` }).from(concepts),
			db.select({ count: sql<number>`count(*)` }).from(prompts),
			db.select({ count: sql<number>`count(*)` }).from(notes),
			db.select({ count: sql<number>`count(*)` }).from(properties),
			db.select({ count: sql<number>`count(*)` }).from(wildcards),
			db.select({ count: sql<number>`count(*)` }).from(favorites),
			db.select({ count: sql<number>`count(*)` }).from(thumbnails),
			db.select({ count: sql<number>`count(*)` }).from(metadatas),
		]);

		console.log('🎯🎯🎯 [NUEVA FUNCIÓN] ✅ Todas las 22 consultas completadas exitosamente');

		// Calcular tamaños
		const [totalSizeResult, audioSizeResult, documentSizeResult, jsonSizeResult, file3DSizeResult] = await Promise.all([
			db.select({ totalSize: sql<number>`COALESCE(SUM(${folders.totalSize}), 0)` }).from(folders),
			db.select({ totalSize: sql<number>`COALESCE(SUM(${audios.size}), 0)` }).from(audios),
			db.select({ totalSize: sql<number>`COALESCE(SUM(${documents.size}), 0)` }).from(documents),
			db.select({ totalSize: sql<number>`COALESCE(SUM(${jsonFiles.size}), 0)` }).from(jsonFiles),
			db.select({ totalSize: sql<number>`COALESCE(SUM(${file3Ds.size}), 0)` }).from(file3Ds),
		]);

		// Calcular información de disco (aproximada basada en el total de archivos)
		const totalFileSize =
			(totalSizeResult[0]?.totalSize || 0) +
			(audioSizeResult[0]?.totalSize || 0) +
			(documentSizeResult[0]?.totalSize || 0) +
			(jsonSizeResult[0]?.totalSize || 0) +
			(file3DSizeResult[0]?.totalSize || 0);

		const result = {
			// Archivos multimedia
			totalImages: imagesCount[0]?.count || 0,
			totalVideos: videosCount[0]?.count || 0,
			totalAudio: audiosCount[0]?.count || 0,
			totalDocuments: documentsCount[0]?.count || 0,
			totalJsonFiles: jsonFilesCount[0]?.count || 0,
			totalFile3D: file3DsCount[0]?.count || 0,
			totalWorkflows: workflowsCount[0]?.count || 0,

			// Organización
			totalFolders: foldersCount[0]?.count || 0,
			totalAlbums: albumsCount[0]?.count || 0,
			totalCollections: collectionsCount[0]?.count || 0,
			totalTags: tagsCount[0]?.count || 0,
			totalFavorites: favoritesCount[0]?.count || 0,

			// Worldbuilding
			totalCharacters: charactersCount[0]?.count || 0,
			totalPlaces: placesCount[0]?.count || 0,
			totalWorldItems: worldItemsCount[0]?.count || 0,
			totalConcepts: conceptsCount[0]?.count || 0,
			totalPrompts: promptsCount[0]?.count || 0,
			totalNotes: notesCount[0]?.count || 0,
			totalProperties: propertiesCount[0]?.count || 0,
			totalWildcards: wildcardsCount[0]?.count || 0,

			// Sistema
			totalThumbnails: thumbnailsCount[0]?.count || 0,
			totalMetadata: metadataCount[0]?.count || 0,
			totalViews: 0, // TODO: Implementar cuando se agregue sistema de vistas
			totalDownloads: 0, // TODO: Implementar cuando se agregue sistema de descargas
			totalSize: totalFileSize,
			totalActivities: 0, // TODO: Implementar actividades

			// Información de espacio
			usedSpace: totalFileSize,
			freeSpace: 0, // TODO: Calcular espacio libre real del disco
			diskUsage: {
				total: totalFileSize, // Temporal - usar espacio total del disco
				used: totalFileSize,
				free: 0,
				usedPercentage: 0,
			},

			topTags: [],
			recentActivity: [],
		} satisfies GeneralStats;

		statsLogger.info('✅ Estadísticas del sistema obtenidas');
		return result;
	} catch (error) {
		console.error('🚨 [getGeneralSystemStats] Error capturado:', error);
		statsLogger.error('Error al obtener estadísticas del sistema:', error);
		return null;
	}
}

// Función de compatibilidad para evitar conflictos con system.service.ts
export async function getSystemStats(): Promise<GeneralStats | null> {
	console.log('🔄 [COMPATIBILITY] getSystemStats redirigiendo a getGeneralSystemStats...');
	return await getGeneralSystemStats();
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
	const base = await getGeneralSystemStats();
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

export async function getStats(): Promise<GeneralStats | null> {
	try {
		statsLogger.info('📊 Obteniendo estadísticas detalladas (usando getGeneralSystemStats)');

		// Usar la función mejorada getGeneralSystemStats() que incluye todas las entidades
		const systemStats = await getGeneralSystemStats();

		if (!systemStats) {
			statsLogger.error('❌ No se pudieron obtener las estadísticas del sistema');
			return null;
		}

		statsLogger.info('✅ Estadísticas detalladas obtenidas exitosamente');
		return systemStats;
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
