/**
 * @file Tipos extendidos para la entidad Collection con propiedades adicionales de UI
 * @module types/entities/collection/extended
 */

import type { Image } from '@prisma/client';
import type { CollectionBase } from './base';
import type { CollectionFilter } from './types';

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

	// Calculados/runtime
	parsedFilters?: CollectionFilter[];
	imageCount?: number;
	totalValue?: number;

	// Relaciones expandidas
	images?: Image[];
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
