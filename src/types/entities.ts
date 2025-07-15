/**
 * @file Tipos de entidad centralizados para la aplicación.
 * @module types/entities
 * @description Define uniones y tipos comunes para trabajar con diferentes entidades de forma polimórfica.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import type { AlbumWithStats } from '@/types/entities/album';
import type { AudioWithStats } from '@/types/entities/audio';
import type { CharacterWithStats } from '@/types/entities/character';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { DocumentWithStats } from '@/types/entities/document';
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
 * Alias para mayor claridad en los componentes.
 */
export type AnyEntity = DisplayableEntity;
