/**
 * @file Tipos de estadísticas de entidades para el navegador de archivos
 * @module types/file-browser/entity-stats
 * @description Define los tipos de estadísticas que se pueden mostrar para diferentes entidades
 */

/**
 * Tipos de estadísticas disponibles para entidades
 */
export enum EntityStatsType {
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	FOLDER = 'folder',
	ALBUM = 'album',
	COLLECTION = 'collection',
	TAG = 'tag',
	CHARACTER = 'character',
	WORLD_ITEM = 'world-item',
	CONCEPT = 'concept',
	PROMPT = 'prompt',
	NOTE = 'note',
	PLACE = 'place',
	GROUP = 'group',
	PROPERTY = 'property',
	WILDCARD = 'wildcard',
	JSON_FILE = 'jsonFile',
	FILE_3D = 'file3d',
	UPLOADED_IMAGE = 'uploadedImage',
}

/**
 * Estadísticas base para todas las entidades
 */
export interface BaseEntityStats {
	totalItems: number;
	totalAssociations: number;
	lastUpdated: Date;
}

/**
 * Estadísticas completas de entidades
 */
export interface EntityStats extends BaseEntityStats {
	imageCount: number;
	videoCount: number;
	albumsCount: number;
	collectionCount: number;
	tagCount: number;
	characterCount: number;
	worldItemCount: number;
	conceptCount: number;
	promptCount: number;
	noteCount: number;
	placeCount: number;
	groupCount: number;
	propertyCount: number;
	wildcardCount: number;
	folderCount: number;
	audioCount: number;
	documentCount: number;
	jsonFileCount: number;
	file3dCount: number;
	uploadedImageCount: number;
}

/**
 * Interfaz genérica para entidades con estadísticas
 */
export interface EntityWithStats<T = EntityStats> {
	id: string;
	name: string;
	description?: string | null;
	createdAt: Date;
	updatedAt: Date;
	stats: T;
	entityType: EntityStatsType;
}
