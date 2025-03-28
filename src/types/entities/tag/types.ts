/**
 * @file Tipos para la entidad Tag
 * @module types/entities/tag/types
 */
import type { Image } from '../image';
import type { TagRarity } from './enums';

/**
 * Interfaz base para etiquetas
 */
export interface TagBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	featuredImage?: string | null;
	isFavorite: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
	category?: string | null;
	rarity?: TagRarity | string | null;
	texture?: string | null;
}

/**
 * Interfaz extendida con relaciones y propiedades de UI
 */
export interface Tag extends TagBase {
	// Relaciones
	images?: Image[];

	// Contadores
	_count?: {
		images?: number;
	};

	// Propiedades de UI
	isSelected?: boolean;
	isExpanded?: boolean;
	isEditing?: boolean;
	isHighlighted?: boolean;
}

/**
 * Interfaz para etiqueta con estadísticas
 */
export interface TagWithStats extends TagBase {
	count: number;
	size: string | number;
	lastUsed?: Date | string | null;
}

/**
 * Interfaz para etiqueta relacionada (versión simplificada)
 */
export interface RelatedTag {
	id: string;
	name: string;
	color: string;
	emoji?: string;
	count?: number;
}

/**
 * Datos para crear una etiqueta
 */
export interface CreateTagData {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	rarity?: string | null;
	texture?: string | null;
	isFavorite?: boolean;
}

/**
 * Datos para actualizar una etiqueta
 */
export interface UpdateTagData {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	category?: string | null;
	rarity?: string | null;
	texture?: string | null;
}

/**
 * Filtros para búsqueda de etiquetas
 */
export interface TagFilters {
	searchQuery?: string;
	categories?: string[];
	rarities?: string[];
	onlyFavorites?: boolean;
	minCount?: number;
	maxCount?: number;
}

/**
 * Respuesta para operaciones que relacionan etiquetas e imágenes
 */
export interface TagImageRelationResponse {
	success: boolean;
	tagId: string;
	imageId: string;
	message?: string;
}
