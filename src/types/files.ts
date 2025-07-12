/**
 * @file Tipos unificados para todos los items que se pueden mostrar en el explorador de archivos.
 * @module types/files
 * @description Define el tipo de unión `AnyFileItem` que engloba a todas las entidades
 * completas que pueden ser tratadas como "archivos" en la UI.
 */

import type { AlbumComplete } from './entities/album';
import type { CharacterWithStats } from './entities/character';
import type { CollectionWithStats } from './entities/collection';
import type { ConceptWithStats } from './entities/concept';
import type { GroupWithStats } from './entities/group';
import type { ImageComplete } from './entities/image';
import type { NoteComplete } from './entities/note';
import type { PlaceComplete } from './entities/place';
import type { PromptComplete } from './entities/prompt';
import type { PropertyComplete } from './entities/property';
import type { TagWithStats } from './entities/tag/types';
import type { VideoWithStats } from './entities/video';
import type { WildcardWithStats } from './entities/wildcard';
import type { WorldItemWithStats } from './entities/world-item';

/**
 * Tipo de vista para archivos
 */
export type ViewType = 'grid' | 'list' | 'masonry' | 'table';

/**
 * Tipos de archivo
 */
export enum FileType {
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	ARCHIVE = 'archive',
	DIRECTORY = 'directory',
	FILE = 'file',
	OTHER = 'other',
}

/**
 * Estados de procesamiento de archivos
 */
export enum FileProcessingStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
}

/**
 * Representa cualquier entidad que puede ser mostrada como un item en el explorador de archivos.
 * Es una unión de todos los tipos `...Complete` de las entidades principales.
 */
export type FileItem =
	| ImageComplete
	| VideoWithStats
	| AlbumComplete
	| CollectionWithStats
	| TagWithStats
	| CharacterWithStats
	| PlaceComplete
	| WorldItemWithStats
	| ConceptWithStats
	| PromptComplete
	| NoteComplete
	| WildcardWithStats
	| PropertyComplete
	| GroupWithStats;

/**
 * Etiqueta relacionada para archivos
 */
export interface RelatedTag {
	id: string;
	name: string;
	color: string;
	count?: number;
}
