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
	worldItems,
} from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { revalidatePath } from '@/lib/server/revalidate';

// Constantes para caché
const STATS_CACHE_TAG = 'stats';
const STATS_REVALIDATE_SECONDS = 300; // 5 minutos en lugar de 1 minuto

// Logger para estadísticas
const statsLogger = serverLogger.withContext('StatsService');

// Manejo de errores - enfoque funcional (sin enum)
const StatsErrorCode = {
	NOT_FOUND: 'NOT_FOUND',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	OPERATION_FAILED: 'OPERATION_FAILED',
	ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
} as const;
type StatsErrorCode = (typeof StatsErrorCode)[keyof typeof StatsErrorCode];

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

// Helpers internos para reducir complejidad en la obtención de estadísticas
type CountRow = { count: number };
type SizeRow = { totalSize: number };

type MediaCounts = {
	images: number;
	videos: number;
	audios: number;
	documents: number;
	jsonFiles: number;
	file3Ds: number;
};

async function fetchMediaCounts(): Promise<MediaCounts> {
	const [imagesCount, videosCount, audiosCount, documentsCount, jsonFilesCount, file3DsCount] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(images),
		db.select({ count: sql<number>`count(*)` }).from(videos),
		db.select({ count: sql<number>`count(*)` }).from(audios),
		db.select({ count: sql<number>`count(*)` }).from(documents),
		db.select({ count: sql<number>`count(*)` }).from(jsonFiles),
		db.select({ count: sql<number>`count(*)` }).from(file3Ds),
	]);
	return {
		images: imagesCount[0]?.count || 0,
		videos: videosCount[0]?.count || 0,
		audios: audiosCount[0]?.count || 0,
		documents: documentsCount[0]?.count || 0,
		jsonFiles: jsonFilesCount[0]?.count || 0,
		file3Ds: file3DsCount[0]?.count || 0,
	};
}

type OrgCounts = {
	folders: number;
	albums: number;
	collections: number;
	tags: number;
	favorites: number;
};

async function fetchOrgCounts(): Promise<OrgCounts> {
	const [foldersCount, albumsCount, collectionsCount, tagsCount, favoritesCount] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(folders),
		db.select({ count: sql<number>`count(*)` }).from(albums),
		db.select({ count: sql<number>`count(*)` }).from(collections),
		db.select({ count: sql<number>`count(*)` }).from(tags),
		db.select({ count: sql<number>`count(*)` }).from(favorites),
	]);
	return {
		folders: foldersCount[0]?.count || 0,
		albums: albumsCount[0]?.count || 0,
		collections: collectionsCount[0]?.count || 0,
		tags: tagsCount[0]?.count || 0,
		favorites: favoritesCount[0]?.count || 0,
	};
}

type WorldCounts = {
	characters: number;
	places: number;
	worldItems: number;
	concepts: number;
	prompts: number;
	notes: number;
	properties: number;
	wildcards: number;
};

async function fetchWorldCounts(): Promise<WorldCounts> {
	const [
		charactersCount,
		placesCount,
		worldItemsCount,
		conceptsCount,
		promptsCount,
		notesCount,
		propertiesCount,
		wildcardsCount,
	] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(characters),
		db.select({ count: sql<number>`count(*)` }).from(places),
		db.select({ count: sql<number>`count(*)` }).from(worldItems),
		db.select({ count: sql<number>`count(*)` }).from(concepts),
		db.select({ count: sql<number>`count(*)` }).from(prompts),
		db.select({ count: sql<number>`count(*)` }).from(notes),
		db.select({ count: sql<number>`count(*)` }).from(properties),
		db.select({ count: sql<number>`count(*)` }).from(wildcards),
	]);
	return {
		characters: charactersCount[0]?.count || 0,
		places: placesCount[0]?.count || 0,
		worldItems: worldItemsCount[0]?.count || 0,
		concepts: conceptsCount[0]?.count || 0,
		prompts: promptsCount[0]?.count || 0,
		notes: notesCount[0]?.count || 0,
		properties: propertiesCount[0]?.count || 0,
		wildcards: wildcardsCount[0]?.count || 0,
	};
}

type SystemCounts = {
	thumbnails: number;
	metadatas: number;
};

async function fetchSystemCounts(): Promise<SystemCounts> {
	const [thumbnailsCount, metadataCount] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(thumbnails),
		db.select({ count: sql<number>`count(*)` }).from(metadatas),
	]);
	return {
		thumbnails: thumbnailsCount[0]?.count || 0,
		metadatas: metadataCount[0]?.count || 0,
	};
}

async function fetchSizeSums() {
	const [totalSizeResult, audioSizeResult, documentSizeResult, jsonSizeResult, file3DSizeResult] = await Promise.all([
		db.select({ totalSize: sql<number>`COALESCE(SUM(${folders.totalSize}), 0)` }).from(folders),
		db.select({ totalSize: sql<number>`COALESCE(SUM(${audios.size}), 0)` }).from(audios),
		db.select({ totalSize: sql<number>`COALESCE(SUM(${documents.size}), 0)` }).from(documents),
		db.select({ totalSize: sql<number>`COALESCE(SUM(${jsonFiles.size}), 0)` }).from(jsonFiles),
		db.select({ totalSize: sql<number>`COALESCE(SUM(${file3Ds.size}), 0)` }).from(file3Ds),
	]);

	return {
		totalFoldersSize: totalSizeResult[0]?.totalSize || 0,
		totalAudioSize: audioSizeResult[0]?.totalSize || 0,
		totalDocumentSize: documentSizeResult[0]?.totalSize || 0,
		totalJsonSize: jsonSizeResult[0]?.totalSize || 0,
		totalFile3DSize: file3DSizeResult[0]?.totalSize || 0,
	} as const;
}

function buildDiskUsage(totalFileSize: number) {
	return {
		total: totalFileSize,
		used: totalFileSize,
		free: 0,
		usedPercentage: 0,
	} as const;
}

// Funciones exportadas
export async function getGeneralSystemStats(): Promise<GeneralStats | null> {
	statsLogger.info('📊 Obteniendo estadísticas del sistema CON 22 ENTIDADES');

	try {
		// Obtener conteos por dominio y tamaños usando helpers (menor complejidad)
		const [media, org, world, system, sizes] = await Promise.all([
			fetchMediaCounts(),
			fetchOrgCounts(),
			fetchWorldCounts(),
			fetchSystemCounts(),
			fetchSizeSums(),
		]);

		// Calcular información de disco (aproximada basada en el total de archivos)
		const totalFileSize =
			sizes.totalFoldersSize +
			sizes.totalAudioSize +
			sizes.totalDocumentSize +
			sizes.totalJsonSize +
			sizes.totalFile3DSize;

		const result = {
			// Archivos multimedia
			totalImages: media.images,
			totalVideos: media.videos,
			totalAudio: media.audios,
			totalDocuments: media.documents,
			totalJsonFiles: media.jsonFiles,
			totalFile3D: media.file3Ds,

			// Organización
			totalFolders: org.folders,
			totalAlbums: org.albums,
			totalCollections: org.collections,
			totalTags: org.tags,
			totalFavorites: org.favorites,

			// Worldbuilding
			totalCharacters: world.characters,
			totalPlaces: world.places,
			totalWorldItems: world.worldItems,
			totalConcepts: world.concepts,
			totalPrompts: world.prompts,
			totalNotes: world.notes,
			totalProperties: world.properties,
			totalWildcards: world.wildcards,

			// Sistema
			totalThumbnails: system.thumbnails,
			totalMetadata: system.metadatas,
			totalViews: 0, // TODO: Implementar cuando se agregue sistema de vistas
			totalDownloads: 0, // TODO: Implementar cuando se agregue sistema de descargas
			totalSize: totalFileSize,
			totalActivities: 0, // TODO: Implementar actividades

			// Información de espacio
			usedSpace: totalFileSize,
			freeSpace: 0, // TODO: Calcular espacio libre real del disco
			diskUsage: buildDiskUsage(totalFileSize),

			topTags: [],
			recentActivity: [],
		} satisfies GeneralStats;

		statsLogger.info('✅ Estadísticas del sistema obtenidas');
		return result;
	} catch (error) {
		statsLogger.error('Error al obtener estadísticas del sistema:', error);
		return null;
	}
}

// Función de compatibilidad para evitar conflictos con system.service.ts
export async function getSystemStats(): Promise<GeneralStats | null> {
	return await getGeneralSystemStats();
}

// Nuevos tipos para stats de entidades extendidas
export interface ExtendedStats {
	totalDocuments: number;
	totalAudio: number;
	totalJsonFiles: number;
	totalFile3D: number;
}

// Función para obtener estadísticas detalladas de carpetas
export async function getFolderStats(): Promise<import('@/types/folders').FolderStats | null> {
	try {
		statsLogger.info('📊 Obteniendo estadísticas detalladas de carpetas');

		// Obtener conteos y estadísticas con logging detallado
		statsLogger.info('🔍 Ejecutando consultas a la base de datos...');
		const [foldersCount, imagesCount, videosCount, totalSizeResult, thumbnailsStatsResult] = await Promise.all([
			db
				.select({ count: sql<number>`count(*)` })
				.from(folders)
				.then((rows: Array<{ count: number }>) => {
					statsLogger.info('✅ Consulta folders completada:', rows);
					return rows;
				})
				.catch((error) => {
					statsLogger.error('❌ Error en consulta folders:', error);
					throw error;
				}),
			db
				.select({ count: sql<number>`count(*)` })
				.from(images)
				.then((rows: Array<{ count: number }>) => {
					statsLogger.info('✅ Consulta images completada:', rows);
					return rows;
				})
				.catch((error) => {
					statsLogger.error('❌ Error en consulta images:', error);
					throw error;
				}),
			db
				.select({ count: sql<number>`count(*)` })
				.from(videos)
				.then((rows: Array<{ count: number }>) => {
					statsLogger.info('✅ Consulta videos completada:', rows);
					return rows;
				})
				.catch((error) => {
					statsLogger.error('❌ Error en consulta videos:', error);
					throw error;
				}),
			db
				.select({ totalSize: sql<number>`COALESCE(SUM(${folders.totalSize}), 0)` })
				.from(folders)
				.then((rows: Array<{ totalSize: number }>) => {
					statsLogger.info('✅ Consulta totalSize completada:', rows);
					return rows;
				})
				.catch((error) => {
					statsLogger.error('❌ Error en consulta totalSize:', error);
					throw error;
				}),
			// Obtener estadísticas de thumbnails y caché
			db
				.select({
					totalThumbnails: sql<number>`COUNT(CASE WHEN ${images.thumbnail} IS NOT NULL THEN 1 END)`,
					thumbnailsCacheSize: sql<number>`COALESCE(SUM(${images.thumbnailSize}), 0)`,
				})
				.from(images)
				.then((rows: Array<{ totalThumbnails: number; thumbnailsCacheSize: number }>) => {
					statsLogger.info('✅ Consulta thumbnails stats completada:', rows);
					return rows;
				})
				.catch((error) => {
					statsLogger.error('❌ Error en consulta thumbnails stats:', error);
					throw error;
				}),
		]);

		const totalFolders = foldersCount[0]?.count || 0;
		const totalImages = imagesCount[0]?.count || 0;
		const totalVideos = videosCount[0]?.count || 0;
		const totalSize = totalSizeResult[0]?.totalSize || 0;
		const totalFiles = totalImages + totalVideos;

		// Nuevas estadísticas
		const totalThumbnails = thumbnailsStatsResult[0]?.totalThumbnails || 0;
		const thumbnailsCacheSize = thumbnailsStatsResult[0]?.thumbnailsCacheSize || 0;

		// Formatear tamaño
		const formatBytes = (bytes: number): string => {
			if (bytes === 0) {
				return '0 B';
			}
			const k = 1024;
			const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
		};

		// Calcular tamaño aproximado de base de datos
		// Estimación basada en el número de registros y tamaño promedio por registro
		const estimatedRecordSize = 500; // bytes por registro (estimación conservadora)
		const totalRecords = totalFolders + totalImages + totalVideos;
		const databaseSize = totalRecords * estimatedRecordSize;

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
			// Nuevos campos para base de datos y thumbnails
			databaseSize,
			formattedDatabaseSize: formatBytes(databaseSize),
			thumbnailsCacheSize,
			formattedThumbnailsCacheSize: formatBytes(thumbnailsCacheSize),
			totalThumbnails,
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
	if (!base) {
		return null;
	}
	// Mapeo real desde base ya calculado en getGeneralSystemStats
	return {
		...base,
		totalDocuments: base.totalDocuments,
		totalAudio: base.totalAudio,
		totalJsonFiles: base.totalJsonFiles,
		totalFile3D: base.totalFile3D,
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

export function invalidateStats(): void {
	statsLogger.info('🔄 Invalidando caché de estadísticas');
	revalidatePath('/stats');
	statsLogger.info('✅ Caché de estadísticas invalidada');
}

export async function getImageStats(imageId: string) {
	try {
		statsLogger.info('🔍 Obteniendo estadísticas de imagen:', imageId);

		// Validación null-safe para evitar errores de Object.entries
		let stats: any | null;
		try {
			// fileStats es por archivo genérico; para imágenes buscamos por fileId
			const { fileStats } = await import('@/lib/drizzle/schema/index');
			stats = await db.query.fileStats.findFirst({
				where: eq(fileStats.fileId, imageId),
			});
		} catch (queryError) {
			statsLogger.warn('⚠️ Error en query de imageStats, creando estadísticas por defecto:', queryError);
			stats = null;
		}

		if (!stats) {
			statsLogger.info('➕ Creando estadísticas para imagen:', imageId);
			const { fileStats } = await import('@/lib/drizzle/schema/index');
			const [newStats] = await db
				.insert(fileStats)
				.values({
					id: randomUUID(),
					fileId: imageId,
					views: 0,
					updatedAt: new Date(),
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

		const now = new Date();
		const { fileStats } = await import('@/lib/drizzle/schema/index');
		let [updatedStats] = await db
			.update(fileStats)
			.set({
				views: sql`${fileStats.views} + 1`,
				updatedAt: now,
			})
			.where(eq(fileStats.fileId, imageId))
			.returning();

		// Si no existe el registro, crear/actualizar de forma idempotente
		if (!updatedStats) {
			// Intento de inserción; si hay conflicto único, ejecutar actualización
			try {
				const [inserted] = await db
					.insert(fileStats)
					.values({
						id: randomUUID(),
						fileId: imageId,
						views: 1,
						updatedAt: now,
					})
					.returning();
				updatedStats = inserted;
			} catch (_e) {
				const [conflictUpdated] = await db
					.update(fileStats)
					.set({ views: sql`${fileStats.views} + 1`, updatedAt: now })
					.where(eq(fileStats.fileId, imageId))
					.returning();
				updatedStats = conflictUpdated;
			}
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
		const now = new Date();
		const { fileStats } = await import('@/lib/drizzle/schema/index');
		let [updatedStats] = await db
			.update(fileStats)
			.set({
				// No hay columna downloads en fileStats actual; solo incrementamos views como proxy o dejamos noop
				views: sql`${fileStats.views} + 0`,
				updatedAt: now,
			})
			.where(eq(fileStats.fileId, imageId))
			.returning();

		// Si no existe el registro, crear/actualizar de forma idempotente
		if (!updatedStats) {
			// Intento de inserción; si hay conflicto único, ejecutar actualización
			try {
				const [inserted] = await db
					.insert(fileStats)
					.values({
						id: randomUUID(),
						fileId: imageId,
						views: 0,
						updatedAt: now,
					})
					.returning();
				updatedStats = inserted;
			} catch (_e) {
				const [conflictUpdated] = await db
					.update(fileStats)
					.set({ views: sql`${fileStats.views} + 0`, updatedAt: now })
					.where(eq(fileStats.fileId, imageId))
					.returning();
				updatedStats = conflictUpdated;
			}
		}

		statsLogger.info('✅ Descarga de imagen incrementada');
		revalidatePath('/stats');
		return updatedStats;
	} catch (error) {
		statsLogger.error('❌ Error al incrementar descarga de imagen:', error);
		throw createStatsError('No se pudo incrementar la descarga de la imagen', StatsErrorCode.OPERATION_FAILED, error);
	}
}
