/**
 * @file Tipos de estadísticas de entidades para el navegador de archivos
 * @module types/file-browser/entity-stats
 * @description Define los tipos de estadísticas que se pueden mostrar para diferentes entidades
 */

/**
 * Tipos de estadísticas disponibles para entidades
 */
export type EntityStatsType =
	| 'image'
	| 'video'
	| 'audio'
	| 'document'
	| 'folder'
	| 'album'
	| 'collection'
	| 'tag'
	| 'character'
	| 'worldItem'
	| 'concept'
	| 'prompt'
	| 'note'
	| 'place'
	| 'group'
	| 'property'
	| 'wildcard'
	| 'jsonFile'
	| 'file3d'
	| 'uploadedImage';

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