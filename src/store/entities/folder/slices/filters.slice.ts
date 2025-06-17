/**
 * @file Slice de filtros para el store de Folder
 * @module store/entities/folder/slices/filters.slice
 */

import { StateCreator } from 'zustand';
import { Logger } from '@/lib/logger';
import { FolderSortBy } from '@/types/entities/folder/enums';
import type { FolderFilterActions, FolderFilters, FolderStore } from '@/types/entities/folder/types';

const logger = new Logger('FolderFiltersSlice');

/**
 * 🔍 Creador del slice de filtros para el store de Folder
 */
export const createFolderFiltersSlice: StateCreator<
	FolderStore,
	[],
	[],
	{ filters: FolderFilters } & FolderFilterActions
> = (set, get) => ({
	// Estado inicial de filtros
	filters: {
		searchTerm: '',
		sortBy: FolderSortBy.NAME_ASC,
		parentId: null,
		onlyFavorites: false,
	},

	// Actualiza los filtros
	updateFilters: (filters) => {
		logger.info('🔄 Actualizando filtros:', filters);

		set((state) => ({
			filters: {
				...state.filters,
				...filters,
			},
		}));
	},

	// Limpia todos los filtros
	clearFilters: () => {
		logger.info('🧹 Limpiando filtros');

		set({
			filters: {
				searchTerm: '',
				sortBy: FolderSortBy.NAME_ASC,
				parentId: null,
				onlyFavorites: false,
			},
		});
	},

	// Obtiene carpetas filtradas
	getFilteredFolders: () => {
		const { items } = get();
		const { searchTerm, parentId, onlyFavorites } = get().filters;

		logger.debug('🔍 Filtrando carpetas con términos:', { searchTerm, parentId, onlyFavorites });

		// Comenzar con todos los items
		let filtered = [...items];

		// Filtrar por término de búsqueda (nombre, descripción o path)
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(folder) =>
					folder.name.toLowerCase().includes(term) ||
					folder.description?.toLowerCase().includes(term) ||
					folder.path.toLowerCase().includes(term)
			);
		}

		// Filtrar por ID de padre
		if (parentId !== null) {
			filtered = filtered.filter((folder) => folder.parentId === parentId);
		}

		// Filtrar por favoritos (si se implementa esta propiedad)
		if (onlyFavorites) {
			filtered = filtered.filter((folder) => folder.metadata?.isFavorite === true);
		}

		logger.debug(`✅ Filtrado completado: ${filtered.length} carpetas coinciden`);

		return filtered;
	},

	// Obtiene carpetas filtradas y ordenadas
	getSortedFolders: () => {
		const { sortBy } = get().filters;
		const filteredFolders = get().getFilteredFolders();

		logger.debug(`🔢 Ordenando carpetas por: ${sortBy}`);

		return [...filteredFolders].sort((a, b) => {
			switch (sortBy) {
				case FolderSortBy.NAME_ASC:
					return a.name.localeCompare(b.name);

				case FolderSortBy.NAME_DESC:
					return b.name.localeCompare(a.name);

				case FolderSortBy.CREATED_ASC:
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

				case FolderSortBy.CREATED_DESC:
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

				case FolderSortBy.UPDATED_ASC:
					return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();

				case FolderSortBy.UPDATED_DESC:
					return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

				case FolderSortBy.PATH_ASC:
					return a.path.localeCompare(b.path);

				case FolderSortBy.PATH_DESC:
					return b.path.localeCompare(a.path);

				default:
					return a.name.localeCompare(b.name);
			}
		});
	},
});
