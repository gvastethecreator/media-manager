/**
 * @file Type guards y tipos de migración para EntityWithStats
 * @module types/migration
 * @description Funciones utilitarias para type checking y migración de tipos legacy a EntityWithStats
 */

// Usar el tipo centralizado DisplayableEntity como AnyEntityWithStats para evitar divergencias
import type { DisplayableEntity as AnyEntityWithStats } from '@/types/entities';
import type { AlbumWithStats } from '@/types/entities/album';
// Imports para los tipos re-exportados
// Re-exportar tipos reales en lugar de definiciones temporales
import type { AudioWithStats } from '@/types/entities/audio';
import type { CharacterWithStats } from '@/types/entities/character';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { DocumentWithStats } from '@/types/entities/document';
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

// Re-exportar el alias para mantener compatibilidad con los imports existentes en componentes
export type { DisplayableEntity as AnyEntityWithStats } from '@/types/entities';
export type { AlbumWithStats } from './entities/album';
export type { AudioWithStats } from './entities/audio';
export type { CharacterWithStats } from './entities/character';
export type { CollectionWithStats } from './entities/collection';
export type { ConceptWithStats } from './entities/concept';
export type { DocumentWithStats } from './entities/document';
// Export del tipo principal para compatibilidad
export type { EntityBase, EntityStats, EntityWithStats } from './entities/entity.types';
export type { FolderWithStats } from './entities/folder';
export type { GroupWithStats } from './entities/group';
// Re-exportar para compatibilidad
// Solo se debe usar AnyEntityWithStats en los componentes de UI y transformadores
export type { ImageWithStats } from './entities/image';
export type { NoteWithStats } from './entities/note';
export type { PlaceWithStats } from './entities/place';
export type { PromptWithStats } from './entities/prompt';
export type { PropertyWithStats } from './entities/property';
export type { TagWithStats } from './entities/tag';
export type { UploadedImageWithStats } from './entities/uploaded-image';
export type { VideoWithStats } from './entities/video';
export type { WildcardWithStats } from './entities/wildcard';
export type { WorldItemWithStats } from './entities/world-item';

// Re-exportar EntityStatsType directamente desde su origen para evitar noExportedImports
export { EntityStatsType } from './file-browser/entity-stats';

import type { EntityStatsType as EntityStatsTypeType } from './file-browser/entity-stats';
import { EntityStatsType as EntityStatsTypeLocal } from './file-browser/entity-stats';

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
export function getEntityStatsType(entity: AnyEntityWithStats): EntityStatsTypeType | null {
	if (!hasEntityType(entity)) {
		return null;
	}
	const map: Record<string, EntityStatsTypeType> = {
		image: EntityStatsTypeLocal.IMAGE,
		video: EntityStatsTypeLocal.VIDEO,
		folder: EntityStatsTypeLocal.FOLDER,
		tag: EntityStatsTypeLocal.TAG,
		place: EntityStatsTypeLocal.PLACE,
		'world-item': EntityStatsTypeLocal.WORLD_ITEM,
		note: EntityStatsTypeLocal.NOTE,
		property: EntityStatsTypeLocal.PROPERTY,
		wildcard: EntityStatsTypeLocal.WILDCARD,
		audio: EntityStatsTypeLocal.AUDIO,
		document: EntityStatsTypeLocal.DOCUMENT,
		collection: EntityStatsTypeLocal.COLLECTION,
		album: EntityStatsTypeLocal.ALBUM,
		character: EntityStatsTypeLocal.CHARACTER,
		concept: EntityStatsTypeLocal.CONCEPT,
		prompt: EntityStatsTypeLocal.PROMPT,
		group: EntityStatsTypeLocal.GROUP,
		'uploaded-image': EntityStatsTypeLocal.UPLOADED_IMAGE,
	};
	return map[entity.entityType] ?? null;
}

// Función helper para obtener estadísticas de una entidad
export function getEntityStatistics(entity: AnyEntityWithStats): unknown {
	return {
		fileCount: 0,
		size: 0,
		lastModified: new Date(),
		entityType: (entity as any).entityType || 'unknown',
	};
}
