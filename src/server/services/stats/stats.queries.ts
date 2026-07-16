/**
 * Funciones helper para queries SQL de estadísticas
 * Agrupa queries relacionadas por dominio (media, org, world, system)
 */

import { sql } from 'drizzle-orm';
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
import { visibleAssetLifecycleCondition } from '@/services/media-core/canonical-media-persistence';
import type { MediaCounts, OrgCounts, SizeSums, SystemCounts, WorldCounts } from './stats.types';

/**
 * Obtiene conteos de archivos multimedia (images, videos, audios, documents, jsonFiles, file3Ds)
 */
export async function fetchMediaCounts(): Promise<MediaCounts> {
	const [imagesCount, videosCount, audiosCount, documentsCount, jsonFilesCount, file3DsCount] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)` })
			.from(images)
			.where(visibleAssetLifecycleCondition(images.assetId)),
		db
			.select({ count: sql<number>`count(*)` })
			.from(videos)
			.where(visibleAssetLifecycleCondition(videos.assetId)),
		db
			.select({ count: sql<number>`count(*)` })
			.from(audios)
			.where(visibleAssetLifecycleCondition(audios.assetId)),
		db
			.select({ count: sql<number>`count(*)` })
			.from(documents)
			.where(visibleAssetLifecycleCondition(documents.assetId)),
		db
			.select({ count: sql<number>`count(*)` })
			.from(jsonFiles)
			.where(visibleAssetLifecycleCondition(jsonFiles.assetId)),
		db
			.select({ count: sql<number>`count(*)` })
			.from(file3Ds)
			.where(visibleAssetLifecycleCondition(file3Ds.assetId)),
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

/**
 * Obtiene conteos de entidades organizacionales (folders, albums, collections, tags, favorites)
 */
export async function fetchOrgCounts(): Promise<OrgCounts> {
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

/**
 * Obtiene conteos de entidades worldbuilding (characters, places, worldItems, concepts, prompts, notes, properties, wildcards)
 */
export async function fetchWorldCounts(): Promise<WorldCounts> {
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

/**
 * Obtiene conteos del sistema (thumbnails, metadatas)
 */
export async function fetchSystemCounts(): Promise<SystemCounts> {
	const [thumbnailsCount, metadatasCount] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(thumbnails),
		db.select({ count: sql<number>`count(*)` }).from(metadatas),
	]);
	return {
		thumbnails: thumbnailsCount[0]?.count || 0,
		metadatas: metadatasCount[0]?.count || 0,
	};
}

/**
 * Obtiene sumas de tamaños por tipo de archivo
 * NOTA: folders no tiene columna size en el esquema actual, solo se calculan archivos
 */
export async function fetchSizeSums(): Promise<SizeSums> {
	const [audiosSize, documentsSize, jsonFilesSize, file3DsSize] = await Promise.all([
		db
			.select({ totalSize: sql<number>`COALESCE(SUM(${audios.size}), 0)` })
			.from(audios)
			.where(visibleAssetLifecycleCondition(audios.assetId)),
		db
			.select({ totalSize: sql<number>`COALESCE(SUM(${documents.size}), 0)` })
			.from(documents)
			.where(visibleAssetLifecycleCondition(documents.assetId)),
		db
			.select({ totalSize: sql<number>`COALESCE(SUM(${jsonFiles.size}), 0)` })
			.from(jsonFiles)
			.where(visibleAssetLifecycleCondition(jsonFiles.assetId)),
		db
			.select({ totalSize: sql<number>`COALESCE(SUM(${file3Ds.size}), 0)` })
			.from(file3Ds)
			.where(visibleAssetLifecycleCondition(file3Ds.assetId)),
	]);
	return {
		totalFoldersSize: 0, // folders no tiene size
		totalAudioSize: audiosSize[0]?.totalSize || 0,
		totalDocumentSize: documentsSize[0]?.totalSize || 0,
		totalJsonSize: jsonFilesSize[0]?.totalSize || 0,
		totalFile3DSize: file3DsSize[0]?.totalSize || 0,
	};
}

/**
 * Construye objeto de uso de disco
 * (Aproximación básica - TODO: calcular espacio libre real del disco)
 */
export function buildDiskUsage(totalFileSize: number) {
	return {
		total: totalFileSize,
		used: totalFileSize,
		free: 0,
		usedPercentage: 0,
	} as const;
}

/**
 * Formatea bytes a string legible (B, KB, MB, GB, TB)
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) {
		return '0 B';
	}
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}
