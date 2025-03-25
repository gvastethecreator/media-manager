/**
 * @file Store principal para la entidad Activity
 * @module store/entities/activity
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ActivitySortCriteria } from '../../../types/entities/activity';
import { type ActivityCoreSlice, createActivityCoreSlice } from './slices/core';
import { type ActivityFiltersSlice, createActivityFiltersSlice } from './slices/filters';
import { type ActivityUISlice, createActivityUISlice } from './slices/ui';
import { type ActivityState } from './types';

// Tipo del store completo
export type ActivityStore = ActivityCoreSlice & ActivityUISlice & ActivityFiltersSlice;

// Estado inicial
const initialState: ActivityState = {
  core: {
    activities: {},
    isLoading: false,
    error: null,
    lastUpdated: null,
  },
  ui: {
    selectedIds: [],
    expandedIds: [],
    highlightedId: null,
    detailActivityId: null,
    isDetailModalOpen: false,
    groupByDate: true,
  },
  filters: {
    sortBy: ActivitySortCriteria.DATE_DESC,
    searchQuery: '',
    selectedCategories: [],
    onlyAlerts: false,
    dateRange: {
      from: null,
      to: null,
    },
    filterByImageId: null,
  },
};

// Crear store combinando slices
export const useActivityStore = create<ActivityStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createActivityCoreSlice(...a),
        ...createActivityUISlice(...a),
        ...createActivityFiltersSlice(...a),
      }),
      {
        name: 'activity-store',
        partialize: (state) => ({
          ui: {
            groupByDate: state.ui.groupByDate,
          },
          filters: {
            sortBy: state.filters.sortBy,
            onlyAlerts: state.filters.onlyAlerts,
          },
        }),
      }
    ),
    { name: 'ActivityStore' }
  )
);

// Exportar todo desde types
export * from './types';

// Exportar slices para poder extenderlos
export { createActivityCoreSlice } from './slices/core';
export { createActivityFiltersSlice } from './slices/filters';
export { createActivityUISlice } from './slices/ui';
