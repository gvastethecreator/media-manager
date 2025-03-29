/**
 * @file Tipos de datos para la entidad Album
 * @module types/entities/album/types
 */

import type { Character } from '../character/character-types';
import type { Collection } from '../collection/collection-types';
import type { Concept } from '../concept/concept-types';
import type { Group } from '../group/group-types';
import type { Image } from '../image/index';
import type { Note } from '../note/note-types';
import type { Place } from '../place/place-types';
import type { Prompt } from '../prompt/prompt-types';
import type { Property } from '../property/property-types';
import type { Tag } from '../tag/tag-types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/wildcard-types';
import type { WorldItem } from '../world-item/world-item-types';
import type { AlbumPrivacyLevel, AlbumType } from './enums';

/**
 * Interfaz base para álbum
 */
export interface AlbumBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	sortBy: string;
	filters: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Metadatos del álbum
 */
export interface AlbumMetadata {
	itemCount: number;
	imageCount?: number;
	videoCount?: number;
	totalSize?: number; // tamaño en bytes
	dateRange?: {
		from: Date | string | null;
		to: Date | string | null;
	};
	locations?: Array<{
		name: string;
		latitude: number;
		longitude: number;
		count: number;
	}>;
	customFields?: Record<string, any>;
	coverImageUrl?: string;
	thumbnailUrls?: string[];
	lastModified?: Date | string;
}

/**
 * Elemento de álbum (para relaciones)
 */
export interface AlbumItem {
	id: string;
	albumId: string;
	itemId: string;
	itemType: 'image' | 'video';
	sortOrder: number;
	addedAt: Date | string;
	coverForAlbum?: boolean;
}

/**
 * Configuración de visualización del álbum
 */
export interface AlbumViewConfig {
	theme?: string;
	layout?: string;
	showDates?: boolean;
	showLocations?: boolean;
	showDescriptions?: boolean;
	thumbnailSize?: 'small' | 'medium' | 'large';
	enableTransitions?: boolean;
	coverImageFit?: 'contain' | 'cover';
	backgroundColor?: string;
	customCss?: string;
}

/**
 * Datos para crear un álbum
 */
export interface CreateAlbumData {
	name: string;
	description?: string;
	coverImageId?: string;
	type?: AlbumType;
	parentId?: string | null;
	privacyLevel?: AlbumPrivacyLevel;
	items?: Array<{
		itemId: string;
		itemType: 'image' | 'video';
	}>;
	viewConfig?: Partial<AlbumViewConfig>;
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
}

/**
 * Datos para actualizar un álbum
 */
export interface UpdateAlbumData {
	name?: string;
	description?: string;
	coverImageId?: string | null;
	type?: AlbumType;
	parentId?: string | null;
	privacyLevel?: AlbumPrivacyLevel;
	isArchived?: boolean;
	viewConfig?: Partial<AlbumViewConfig>;
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
}

/**
 * Datos para añadir o actualizar elementos de álbum
 */
export interface UpdateAlbumItemsData {
	items: Array<{
		itemId: string;
		itemType: 'image' | 'video';
		sortOrder?: number;
		coverForAlbum?: boolean;
	}>;
	replaceExisting?: boolean;
}

/**
 * Interfaz extendida para álbum con todas las propiedades
 */
export interface Album extends AlbumBase {
	// Relaciones con contenido
	images?: Image[];
	videos?: Video[];

	// Relaciones con entidades principales
	collections?: Collection[];
	tags?: Tag[];
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	prompts?: Prompt[];
	notes?: Note[];
	wildcards?: Wildcard[];
	properties?: Property[];
	groups?: Group[];

	// Metadatos
	metadata?: AlbumMetadata;

	// Configuración
	viewConfig?: AlbumViewConfig;

	// Para UI
	isExpanded?: boolean;
	isSelected?: boolean;

	// Contadores
	_count?: {
		images?: number;
		videos?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}
