/**
 * @file Slice para filtros y ordenación del store de Folder
 * @module store/entities/folder/slices/filters
 */

import type { StateCreator } from 'zustand';
import type { FolderWithStats } from '@/types/entities/folder';
import { FolderSortCriteria, FolderViewMode } from '@/types/entities/folder/enums';
import type { CompleteFolderStore, FolderFiltersSlice } from '../types';

export interface FolderFiltersState {
	sortBy: FolderSortCriteria;
	sortDirection: 'asc' | 'desc';
	viewMode: FolderViewMode;
	itemSize: 'small' | 'medium' | 'large';
	searchQuery: string;
	showOnlyFavorites: boolean;
	minOrganizationScore: number;
	showEmptyFolders: boolean;
	maxDepth: number | null;
}

export const initialFiltersState: FolderFiltersState = {
	sortBy: FolderSortCriteria.NAME_ASC,
	sortDirection: 'asc',
	viewMode: FolderViewMode.GRID,
	itemSize: 'medium',
	searchQuery: '',
	showOnlyFavorites: false,
	minOrganizationScore: 0,
	showEmptyFolders: true,
	maxDepth: null,
};

// Creador del slice de filtros
export const createFolderFiltersSlice: StateCreator<CompleteFolderStore, [], [], FolderFiltersSlice> = (set, get) => ({
	...initialFiltersState,

	// Establecer filtros
	setSortBy: (sortBy) => set({ sortBy }),
	setSortDirection: (direction) => set({ sortDirection: direction }),
	setViewMode: (viewMode) => set({ viewMode }),
	setItemSize: (size) => set({ itemSize: size }),
	setSearchQuery: (query) => set({ searchQuery: query }),
	setShowOnlyFavorites: (show) => set({ showOnlyFavorites: show }),
	setMinOrganizationScore: (score) => set({ minOrganizationScore: score }),
	setShowEmptyFolders: (show) => set({ showEmptyFolders: show }),
	setMaxDepth: (depth) => set({ maxDepth: depth }),
	toggleFavorites: () => set((state) => ({ showOnlyFavorites: !state.showOnlyFavorites })),
	resetFilters: () => set(initialFiltersState),

	// Obtener carpetas filtradas
	getFilteredFolders: () => {
		const folders = get().getRootFolders(); // Empezar con carpetas raíz
		return get().applySort(get().applyFilters(folders));
	},

	applyFilters: (folders: FolderWithStats[]) => {
		const { searchQuery, showOnlyFavorites, minOrganizationScore, showEmptyFolders, maxDepth } = get();

		return folders.filter((folder) => {
			// Filtrado por búsqueda
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const matchesName = folder.name.toLowerCase().includes(query);
				const matchesDescription = folder.description?.toLowerCase().includes(query);
				const matchesPath = folder.path.toLowerCase().includes(query);
				const matchesTags = folder.stats.autoTags.some((tag) => tag.toLowerCase().includes(query));

				if (!(matchesName || matchesDescription || matchesPath || matchesTags)) {
					return false;
				}
			}

			// Filtrado por favoritos
			if (showOnlyFavorites && !folder.isFavorite) {
				return false;
			}

			// Filtrado por score de organización
			if (folder.stats.organizationScore < minOrganizationScore) {
				return false;
			}

			// Filtrado por carpetas vacías
			if (!showEmptyFolders && folder.stats.totalItems === 0) {
				return false;
			}

			// Filtrado por profundidad máxima
			if (maxDepth !== null && folder.stats.hierarchyDepth > maxDepth) {
				return false;
			}

			return true;
		});
	},

	applySort: (folders: FolderWithStats[]) => {
		const { sortBy } = get();

		return [...folders].sort((a, b) => {
			switch (sortBy) {
				case FolderSortCriteria.NAME_ASC:
					return a.name.localeCompare(b.name);
				case FolderSortCriteria.NAME_DESC:
					return b.name.localeCompare(a.name);

				case FolderSortCriteria.DATE_ASC:
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case FolderSortCriteria.DATE_DESC:
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

				case FolderSortCriteria.SIZE_ASC:
					return a.totalSize - b.totalSize;
				case FolderSortCriteria.SIZE_DESC:
					return b.totalSize - a.totalSize;

				case FolderSortCriteria.FILES_ASC:
					return a.stats.totalItems - b.stats.totalItems;
				case FolderSortCriteria.FILES_DESC:
					return b.stats.totalItems - a.stats.totalItems;

				case FolderSortCriteria.ORGANIZATION_ASC:
					return a.stats.organizationScore - b.stats.organizationScore;
				case FolderSortCriteria.ORGANIZATION_DESC:
					return b.stats.organizationScore - a.stats.organizationScore;

				case FolderSortCriteria.DEPTH_ASC:
					return a.stats.hierarchyDepth - b.stats.hierarchyDepth;
				case FolderSortCriteria.DEPTH_DESC:
					return b.stats.hierarchyDepth - a.stats.hierarchyDepth;

				case FolderSortCriteria.ACTIVITY_ASC: {
					const aActivity = a.stats.lastActivity?.getTime() || 0;
					const bActivity = b.stats.lastActivity?.getTime() || 0;
					return aActivity - bActivity;
				}
				case FolderSortCriteria.ACTIVITY_DESC: {
					const aActivityDesc = a.stats.lastActivity?.getTime() || 0;
					const bActivityDesc = b.stats.lastActivity?.getTime() || 0;
					return bActivityDesc - aActivityDesc;
				}

				default:
					return 0;
			}
		});
	},
});
