/**
 * @file Tipos de entidad centralizados para la aplicación.
 * @module types/entities
 * @description Define uniones y tipos comunes para trabajar con diferentes entidades de forma polimórfica.
 */

import type {
	Album,
	Character,
	Collection,
	Concept,
	Folder,
	Group,
	Image,
	Note,
	Place,
	Prompt,
	Property,
	Tag,
	Video,
	Wildcard,
	WorldItem,
} from '@prisma/client';

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
	| 'folder';

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
	| (Wildcard & { entityType: 'wildcard' });

/**
 * Alias para mayor claridad en los componentes.
 */
export type AnyEntity = DisplayableEntity;
