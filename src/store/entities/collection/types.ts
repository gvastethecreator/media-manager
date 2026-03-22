/**
 * @file Tipos para el store de Collection
 * @module store/entities/collection/types
 */

import type { CollectionWithStats } from '@/types/entities/collection';

export interface CollectionViewConfig {
	cardSize: 'small' | 'medium' | 'large';
	compactView: boolean;
	enableAnimations: boolean;
	gridColumns: number;
	groupBy: string | null;
	imageCount: number;
	showImages: boolean;
	showStats: boolean;
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	viewType: 'grid' | 'list' | 'table';
}

export interface CollectionFilter {
	field: string;
	operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
	value: any;
}

/**
 * Estado base para el store de Collection
 */
export interface CollectionState {
	// Filtrado y ordenamiento
	activeFilters: CollectionFilter[];
	// Datos principales - usando Record para mejor performance
	collections: Record<string, CollectionWithStats>;
	currentSortOption: string;
	defaultSortOption: string;
	error: string | null;
	expandedCollectionIds: string[];

	// Agrupamiento
	groupBy: 'category' | 'rarity' | 'platform' | null;
	hoveredCollectionId: string | null;

	// Estado de carga y errores
	isLoading: boolean;
	searchTerm: string;
	selectedCollectionId: string | null;

	// Estado UI
	viewConfig: CollectionViewConfig;
}

export interface CollectionStore {
	// 🔄 Acciones principales
	addCollection: (collection: Omit<CollectionWithStats, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>) => void;
	averageRating: number;
	bulkAddCollections: (
		collections: Omit<CollectionWithStats, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>[]
	) => void;
	bulkRemoveCollections: (ids: string[]) => void;
	bulkUpdateCollections: (updates: Record<string, Partial<CollectionWithStats>>) => void;
	clearFilters: () => void;
	clearSelection: () => void;
	// 🗂️ Estado principal
	collections: Record<string, CollectionWithStats>;

	// 📄 Paginación
	currentPage: number;
	error: string | null;
	filterByCategory: (categories: string[]) => void;
	filterByHasItems: (hasItems: boolean | null) => void;
	filterByPrice: (min: number, max: number) => void;
	filterByPublic: (isPublic: boolean | null) => void;
	filterByRarity: (rarities: string[]) => void;
	filterByRating: (rating: number) => void;
	filters: CollectionFilter;
	getCollectionById: (id: string) => CollectionWithStats | undefined;
	getCollectionStatistics: () => {
		total: number;
		byCategory: Record<string, number>;
		byRarity: Record<string, number>;
		byOwner: Record<string, number>;
		averageValue: number;
		totalValue: number;
	};
	getCollectionsByCategory: (category: string) => CollectionWithStats[];
	getCollectionsByOwner: (owner: string) => CollectionWithStats[];
	getCollectionsByRarity: (rarity: string) => CollectionWithStats[];

	// 📖 Getters computados
	getFilteredCollections: () => CollectionWithStats[];
	getGroupedCollections: () => Record<string, CollectionWithStats[]>;
	getPaginatedCollections: () => CollectionWithStats[];
	getSelectedCollections: () => CollectionWithStats[];
	getSortedCollections: () => CollectionWithStats[];

	// 📊 Agrupamiento
	groupBy: 'none' | 'category' | 'rarity' | 'owner';
	groupDirection: 'asc' | 'desc';
	itemSize: 'small' | 'medium' | 'large';
	itemsPerPage: number;
	lastSelectedCollection: string | null;
	lastUpdated: Date | null;
	loading: boolean;
	nextPage: () => void;
	prevPage: () => void;
	removeCollection: (id: string) => void;

	// 🔍 Filtros y búsqueda
	searchQuery: string;
	selectAll: () => void;

	// 🎯 Selección
	selectCollection: (id: string) => void;

	// 🎯 Selección
	selectedCollections: string[];
	selectMultipleCollections: (ids: string[]) => void;

	// 📄 Paginación
	setCurrentPage: (page: number) => void;
	setFilters: (filters: Partial<CollectionFilter>) => void;

	// 📊 Agrupamiento
	setGroupBy: (groupBy: 'none' | 'category' | 'rarity' | 'owner') => void;
	setGroupDirection: (direction: 'asc' | 'desc') => void;
	setItemSize: (size: 'small' | 'medium' | 'large') => void;
	setItemsPerPage: (count: number) => void;

	// 🔍 Filtros y búsqueda
	setSearchQuery: (query: string) => void;

	// 📋 Ordenamiento
	setSortBy: (sortBy: CollectionStore['sortBy']) => void;
	setSortDirection: (direction: 'asc' | 'desc') => void;

	// 👁️ Vista
	setViewMode: (mode: 'grid' | 'list' | 'table') => void;
	showStats: boolean;
	showThumbnails: boolean;

	// 📋 Ordenamiento
	sortBy: 'name' | 'createdAt' | 'updatedAt' | 'itemCount' | 'totalValue' | 'rating';
	sortDirection: 'asc' | 'desc';
	toggleSelection: (id: string) => void;
	toggleSortDirection: () => void;
	toggleStats: () => void;
	toggleThumbnails: () => void;

	// 📊 Estadísticas
	totalCollections: number;
	totalItems: number;
	totalPages: number;
	totalValue: number;
	updateCollection: (id: string, updates: Partial<CollectionWithStats>) => void;

	// 👁️ Vista
	viewMode: 'grid' | 'list' | 'table';
}
