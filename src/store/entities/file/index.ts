/**
 * @file Store principal para la entidad File
 * @module store/entities/file
 */

import { createSelectors } from '@/utils/store-selectors';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Importar slices
import { CoreActions, CoreState, createCoreSlice } from './slices/core.slice';
import { FiltersActions, FiltersState, createFiltersSlice } from './slices/filters.slice';
import { UIActions, UIState, createUISlice } from './slices/ui.slice';

// Tipo del store
export type FileStore = CoreState & CoreActions & UIState & UIActions & FiltersState & FiltersActions;

// Crear el store con slices
export const useFileStoreBase = create<FileStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createCoreSlice(...a),
        ...createUISlice(...a),
        ...createFiltersSlice(...a),
      }),
      {
        name: 'file-store',
        partialize: (state) => ({
          // Solo persistir configuraciones de UI y filtros
          selectedFileIds: state.selectedFileIds,
          filterOptions: state.filterOptions,
          sortBy: state.sortBy,
          sortDirection: state.sortDirection,
          viewMode: state.viewMode,
          lastVisitedPath: state.lastVisitedPath,
          expandedFolders: state.expandedFolders,
        }),
      }
    ),
    { name: 'FileStore' }
  )
);

// Exportar store con selectores
export const useFileStore = createSelectors(useFileStoreBase);

// Exportar tipos
export * from './slices/core.slice';
export * from './slices/filters.slice';
export * from './slices/ui.slice';
