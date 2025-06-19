/**
 * @file Tipos extendidos para la entidad Collection con propiedades adicionales de UI
 * @module types/entities/collection/extended
 */

import type { CollectionBase, CollectionEdition, CollectionFilter, CollectionSortBy } from './types';

/**
 * Tipo extendido para Collection con propiedades adicionales de UI
 */
export interface CollectionExtended extends CollectionBase {
	// Propiedades de UI
	isSelected?: boolean;
	isHovered?: boolean;
	isOpen?: boolean;
	isLoading?: boolean;
	hasError?: boolean;
	isRecent?: boolean;

	// Calculados/runtime
	parsedFilters?: CollectionFilter[];
	imageCount?: number;
	totalValue?: number;

	// Relaciones expandidas
	images?: Array<{ id: string; name: string; path: string }>;
}

/**
 * Tipo completo para Collection con todas las relaciones y datos
 */
export interface CollectionComplete extends CollectionBase {
	// Campos serializados deserializados
	filters: CollectionFilter[];
	sortBy: CollectionSortBy | null;
	editions: CollectionEdition[];

	// Relaciones completas
	images: Array<{ id: string; name: string; path: string }>;
	videos: Array<{ id: string; name: string; path: string }>;
	tags: Array<{ id: string; name: string; color: string; emoji: string }>;
	groups: Array<{ id: string; name: string; color: string; emoji: string }>;
	properties: Array<{ id: string; name: string; type: string }>;
	wildcards: Array<{ id: string; name: string; pattern: string }>;
	parent: { id: string; name: string } | null;
	children: Array<{ id: string; name: string }>;
	albums: Array<{ id: string; name: string }>;

	// Conteos
	_count: {
		images?: number;
		videos?: number;
		tags?: number;
		groups?: number;
		properties?: number;
		wildcards?: number;
		children?: number;
		albums?: number;
	};
}

/**
 * Tipo para las estadísticas de una colección
 */
export interface CollectionStats {
	totalItems: number;
	commonItems: number;
	rareItems: number;
	totalValue: number;
	averagePrice: number;
	oldest: Date | null;
	newest: Date | null;
}

/**
 * Tipo para los datos de una lista de colecciones
 */
export interface CollectionListItem extends CollectionExtended {
	isFeatured?: boolean;
	thumbnailUrl?: string;
}

/**
 * Tipo para la configuración de visualización de colecciones
 */
export interface CollectionViewConfig {
	viewType: 'grid' | 'list' | 'compact' | 'gallery';
	sortBy: 'name' | 'date' | 'price' | 'items' | 'category';
	sortDirection: 'asc' | 'desc';
	showImages: boolean;
	imageCount: number;
	enableAnimations: boolean;
	groupBy?: 'category' | 'rarity' | 'platform' | null;
}

/**
 * Tipo para la tarjeta de colección
 */
export interface CollectionCard {
	collection: CollectionExtended;
	thumbnails: string[];
	isExpanded: boolean;
	isFlipped: boolean;
	showDetails: boolean;
}
