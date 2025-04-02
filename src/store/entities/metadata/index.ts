/**
 * @file Store principal para la entidad Metadata
 * @module store/entities/metadata
 */

import { createSelectors } from '@/utils/store-selectors';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Importar slices
import { CoreActions, CoreState, createCoreSlice } from './slices/core.slice';
import { FiltersActions, FiltersState, createFiltersSlice } from './slices/filters.slice';
import { UIActions, UIState, createUISlice } from './slices/ui.slice';

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
