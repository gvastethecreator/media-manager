/**
 * @file Tipos de entidad centralizados para la aplicación.
 * @module types/entities
 * @description Define uniones y tipos comunes para trabajar con diferentes entidades de forma polimórfica.
 * Estos tipos son la base del sistema de entidades con estadísticas (EntityWithStats).
 * @updated 2025-07-28 - MIGRADO A DRIZZLE ORM Y UNIFICADO CON ESTADÍSTICAS
 */


import type { AlbumWithStats } from '@/types/entities/album';
import type { AudioWithStats } from '@/types/entities/audio';
import type { CharacterWithStats } from '@/types/entities/character';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { DocumentWithStats } from '@/types/entities/document/base';
import type { File3DWithStats } from '@/types/entities/file3d';
import type { FolderWithStats } from '@/types/entities/folder';
import type { GroupWithStats } from '@/types/entities/group';
import type { ImageWithStats } from '@/types/entities/image';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import type { NoteWithStats } from '@/types/entities/note';
import type { PlaceWithStats } from '@/types/entities/place';
import type { PromptWithStats } from '@/types/entities/prompt';
import type { PropertyWithStats } from '@/types/entities/property';
import type { TagWithStats } from '@/types/entities/tag';
import type { UploadedImageWithStats } from '@/types/entities/uploaded-image';
import type { VideoWithStats } from '@/types/entities/video';
import type { WildcardWithStats } from '@/types/entities/wildcard';
import type { WorldItemWithStats } from '@/types/entities/world-item';

/**
 * Nombres de todas las entidades principales que se pueden mostrar en la UI.
 */
export type EntityType =
	| 'image'
	| 'video'
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
	| 'folder'
	| 'audio'
	| 'document'
	| 'jsonFile'
	| 'file3d'
	| 'uploadedImage';

/**
 * Propiedad para discriminar entre tipos de entidad en el cliente.
 * Se añadirá a cada entidad antes de pasarla a los componentes de la UI.
 */
export interface EntityDiscriminator {
	entityType: EntityType;
}

/**
 * Interfaz base para entidades que pueden ser mostradas en la UI.
 */
export interface DisplayableEntityBase {
	id: string;
	name: string;
	description?: string | null;
	createdAt: Date;
	updatedAt: Date;
	entityType: EntityType;
}

/**
 * Representa cualquier entidad de la aplicación que pueda ser mostrada en una vista.
 */
export type DisplayableEntity =
	| (ImageWithStats & { entityType: 'image' })
	| (VideoWithStats & { entityType: 'video' })
	| (FolderWithStats & { entityType: 'folder' })
	| (AlbumWithStats & { entityType: 'album' })
	| (CollectionWithStats & { entityType: 'collection' })
	| (TagWithStats & { entityType: 'tag' })
	| (CharacterWithStats & { entityType: 'character' })
	| (WorldItemWithStats & { entityType: 'worldItem' })
	| (ConceptWithStats & { entityType: 'concept' })
	| (PromptWithStats & { entityType: 'prompt' })
	| (NoteWithStats & { entityType: 'note' })
	| (PlaceWithStats & { entityType: 'place' })
	| (GroupWithStats & { entityType: 'group' })
	| (PropertyWithStats & { entityType: 'property' })
	| (WildcardWithStats & { entityType: 'wildcard' })
	| (AudioWithStats & { entityType: 'audio' })
	| (DocumentWithStats & { entityType: 'document' })
	| (JsonFileWithStats & { entityType: 'jsonFile' })
	| (File3DWithStats & { entityType: 'file3d' })
	| (UploadedImageWithStats & { entityType: 'uploadedImage' });

/**
 * 🎨 Interfaz extendida para mostrar entidades en la UI.
 * @description Esta interfaz asegura que todas las entidades tengan
 * las propiedades necesarias para ser mostradas en la interfaz.
 */
export interface DisplayableEntityExtended extends DisplayableEntityBase {
	// Campos específicos de UI
	path?: string;
	url?: string;
	thumbnailUrl?: string;
	fullUrl?: string;

	// Estado
	isFavorite?: boolean;
	isHidden?: boolean;
	isPublic?: boolean;

	// Relaciones
	folderId?: string;
	parentId?: string;

	// Campos extendidos opcionales
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	shortcut?: string | null;
	category?: string | null;
	metadata?: string | null;
}

/**
 * 🔄 Representa cualquier entidad que pueda ser mostrada.
 * Esta es la interfaz que los componentes deben usar.
 */
export type AnyEntity = DisplayableEntity;

/**
 * 📊 Re-exportar el tipo principal para consistencia en la aplicación.
 * @description Este es el tipo que debe usarse en toda la aplicación cuando
 * se necesite referirse a una entidad con estadísticas.
 */
export type AnyEntityWithStats = DisplayableEntity;
