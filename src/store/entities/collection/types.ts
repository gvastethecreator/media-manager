/**
 * @file Tipos para el store de Collection
 * @module store/entities/collection/types
 */

import type { CollectionWithStats } from '@/types/entities/collection';
import type { CollectionFilter as CollectionFilterType } from '@/types/entities/collection/types';

export interface CollectionViewConfig {
	viewType: 'grid' | 'list' | 'table';
	gridColumns: number;
	cardSize: 'small' | 'medium' | 'large';
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	showImages: boolean;
	imageCount: number;
	enableAnimations: boolean;
	groupBy: string | null;
	showStats: boolean;
	compactView: boolean;
}

export interface CollectionFilter {
	field: string;
	value: any;
	operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
}

/**
 * Estado base para el store de Collection
 */
export interface CollectionState {
	// Datos principales - usando Record para mejor performance
	collections: Record<string, CollectionWithStats>;

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

export interface CollectionStore {
	// 🗂️ Estado principal
	collections: Record<string, CollectionWithStats>;
	loading: boolean;
	error: string | null;
	lastUpdated: Date | null;

	// 📊 Estadísticas
	totalCollections: number;
	totalItems: number;
	totalValue: number;
	averageRating: number;

	// 🔍 Filtros y búsqueda
	searchQuery: string;
	filters: CollectionFilter;

	// 📋 Ordenamiento
	sortBy: 'name' | 'createdAt' | 'updatedAt' | 'itemCount' | 'totalValue' | 'rating';
	sortDirection: 'asc' | 'desc';

	// 👁️ Vista
	viewMode: 'grid' | 'list' | 'table';
	itemSize: 'small' | 'medium' | 'large';
	showStats: boolean;
	showThumbnails: boolean;

	// 📊 Agrupamiento
	groupBy: 'none' | 'category' | 'rarity' | 'owner';
	groupDirection: 'asc' | 'desc';

	// 🎯 Selección
	selectedCollections: string[];
	lastSelectedCollection: string | null;

	// 📄 Paginación
	currentPage: number;
	itemsPerPage: number;
	totalPages: number;

	// 🔄 Acciones principales
	addCollection: (collection: Omit<CollectionWithStats, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>) => void;
	updateCollection: (id: string, updates: Partial<CollectionWithStats>) => void;
	removeCollection: (id: string) => void;
	bulkAddCollections: (
		collections: Omit<CollectionWithStats, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>[]
	) => void;
	bulkUpdateCollections: (updates: Record<string, Partial<CollectionWithStats>>) => void;
	bulkRemoveCollections: (ids: string[]) => void;

	// 🔍 Filtros y búsqueda
	setSearchQuery: (query: string) => void;
	setFilters: (filters: Partial<CollectionFilter>) => void;
	clearFilters: () => void;
	filterByCategory: (categories: string[]) => void;
	filterByRarity: (rarities: string[]) => void;
	filterByPrice: (min: number, max: number) => void;
	filterByRating: (rating: number) => void;
	filterByPublic: (isPublic: boolean | null) => void;
	filterByHasItems: (hasItems: boolean | null) => void;

	// 📋 Ordenamiento
	setSortBy: (sortBy: CollectionStore['sortBy']) => void;
	setSortDirection: (direction: 'asc' | 'desc') => void;
	toggleSortDirection: () => void;

	// 👁️ Vista
	setViewMode: (mode: 'grid' | 'list' | 'table') => void;
	setItemSize: (size: 'small' | 'medium' | 'large') => void;
	toggleStats: () => void;
	toggleThumbnails: () => void;

	// 📊 Agrupamiento
	setGroupBy: (groupBy: 'none' | 'category' | 'rarity' | 'owner') => void;
	setGroupDirection: (direction: 'asc' | 'desc') => void;

	// 🎯 Selección
	selectCollection: (id: string) => void;
	selectMultipleCollections: (ids: string[]) => void;
	clearSelection: () => void;
	toggleSelection: (id: string) => void;
	selectAll: () => void;

	// 📄 Paginación
	setCurrentPage: (page: number) => void;
	setItemsPerPage: (count: number) => void;
	nextPage: () => void;
	prevPage: () => void;

	// 📖 Getters computados
	getFilteredCollections: () => CollectionWithStats[];
	getSortedCollections: () => CollectionWithStats[];
	getGroupedCollections: () => Record<string, CollectionWithStats[]>;
	getPaginatedCollections: () => CollectionWithStats[];
	getSelectedCollections: () => CollectionWithStats[];
	getCollectionById: (id: string) => CollectionWithStats | undefined;
	getCollectionsByCategory: (category: string) => CollectionWithStats[];
	getCollectionsByRarity: (rarity: string) => CollectionWithStats[];
	getCollectionsByOwner: (owner: string) => CollectionWithStats[];
	getCollectionStatistics: () => {
		total: number;
		byCategory: Record<string, number>;
		byRarity: Record<string, number>;
		byOwner: Record<string, number>;
		averageValue: number;
		totalValue: number;
	};
}
