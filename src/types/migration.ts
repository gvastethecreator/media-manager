/**
 * @file Type guards y tipos de migración para EntityWithStats
 * @module types/migration
 * @description Funciones utilitarias para type checking y migración de tipos legacy a EntityWithStats
 */

import type { AlbumWithStats } from '@/types/entities/album';
// Imports para los tipos re-exportados
// Re-exportar tipos reales en lugar de definiciones temporales
import type { AudioWithStats } from '@/types/entities/audio';
import type { CharacterWithStats } from '@/types/entities/character';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { DocumentWithStats } from '@/types/entities/document';
import type { EntityWithStats } from '@/types/entities/entity.types';
import type { FolderWithStats } from '@/types/entities/folder';
import type { GroupWithStats } from '@/types/entities/group';
import type { ImageWithStats } from '@/types/entities/image';
import type { NoteWithStats } from '@/types/entities/note';
import type { PlaceWithStats } from '@/types/entities/place';
import type { PromptWithStats } from '@/types/entities/prompt';
import type { PropertyWithStats } from '@/types/entities/property';
import type { TagWithStats } from '@/types/entities/tag';
import type { UploadedImageWithStats } from '@/types/entities/uploaded-image';
import type { VideoWithStats } from '@/types/entities/video';
import type { WildcardWithStats } from '@/types/entities/wildcard';
import type { WorldItemWithStats } from '@/types/entities/world-item';

// Tipo unión de todas las entidades con estadísticas que realmente existen
export type AnyEntityWithStats =
	| ImageWithStats
	| VideoWithStats
	| FolderWithStats
	| TagWithStats
	| PlaceWithStats
	| WorldItemWithStats
	| NoteWithStats
	| PropertyWithStats
	| WildcardWithStats
	| CharacterWithStats
	| ConceptWithStats
	| PromptWithStats
	| GroupWithStats
	| AudioWithStats
	| DocumentWithStats
	| CollectionWithStats
	| AlbumWithStats
	| UploadedImageWithStats;

// Export del tipo principal para compatibilidad
export type { EntityWithStats };

// Enum para tipos de entidades
export enum EntityStatsType {
	IMAGE = 'image',
	VIDEO = 'video',
	FOLDER = 'folder',
	TAG = 'tag',
	PLACE = 'place',
	WORLD_ITEM = 'world-item',
	NOTE = 'note',
	PROPERTY = 'property',
	WILDCARD = 'wildcard',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	COLLECTION = 'collection',
	ALBUM = 'album',
	CHARACTER = 'character',
	CONCEPT = 'concept',
	PROMPT = 'prompt',
	GROUP = 'group',
	UPLOADED_IMAGE = 'uploaded-image',
}

// Función helper para verificar si es una entidad con el campo entityType
function hasEntityType(entity: unknown): entity is { entityType: string } {
	return typeof entity === 'object' && entity !== null && 'entityType' in entity;
}

// Type guards para cada tipo de entidad
export function isImageWithStats(entity: unknown): entity is ImageWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'image'
	);
}

export function isVideoWithStats(entity: unknown): entity is VideoWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'video'
	);
}

export function isFolderWithStats(entity: unknown): entity is FolderWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'folder'
	);
}

export function isTagWithStats(entity: unknown): entity is TagWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'tag'
	);
}

export function isPlaceWithStats(entity: unknown): entity is PlaceWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'place'
	);
}

export function isWorldItemWithStats(entity: unknown): entity is WorldItemWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'world-item'
	);
}

export function isNoteWithStats(entity: unknown): entity is NoteWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'note'
	);
}

export function isPropertyWithStats(entity: unknown): entity is PropertyWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'property'
	);
}

export function isWildcardWithStats(entity: unknown): entity is WildcardWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'wildcard'
	);
}

// Type guards para entidades con tipos temporales
export function isAudioWithStats(entity: unknown): entity is AudioWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'audio'
	);
}

export function isDocumentWithStats(entity: unknown): entity is DocumentWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'document'
	);
}

export function isCollectionWithStats(entity: unknown): entity is CollectionWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'collection'
	);
}

export function isAlbumWithStats(entity: unknown): entity is AlbumWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'album'
	);
}

export function isCharacterWithStats(entity: unknown): entity is CharacterWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'character'
	);
}

export function isConceptWithStats(entity: unknown): entity is ConceptWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'concept'
	);
}

export function isPromptWithStats(entity: unknown): entity is PromptWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'prompt'
	);
}

export function isGroupWithStats(entity: unknown): entity is GroupWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'group'
	);
}

export function isUploadedImageWithStats(entity: unknown): entity is UploadedImageWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in entity &&
		hasEntityType(entity) &&
		entity.entityType === 'uploaded-image'
	);
}

// Función helper para obtener el tipo de estadísticas de una entidad
export function getEntityStatsType(entity: AnyEntityWithStats): EntityStatsType | null {
	if (isImageWithStats(entity)) return EntityStatsType.IMAGE;
	if (isVideoWithStats(entity)) return EntityStatsType.VIDEO;
	if (isFolderWithStats(entity)) return EntityStatsType.FOLDER;
	if (isTagWithStats(entity)) return EntityStatsType.TAG;
	if (isPlaceWithStats(entity)) return EntityStatsType.PLACE;
	if (isWorldItemWithStats(entity)) return EntityStatsType.WORLD_ITEM;
	if (isNoteWithStats(entity)) return EntityStatsType.NOTE;
	if (isPropertyWithStats(entity)) return EntityStatsType.PROPERTY;
	if (isWildcardWithStats(entity)) return EntityStatsType.WILDCARD;
	if (isAudioWithStats(entity)) return EntityStatsType.AUDIO;
	if (isDocumentWithStats(entity)) return EntityStatsType.DOCUMENT;
	if (isCollectionWithStats(entity)) return EntityStatsType.COLLECTION;
	if (isAlbumWithStats(entity)) return EntityStatsType.ALBUM;
	if (isCharacterWithStats(entity)) return EntityStatsType.CHARACTER;
	if (isConceptWithStats(entity)) return EntityStatsType.CONCEPT;
	if (isPromptWithStats(entity)) return EntityStatsType.PROMPT;
	if (isGroupWithStats(entity)) return EntityStatsType.GROUP;
	if (isUploadedImageWithStats(entity)) return EntityStatsType.UPLOADED_IMAGE;
	return null;
}

// Función helper para obtener estadísticas de una entidad
export function getEntityStatistics(entity: AnyEntityWithStats): unknown {
	return {
		fileCount: 0,
		size: 0,
		lastModified: new Date(),
		entityType: entity.entityType || 'unknown',
	};
}
