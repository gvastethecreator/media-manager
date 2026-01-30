/**
 * @file Type guards y utilidades de tipos para entidades
 * @module types/entity-guards
 */

import type { AnyEntityWithStats } from '@/types/entities';
import type { AlbumWithStats } from '@/types/entities/album';
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
import { EntityStatsType } from '@/types/file-browser/entity-stats';

function hasEntityType(entity: unknown): entity is { entityType: string } {
	return typeof entity === 'object' && entity !== null && 'entityType' in entity;
}

export function isImageWithStats(entity: unknown): entity is ImageWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'image'
	);
}

export function isVideoWithStats(entity: unknown): entity is VideoWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'video'
	);
}

export function isFolderWithStats(entity: unknown): entity is FolderWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'folder'
	);
}

export function isTagWithStats(entity: unknown): entity is TagWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'tag'
	);
}

export function isPlaceWithStats(entity: unknown): entity is PlaceWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'place'
	);
}

export function isWorldItemWithStats(entity: unknown): entity is WorldItemWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'world-item'
	);
}

export function isNoteWithStats(entity: unknown): entity is NoteWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'note'
	);
}

export function isPropertyWithStats(entity: unknown): entity is PropertyWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'property'
	);
}

export function isWildcardWithStats(entity: unknown): entity is WildcardWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'wildcard'
	);
}

export function isAudioWithStats(entity: unknown): entity is AudioWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'audio'
	);
}

export function isDocumentWithStats(entity: unknown): entity is DocumentWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'document'
	);
}

export function isCollectionWithStats(entity: unknown): entity is CollectionWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'collection'
	);
}

export function isAlbumWithStats(entity: unknown): entity is AlbumWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'album'
	);
}

export function isCharacterWithStats(entity: unknown): entity is CharacterWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'character'
	);
}

export function isConceptWithStats(entity: unknown): entity is ConceptWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'concept'
	);
}

export function isPromptWithStats(entity: unknown): entity is PromptWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'prompt'
	);
}

export function isGroupWithStats(entity: unknown): entity is GroupWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'group'
	);
}

export function isUploadedImageWithStats(entity: unknown): entity is UploadedImageWithStats {
	return (
		typeof entity === 'object' &&
		entity !== null &&
		'id' in (entity as any) &&
		hasEntityType(entity) &&
		(entity as any).entityType === 'uploaded-image'
	);
}

export function getEntityStatsType(entity: AnyEntityWithStats): EntityStatsType | null {
	if (!hasEntityType(entity)) return null;
	const map: Record<string, EntityStatsType> = {
		image: EntityStatsType.IMAGE,
		video: EntityStatsType.VIDEO,
		folder: EntityStatsType.FOLDER,
		tag: EntityStatsType.TAG,
		place: EntityStatsType.PLACE,
		'world-item': EntityStatsType.WORLD_ITEM,
		note: EntityStatsType.NOTE,
		property: EntityStatsType.PROPERTY,
		wildcard: EntityStatsType.WILDCARD,
		audio: EntityStatsType.AUDIO,
		document: EntityStatsType.DOCUMENT,
		collection: EntityStatsType.COLLECTION,
		album: EntityStatsType.ALBUM,
		character: EntityStatsType.CHARACTER,
		concept: EntityStatsType.CONCEPT,
		prompt: EntityStatsType.PROMPT,
		group: EntityStatsType.GROUP,
		'uploaded-image': EntityStatsType.UPLOADED_IMAGE,
	};
	return map[(entity as any).entityType] ?? null;
}
