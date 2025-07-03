/**
 * @file Tipos de entidad centralizados para la aplicación.
 * @module types/entities
 * @description Define uniones y tipos comunes para trabajar con diferentes entidades de forma polimórfica.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import type { Album } from '@/types/entities/album';
import type { Audio } from '@/types/entities/audio';
import type { Character } from '@/types/entities/character';
import type { Collection } from '@/types/entities/collection';
import type { Concept } from '@/types/entities/concept';
import type { Document } from '@/types/entities/document';
import type { File3D } from '@/types/entities/file3d';
import type { Folder } from '@/types/entities/folder';
import type { Group } from '@/types/entities/group';
import type { Image } from '@/types/entities/image';
import type { JsonFile } from '@/types/entities/json-file';
import type { Note } from '@/types/entities/note';
import type { Place } from '@/types/entities/place';
import type { Prompt } from '@/types/entities/prompt';
import type { Property } from '@/types/entities/property';
import type { Tag } from '@/types/entities/tag';
import type { UploadedImage } from '@/types/entities/uploaded-image';
import type { Video } from '@/types/entities/video';
import type { Wildcard } from '@/types/entities/wildcard';
import type { WorldItem } from '@/types/entities/world-item';

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
 * Es una unión de todos los tipos de entidad de Prisma, extendidos con el discriminador.
 */
export type DisplayableEntity =
	| (Image & { entityType: 'image' })
	| (Video & { entityType: 'video' })
	| (Folder & { entityType: 'folder' })
	| (Album & { entityType: 'album' })
	| (Collection & { entityType: 'collection' })
	| (Tag & { entityType: 'tag' })
	| (Character & { entityType: 'character' })
	| (WorldItem & { entityType: 'worldItem' })
	| (Concept & { entityType: 'concept' })
	| (Prompt & { entityType: 'prompt' })
	| (Note & { entityType: 'note' })
	| (Place & { entityType: 'place' })
	| (Group & { entityType: 'group' })
	| (Property & { entityType: 'property' })
	| (Wildcard & { entityType: 'wildcard' })
	| (Audio & { entityType: 'audio' })
	| (Document & { entityType: 'document' })
	| (JsonFile & { entityType: 'jsonFile' })
	| (File3D & { entityType: 'file3d' })
	| (UploadedImage & { entityType: 'uploadedImage' });

/**
 * Alias para mayor claridad en los componentes.
 */
export type AnyEntity = DisplayableEntity;
