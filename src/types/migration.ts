/**
 * @file Tipos de transición para migración de tipos legacy a canónicos
 * @module types/migration
 * @description Tipos temporales para facilitar la migración gradual de FileItem/AnyEntity a WithStats
 *
 * NOTA: Este archivo es TEMPORAL y será eliminado una vez completada la migración.
 * No usar estos tipos en código nuevo, usar directamente los tipos WithStats.
 */

// Importar tipos Complete para entidades que no tienen WithStats aún
import type { AlbumComplete } from '@/types/entities/album';
import type { AudioComplete } from '@/types/entities/audio';
import type { CharacterWithStats } from '@/types/entities/character';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { DocumentComplete } from '@/types/entities/document';
// Importar tipos Complete para entidades que no tienen WithStats aún
import type { File3DComplete } from '@/types/entities/file3d';
import type { FolderWithStats } from '@/types/entities/folder';
import type { GroupComplete } from '@/types/entities/group';
import type { ImageWithStats } from '@/types/entities/image';
import type { JsonFileComplete } from '@/types/entities/json-file';
import type { NoteWithStats } from '@/types/entities/note';
import type { PlaceComplete } from '@/types/entities/place';
import type { PromptComplete } from '@/types/entities/prompt';
import type { PropertyComplete } from '@/types/entities/property';
import type { TagComplete } from '@/types/entities/tag';
import type { UploadedImageComplete } from '@/types/entities/uploaded-image';
import type { VideoWithStats } from '@/types/entities/video';
import type { WildcardComplete } from '@/types/entities/wildcard';
import type { WorldItemComplete } from '@/types/entities/world-item';

/**
 * 🔄 Tipo unión de todas las entidades con estadísticas o complete
 * Reemplaza a FileItem y AnyEntity
 *
 * NOTA: Algunas entidades aún usan Complete porque no tienen WithStats implementado
 */
export type EntityWithStats =
	| ImageWithStats
	| VideoWithStats
	| CollectionWithStats
	| CharacterWithStats
	| FolderWithStats
	| ConceptWithStats
	| NoteWithStats
	// Temporalmente usando Complete para estas entidades
	| AlbumComplete
	| AudioComplete
	| DocumentComplete
	| File3DComplete
	| GroupComplete
	| JsonFileComplete
	| PlaceComplete
	| PromptComplete
	| PropertyComplete
	| TagComplete
	| UploadedImageComplete
	| WildcardComplete
	| WorldItemComplete;

/**
 * 🏷️ Tipo de entidad (discriminador)
 */
export type EntityStatsType =
	| 'image'
	| 'video'
	| 'album'
	| 'collection'
	| 'tag'
	| 'character'
	| 'place'
	| 'worldItem'
	| 'concept'
	| 'prompt'
	| 'note'
	| 'wildcard'
	| 'property'
	| 'group'
	| 'folder'
	| 'audio'
	| 'document'
	| 'jsonFile'
	| 'file3d'
	| 'uploadedImage';

// ========== TYPE GUARDS ==========

/**
 * 🔍 Type guard para ImageWithStats
 */
export function isImageWithStats(entity: EntityWithStats): entity is ImageWithStats {
	return 'statistics' in entity && 'width' in entity && 'height' in entity && 'hash' in entity;
}

/**
 * 🔍 Type guard para VideoWithStats
 */
export function isVideoWithStats(entity: EntityWithStats): entity is VideoWithStats {
	return 'statistics' in entity && 'duration' in entity && 'fps' in entity;
}

/**
 * 🔍 Type guard para AlbumWithStats (actualmente AlbumComplete)
 */
export function isAlbumWithStats(entity: EntityWithStats): entity is AlbumComplete {
	return (
		'description' in entity &&
		'emoji' in entity &&
		!('width' in entity) && // Distinguir de Image
		!('duration' in entity) && // Distinguir de Video
		!('path' in entity)
	); // Distinguir de Folder
}

/**
 * 🔍 Type guard para FolderWithStats
 */
export function isFolderWithStats(entity: EntityWithStats): entity is FolderWithStats {
	return 'statistics' in entity && 'path' in entity && 'autoReindex' in entity;
}

/**
 * 🔍 Type guard para AudioWithStats (actualmente AudioComplete)
 */
export function isAudioWithStats(entity: EntityWithStats): entity is AudioComplete {
	return 'duration' in entity && 'bitrate' in entity && 'format' in entity && !('fps' in entity); // Distinguir de Video
}

/**
 * 🔍 Type guard para DocumentWithStats (actualmente DocumentComplete)
 */
export function isDocumentWithStats(entity: EntityWithStats): entity is DocumentComplete {
	return 'content' in entity && 'format' in entity && 'mimeType' in entity && !('bitrate' in entity); // Distinguir de Audio
}

/**
 * 🔍 Type guard para CollectionWithStats
 */
export function isCollectionWithStats(entity: EntityWithStats): entity is CollectionWithStats {
	return 'statistics' in entity && 'isPublic' in entity && !('path' in entity); // Distinguir de Folder
}

/**
 * 🔍 Type guard para TagWithStats (actualmente TagComplete)
 */
export function isTagWithStats(entity: EntityWithStats): entity is TagComplete {
	return (
		'color' in entity &&
		!('emoji' in entity) && // Tags no tienen emoji
		!('description' in entity)
	); // Tags no tienen description
}

/**
 * 🔍 Type guard para CharacterWithStats
 */
export function isCharacterWithStats(entity: EntityWithStats): entity is CharacterWithStats {
	return 'statistics' in entity && 'gender' in entity;
}

/**
 * 🔍 Type guard para ConceptWithStats
 */
export function isConceptWithStats(entity: EntityWithStats): entity is ConceptWithStats {
	return 'statistics' in entity && 'conceptType' in entity;
}

/**
 * 🔍 Type guard para PlaceWithStats (actualmente PlaceComplete)
 */
export function isPlaceWithStats(entity: EntityWithStats): entity is PlaceComplete {
	return 'location' in entity && 'coordinates' in entity;
}

/**
 * 🔍 Type guard para WorldItemWithStats (actualmente WorldItemComplete)
 */
export function isWorldItemWithStats(entity: EntityWithStats): entity is WorldItemComplete {
	return 'worldId' in entity && 'itemType' in entity;
}

/**
 * 🔍 Type guard para PromptWithStats (actualmente PromptComplete)
 */
export function isPromptWithStats(entity: EntityWithStats): entity is PromptComplete {
	return 'promptText' in entity && 'category' in entity;
}

/**
 * 🔍 Type guard para WildcardWithStats (actualmente WildcardComplete)
 */
export function isWildcardWithStats(entity: EntityWithStats): entity is WildcardComplete {
	return 'trigger' in entity && 'values' in entity;
}

/**
 * 🔍 Type guard para PropertyWithStats (actualmente PropertyComplete)
 */
export function isPropertyWithStats(entity: EntityWithStats): entity is PropertyComplete {
	return 'propertyType' in entity && 'value' in entity && !('values' in entity); // Distinguir de Wildcard
}

/**
 * 🔍 Type guard para GroupWithStats (actualmente GroupComplete)
 */
export function isGroupWithStats(entity: EntityWithStats): entity is GroupComplete {
	return 'sortBy' in entity && 'filters' in entity;
}

/**
 * 🔍 Type guard para NoteWithStats
 */
export function isNoteWithStats(entity: EntityWithStats): entity is NoteWithStats {
	return 'content' in entity && 'format' in entity && 'mimeType' in entity && !('bitrate' in entity); // Distinguir de Audio
}

// ========== UTILIDADES DE CONVERSIÓN ==========

/**
 * 🔄 Obtiene el tipo de entidad basándose en type guards
 */
export function getEntityStatsType(entity: EntityWithStats): EntityStatsType {
	if (isImageWithStats(entity)) return 'image';
	if (isVideoWithStats(entity)) return 'video';
	if (isAlbumWithStats(entity)) return 'album';
	if (isCollectionWithStats(entity)) return 'collection';
	if (isTagWithStats(entity)) return 'tag';
	if (isCharacterWithStats(entity)) return 'character';
	if (isFolderWithStats(entity)) return 'folder';
	if (isAudioWithStats(entity)) return 'audio';
	if (isDocumentWithStats(entity)) return 'document';
	if (isConceptWithStats(entity)) return 'concept';
	if (isPlaceWithStats(entity)) return 'place';
	if (isWorldItemWithStats(entity)) return 'worldItem';
	if (isPromptWithStats(entity)) return 'prompt';
	if (isWildcardWithStats(entity)) return 'wildcard';
	if (isPropertyWithStats(entity)) return 'property';
	if (isGroupWithStats(entity)) return 'group';
	if (isNoteWithStats(entity)) return 'note';

	// Fallback para tipos no implementados
	console.warn('Tipo de entidad no reconocido:', entity);
	return 'image'; // Default seguro
}

/**
 * 🔄 Convierte un array de FileItem legacy a EntityWithStats
 * NOTA: Esta función requiere transformadores específicos por tipo
 */
export async function migrateFileItemsToEntityWithStats(fileItems: any[]): Promise<EntityWithStats[]> {
	// TODO: Implementar conversión usando transformadores
	console.warn('migrateFileItemsToEntityWithStats no implementado completamente');
	return [];
}

/**
 * 🔍 Helper para verificar si una entidad tiene estadísticas
 */
export function hasStatistics(entity: any): boolean {
	return 'statistics' in entity || 'stats' in entity;
}

/**
 * 📊 Helper para obtener estadísticas de cualquier entidad
 */
export function getEntityStatistics(entity: EntityWithStats): any {
	if ('statistics' in entity) return entity.statistics;
	if ('stats' in entity) return entity.stats;
	return null;
}
