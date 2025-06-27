/**
 * @file Store principal para la entidad Metadata
 * @module store/entities/metadata
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createSelectors } from '@/lib/utils/store-selectors.utils';

// Importar slices
import { CoreActions, CoreState, createCoreSlice } from './slices/core.slice';
import { createFiltersSlice, FiltersActions, FiltersState } from './slices/filters.slice';
import { createUISlice, UIActions, UIState } from './slices/ui.slice';

// Tipo del store
export type MetadataStore = CoreState & CoreActions & UIState & UIActions & FiltersState & FiltersActions;

// Crear el store con slices
export const useMetadataStoreBase = create<MetadataStore>()(
	devtools(
		persist(
			(...a) => ({
				...createCoreSlice(...a),
				...createUISlice(...a),
				...createFiltersSlice(...a),
			}),
			{
				name: 'metadata-store',
				partialize: (state) => ({
					// Solo persistir configuraciones de UI y filtros
					selectedMetadataIds: state.selectedMetadataIds,
					filterOptions: state.filterOptions,
					sortBy: state.sortBy,
					sortDirection: state.sortDirection,
					viewMode: state.viewMode,
				}),
			}
		),
		{ name: 'MetadataStore' }
	)
);

// Exportar store con selectores
export const useMetadataStore = createSelectors(useMetadataStoreBase);

// Exportar tipos
export * from './slices/core.slice';
export * from './slices/filters.slice';
export * from './slices/ui.slice';
