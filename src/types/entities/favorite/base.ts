/**
 * @file Tipos base para la entidad Favorite.
 * @module types/entities/favorite/base
 * @description Define el contrato canónico de Favorite como relación transversal scoped al perfil activo.
 */

/**
 * Enum histórico compartido por el bridge canónico y compatibilidad transitoria.
 * El perímetro canónico vigente está definido por `CANONICAL_FAVORITE_ENTITY_TYPES`.
 */
export enum FavoriteEntityType {
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	JSON_FILE = 'jsonFile',
	FILE_3D = 'file3d',
	ALBUM = 'album',
	COLLECTION = 'collection',
	FOLDER = 'folder',
	GROUP = 'group',
	TAG = 'tag',
	CHARACTER = 'character',
	PLACE = 'place',
	WORLD_ITEM = 'worldItem',
	CONCEPT = 'concept',
	PROPERTY = 'property',
	PROMPT = 'prompt',
	NOTE = 'note',
	TASK = 'task',
	WILDCARD = 'wildcard',
}

/**
 * Tipos permitidos por la API canónica de Favorite.
 * `tag`, `property` y `task` permanecen fuera del perímetro inicial documentado.
 */
export const CANONICAL_FAVORITE_ENTITY_TYPES = [
	FavoriteEntityType.IMAGE,
	FavoriteEntityType.VIDEO,
	FavoriteEntityType.AUDIO,
	FavoriteEntityType.DOCUMENT,
	FavoriteEntityType.JSON_FILE,
	FavoriteEntityType.FILE_3D,
	FavoriteEntityType.ALBUM,
	FavoriteEntityType.COLLECTION,
	FavoriteEntityType.FOLDER,
	FavoriteEntityType.GROUP,
	FavoriteEntityType.CHARACTER,
	FavoriteEntityType.PLACE,
	FavoriteEntityType.WORLD_ITEM,
	FavoriteEntityType.CONCEPT,
	FavoriteEntityType.PROMPT,
	FavoriteEntityType.NOTE,
	FavoriteEntityType.WILDCARD,
] as const satisfies readonly FavoriteEntityType[];

export type CanonicalFavoriteEntityType = (typeof CANONICAL_FAVORITE_ENTITY_TYPES)[number];

const canonicalFavoriteEntityTypeSet = new Set<FavoriteEntityType>(CANONICAL_FAVORITE_ENTITY_TYPES);

export function isCanonicalFavoriteEntityType(
	entityType: FavoriteEntityType | string | null | undefined
): entityType is CanonicalFavoriteEntityType {
	return typeof entityType === 'string' && canonicalFavoriteEntityTypeSet.has(entityType as FavoriteEntityType);
}

/**
 * Relación base persistida para Favorite.
 */
export interface FavoriteBase {
	addedAt: Date;
	entityId: string;
	entityType: FavoriteEntityType;
	id: string;
	profileId: string;
}

/**
 * Estadísticas derivadas para el read model de favoritos.
 */
export interface FavoriteStatistics {
	daysSinceAdded: number;
	entityTypeName: string;
	formattedAddedAt: string;
	isOld: boolean;
	isRecent: boolean;
}

/**
 * Alias de compatibilidad para agregados ligeros de favoritos.
 */
export type FavoriteStats = FavoriteStatistics;

/**
 * Read model enriquecido para UI y respuestas API.
 */
export interface FavoriteWithStats extends FavoriteBase {
	entityName: string;
	entityThumbnail: string | null;
	stats: FavoriteStatistics;
}

/**
 * Emojis por tipo de target favorito.
 */
export const FAVORITE_ENTITY_EMOJIS: Record<FavoriteEntityType, string> = {
	[FavoriteEntityType.IMAGE]: '🖼️',
	[FavoriteEntityType.VIDEO]: '🎥',
	[FavoriteEntityType.AUDIO]: '🎵',
	[FavoriteEntityType.DOCUMENT]: '📄',
	[FavoriteEntityType.JSON_FILE]: '🧾',
	[FavoriteEntityType.FILE_3D]: '🧊',
	[FavoriteEntityType.ALBUM]: '📸',
	[FavoriteEntityType.COLLECTION]: '📚',
	[FavoriteEntityType.FOLDER]: '📁',
	[FavoriteEntityType.GROUP]: '👥',
	[FavoriteEntityType.TAG]: '🏷️',
	[FavoriteEntityType.CHARACTER]: '👤',
	[FavoriteEntityType.PLACE]: '📍',
	[FavoriteEntityType.WORLD_ITEM]: '🌍',
	[FavoriteEntityType.CONCEPT]: '💡',
	[FavoriteEntityType.PROPERTY]: '🔍',
	[FavoriteEntityType.PROMPT]: '🤖',
	[FavoriteEntityType.NOTE]: '📝',
	[FavoriteEntityType.TASK]: '📋',
	[FavoriteEntityType.WILDCARD]: '🃏',
};

/**
 * Colores por tipo de target favorito.
 */
export const FAVORITE_ENTITY_COLORS: Record<FavoriteEntityType, string> = {
	[FavoriteEntityType.IMAGE]: 'var(--entity-image)',
	[FavoriteEntityType.VIDEO]: 'var(--entity-video)',
	[FavoriteEntityType.AUDIO]: 'var(--entity-audio)',
	[FavoriteEntityType.DOCUMENT]: 'var(--entity-document)',
	[FavoriteEntityType.JSON_FILE]: 'var(--entity-json)',
	[FavoriteEntityType.FILE_3D]: 'var(--entity-file-3d)',
	[FavoriteEntityType.ALBUM]: 'var(--entity-album)',
	[FavoriteEntityType.COLLECTION]: 'var(--entity-collection)',
	[FavoriteEntityType.FOLDER]: 'var(--entity-folder)',
	[FavoriteEntityType.GROUP]: 'var(--entity-group)',
	[FavoriteEntityType.TAG]: 'var(--entity-tag)',
	[FavoriteEntityType.CHARACTER]: 'var(--entity-character)',
	[FavoriteEntityType.PLACE]: 'var(--entity-place)',
	[FavoriteEntityType.WORLD_ITEM]: 'var(--entity-world-item)',
	[FavoriteEntityType.CONCEPT]: 'var(--entity-concept)',
	[FavoriteEntityType.PROPERTY]: 'var(--entity-property)',
	[FavoriteEntityType.PROMPT]: 'var(--entity-prompt)',
	[FavoriteEntityType.NOTE]: 'var(--entity-note)',
	[FavoriteEntityType.TASK]: 'var(--primary)',
	[FavoriteEntityType.WILDCARD]: 'var(--entity-wildcard)',
};

/**
 * Labels canónicos por tipo de target favorito.
 */
export const FAVORITE_ENTITY_DISPLAY_NAMES: Record<FavoriteEntityType, string> = {
	[FavoriteEntityType.IMAGE]: 'Imagen',
	[FavoriteEntityType.VIDEO]: 'Video',
	[FavoriteEntityType.AUDIO]: 'Audio',
	[FavoriteEntityType.DOCUMENT]: 'Documento',
	[FavoriteEntityType.JSON_FILE]: 'Archivo JSON',
	[FavoriteEntityType.FILE_3D]: 'Archivo 3D',
	[FavoriteEntityType.ALBUM]: 'Álbum',
	[FavoriteEntityType.COLLECTION]: 'Colección',
	[FavoriteEntityType.FOLDER]: 'Carpeta',
	[FavoriteEntityType.GROUP]: 'Grupo',
	[FavoriteEntityType.TAG]: 'Tag',
	[FavoriteEntityType.CHARACTER]: 'Personaje',
	[FavoriteEntityType.PLACE]: 'Lugar',
	[FavoriteEntityType.WORLD_ITEM]: 'Objeto del mundo',
	[FavoriteEntityType.CONCEPT]: 'Concepto',
	[FavoriteEntityType.PROPERTY]: 'Propiedad',
	[FavoriteEntityType.PROMPT]: 'Prompt',
	[FavoriteEntityType.NOTE]: 'Nota',
	[FavoriteEntityType.TASK]: 'Tarea',
	[FavoriteEntityType.WILDCARD]: 'Wildcard',
};

export function getFavoriteEntityDisplayName(entityType: FavoriteEntityType): string {
	return FAVORITE_ENTITY_DISPLAY_NAMES[entityType] ?? entityType;
}
