/**
 * @file Filters slice para el store de carpetas
 * @module store/entities/folder/slices/filters
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { FolderFiltersSlice } from '../types';

const filtersLogger = clientLogger.withContext('FolderStore:Filters');

export const createFiltersSlice: FolderFiltersSlice = (set, get) => ({
	filtersState: {
		// Estado inicial
		searchTerm: '',
		sortBy: 'name',
		sortDirection: 'asc',
		showFavorites: false,
		activeOnly: true,
		categoryFilter: null,
		minSize: null,
		maxSize: null,
		minFiles: null,
		maxFiles: null,
		notIndexed: false,
		autoReindexOnly: false,
		indexedAfter: null,
		indexedBefore: null,
	},

	filtersActions: {
		// Acciones
		setSearchTerm: (term) => {
			const { filtersState } = get();
			filtersLogger.info(`🔍 Estableciendo término de búsqueda: "${term}"`);
			set({ filtersState: { ...filtersState, searchTerm: term } });
		},

		setSortBy: (sortBy) => {
			const { filtersState } = get();
			filtersLogger.info(`🔄 Cambiando criterio de ordenación a: ${sortBy}`);
			set({ filtersState: { ...filtersState, sortBy } });
		},

		setSortDirection: (direction) => {
			const { filtersState } = get();
			filtersLogger.info(`🔄 Cambiando dirección de ordenación a: ${direction}`);
			set({ filtersState: { ...filtersState, sortDirection: direction } });
		},

		toggleFavorites: () => {
			const { filtersState } = get();
			const newState = !filtersState.showFavorites;
			filtersLogger.info(`⭐ ${newState ? 'Mostrando' : 'Ocultando'} solo favoritos`);
			set({ filtersState: { ...filtersState, showFavorites: newState } });
		},

		toggleActiveOnly: () => {
			const { filtersState } = get();
			const newState = !filtersState.activeOnly;
			filtersLogger.info(`🚦 ${newState ? 'Mostrando' : 'Mostrando todas'} carpetas activas`);
			set({ filtersState: { ...filtersState, activeOnly: newState } });
		},

		setCategoryFilter: (category) => {
			const { filtersState } = get();
			filtersLogger.info(`🏷️ Filtrando por categoría: ${category || 'todas'}`);
			set({ filtersState: { ...filtersState, categoryFilter: category } });
		},

		setMinSize: (size) => {
			const { filtersState } = get();
			filtersLogger.info(`📊 Estableciendo tamaño mínimo: ${size ? `${size} bytes` : 'sin límite'}`);
			set({ filtersState: { ...filtersState, minSize: size } });
		},

		setMaxSize: (size) => {
			const { filtersState } = get();
			filtersLogger.info(`📊 Estableciendo tamaño máximo: ${size ? `${size} bytes` : 'sin límite'}`);
			set({ filtersState: { ...filtersState, maxSize: size } });
		},

		setMinFiles: (count) => {
			const { filtersState } = get();
			filtersLogger.info(`🔢 Estableciendo cantidad mínima de archivos: ${count || 'sin límite'}`);
			set({ filtersState: { ...filtersState, minFiles: count } });
		},

		setMaxFiles: (count) => {
			const { filtersState } = get();
			filtersLogger.info(`🔢 Estableciendo cantidad máxima de archivos: ${count || 'sin límite'}`);
			set({ filtersState: { ...filtersState, maxFiles: count } });
		},

		toggleNotIndexed: () => {
			const { filtersState } = get();
			const newState = !filtersState.notIndexed;
			filtersLogger.info(`🔍 ${newState ? 'Mostrando' : 'Ocultando'} carpetas sin indexar`);
			set({ filtersState: { ...filtersState, notIndexed: newState } });
		},

		toggleAutoReindexOnly: () => {
			const { filtersState } = get();
			const newState = !filtersState.autoReindexOnly;
			filtersLogger.info(`🔄 ${newState ? 'Mostrando' : 'Ocultando'} solo carpetas con reindexado automático`);
			set({ filtersState: { ...filtersState, autoReindexOnly: newState } });
		},

		setIndexedAfter: (date) => {
			const { filtersState } = get();
			filtersLogger.info(`📅 Filtrando carpetas indexadas después de: ${date?.toISOString() || 'sin fecha'}`);
			set({ filtersState: { ...filtersState, indexedAfter: date } });
		},

		setIndexedBefore: (date) => {
			const { filtersState } = get();
			filtersLogger.info(`📅 Filtrando carpetas indexadas antes de: ${date?.toISOString() || 'sin fecha'}`);
			set({ filtersState: { ...filtersState, indexedBefore: date } });
		},

		resetFilters: () => {
			filtersLogger.info('🔄 Reiniciando todos los filtros');
			set({
				filtersState: {
					searchTerm: '',
					sortBy: 'name',
					sortDirection: 'asc',
					showFavorites: false,
					activeOnly: true,
					categoryFilter: null,
					minSize: null,
					maxSize: null,
					minFiles: null,
					maxFiles: null,
					notIndexed: false,
					autoReindexOnly: false,
					indexedAfter: null,
					indexedBefore: null,
				},
			});
		},
	},
});
