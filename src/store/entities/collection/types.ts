/**
 * @file Tipos para el store de Collection
 * @module store/entities/collection/types
 */

import type { CollectionExtended, CollectionFilter, CollectionViewConfig } from '@/types/entities/collection';

/**
 * Estado base para el store de Collection
 */
export interface CollectionState {
	// Datos principales - usando Record para mejor performance
	collections: Record<string, CollectionExtended>;

	// Estado UI
	viewConfig: CollectionViewConfig;
	selectedCollectionId: string | null;
	hoveredCollectionId: string | null;
	expandedCollectionIds: string[];

	// Estado de carga y errores
	isLoading: boolean;
	error: string | null;

	// Filtrado y ordenamiento
	activeFilters: CollectionFilter[];
	searchTerm: string;
	defaultSortOption: string;
	currentSortOption: string;

	// Agrupamiento
	groupBy: 'category' | 'rarity' | 'platform' | null;
}
