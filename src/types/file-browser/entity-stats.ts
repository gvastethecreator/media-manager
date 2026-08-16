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
	lastUpdated: Date;
	totalAssociations: number;
	totalItems: number;
}

/**
 * Estadísticas completas de entidades
 */
export interface EntityStats extends BaseEntityStats {
	albumsCount: number;
	audioCount: number;
	characterCount: number;
	collectionCount: number;
	conceptCount: number;
	documentCount: number;
	file3dCount: number;
	folderCount: number;
	groupCount: number;
	imageCount: number;
	jsonFileCount: number;
	noteCount: number;
	placeCount: number;
	promptCount: number;
	propertyCount: number;
	tagCount: number;
	uploadedImageCount: number;
	videoCount: number;
	wildcardCount: number;
	worldItemCount: number;
}

/**
 * Interfaz genérica para entidades con estadísticas
 */
export interface EntityWithStats<T = EntityStats> {
	createdAt: Date;
	description?: string | null;
	entityType: EntityStatsType;
	id: string;
	name: string;
	stats: T;
	updatedAt: Date;
}
