/**
 * @file Tipos unificados para todos los items que se pueden mostrar en el explorador de archivos.
 * @module types/files
 * @description Define el tipo de unión `AnyFileItem` que engloba a todas las entidades
 * completas que pueden ser tratadas como "archivos" en la UI.
 */

import type { AlbumComplete } from './entities/album';
import type { CharacterComplete } from './entities/character';
import type { CollectionComplete } from './entities/collection';
import type { ConceptComplete } from './entities/concept';
import type { GroupComplete } from './entities/group';
import type { ImageComplete } from './entities/image';
import type { NoteComplete } from './entities/note';
import type { PlaceComplete } from './entities/place';
import type { PromptComplete } from './entities/prompt';
import type { PropertyComplete } from './entities/property';
import type { TagComplete } from './entities/tag';
import type { VideoComplete } from './entities/video';
import type { WildcardComplete } from './entities/wildcard';
import type { WorldItemComplete } from './entities/world-item';

/**
 * Tipo de vista para archivos
 */
export type ViewType = 'grid' | 'list' | 'masonry' | 'table';

/**
 * Representa cualquier entidad que puede ser mostrada como un item en el explorador de archivos.
 * Es una unión de todos los tipos `...Complete` de las entidades principales.
 */
export type AnyFileItem =
	| ImageComplete
	| VideoComplete
	| AlbumComplete
	| CollectionComplete
	| TagComplete
	| CharacterComplete
	| PlaceComplete
	| WorldItemComplete
	| ConceptComplete
	| PromptComplete
	| NoteComplete
	| WildcardComplete
	| PropertyComplete
	| GroupComplete;

/**
 * Etiqueta relacionada para archivos
 */
export interface RelatedTag {
	id: string;
	name: string;
	color: string;
	count?: number;
}
