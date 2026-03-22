/**
 * @file Tipos unificados para todos los items que se pueden mostrar en el explorador de archivos.
 * @module types/files
 * @description Define el tipo de unión `AnyFileItem` que engloba a todas las entidades
 * completas que pueden ser tratadas como "archivos" en la UI.
 */

import type { AlbumWithStats } from './entities/album';
import type { CharacterWithStats } from './entities/character';
import type { CollectionWithStats } from './entities/collection';
import type { ConceptWithStats } from './entities/concept';
import type { GroupWithStats } from './entities/group';
import type { ImageWithStats } from './entities/image';
import type { NoteWithStats } from './entities/note';
import type { PlaceWithStats } from './entities/place';
import type { PromptWithStats } from './entities/prompt';
import type { PropertyWithStats } from './entities/property';
import type { TagWithStats } from './entities/tag/types';
import type { UploadedImageWithStats } from './entities/uploaded-image';
import type { VideoWithStats } from './entities/video';
import type { WildcardWithStats } from './entities/wildcard';
import type { WorldItemWithStats } from './entities/world-item';

/**
 * Tipo de vista para archivos
 */
export type ViewType = 'grid' | 'list' | 'masonry' | 'cards';

/**
 * Tipos de archivo
 */
export const FileType = {
	IMAGE: 'image',
	VIDEO: 'video',
	AUDIO: 'audio',
	DOCUMENT: 'document',
	ARCHIVE: 'archive',
	DIRECTORY: 'directory',
	FILE: 'file',
	OTHER: 'other',
} as const;

export type FileType = (typeof FileType)[keyof typeof FileType];

/**
 * Estados de procesamiento de archivos
 */
export const FileProcessingStatus = {
	PENDING: 'pending',
	PROCESSING: 'processing',
	COMPLETED: 'completed',
	FAILED: 'failed',
	CANCELLED: 'cancelled',
} as const;

export type FileProcessingStatus = (typeof FileProcessingStatus)[keyof typeof FileProcessingStatus];

/**
 * Propiedades base comunes que todos los FileItem deben tener para funcionar en los componentes
 */
export interface FileItemBase {
	createdAt: Date;
	entityType: string;
	id: string;
	isFavorite?: boolean;
	name: string;
	size: number;
	thumbnailUrl?: string;
	updatedAt: Date;
}

/**
 * Representa cualquier entidad que puede ser mostrada como un item en el explorador de archivos.
 * Es una unión de todos los tipos `...WithStats` de las entidades principales.
 * Compatible con AnyEntityWithStats de migration.ts
 */
export type FileItem =
	| ImageWithStats
	| VideoWithStats
	| AlbumWithStats
	| CollectionWithStats
	| TagWithStats
	| CharacterWithStats
	| PlaceWithStats
	| WorldItemWithStats
	| ConceptWithStats
	| PromptWithStats
	| NoteWithStats
	| WildcardWithStats
	| PropertyWithStats
	| GroupWithStats
	| UploadedImageWithStats;

/**
 * Etiqueta relacionada para archivos
 */
export interface RelatedTag {
	color: string;
	count?: number;
	id: string;
	name: string;
}
