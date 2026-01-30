import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientLogger } from '@/lib/logger/client-logger';
import { createCoreSlice, createFiltersSlice, createRelationsSlice, createUISlice } from './slices';
import type { ConceptStore } from './types';

const storeLogger = clientLogger.withContext('ConceptStore');

/**
 * Store para la gestión de conceptos combinando todas las slices
 */
export const useConceptStore = create<ConceptStore>()(
	devtools(
		(...args) => {
			storeLogger.info('🏗️ Inicializando ConceptStore');

			// Combinar todas las slices
			return {
				...createCoreSlice(...args),
				...createFiltersSlice(...args),
				...createUISlice(...args),
				...createRelationsSlice(...args),
			};
		},
		{
			name: 'ConceptStore',
			enabled: process.env.NODE_ENV === 'development',
		}
	)
);

// Selectors para acceder a partes específicas del estado
export const selectConcepts = (state: ConceptStore) => state.concepts;
export const selectSelectedConcept = (state: ConceptStore) => state.selectedConcept;
export const selectIsLoading = (state: ConceptStore) => state.isLoading;
export const selectError = (state: ConceptStore) => state.error;

export const selectFilters = (state: ConceptStore) => state.filters;
export const selectSortBy = (state: ConceptStore) => state.sortBy;
export const selectPage = (state: ConceptStore) => state.page;
export const selectPageSize = (state: ConceptStore) => state.pageSize;

export const selectViewMode = (state: ConceptStore) => state.viewMode;
export const selectIsCreateModalOpen = (state: ConceptStore) => state.isCreateModalOpen;
export const selectIsEditModalOpen = (state: ConceptStore) => state.isEditModalOpen;
export const selectIsDeleteDialogOpen = (state: ConceptStore) => state.isDeleteDialogOpen;
export const selectIsDetailsDrawerOpen = (state: ConceptStore) => state.isDetailsDrawerOpen;
