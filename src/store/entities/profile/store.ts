/**
 * @file Store de Profile
 * @module store/entities/profile/store
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ProfileActions } from './actions';
import { createProfileActions } from './actions';
import type { ProfileStoreState } from './types';

/**
 * Estado inicial del store
 */
const initialState: ProfileStoreState = {
  // Estado del perfil activo
  activeProfile: null,
  isLoadingActive: false,
  activeProfileError: null,

  // Estado de la lista de perfiles
  profiles: [],
  isLoadingProfiles: false,
  profilesError: null,
  totalProfiles: 0,
  currentPage: 1,

  // Estado de filtros y paginación
  filters: {
    status: 'all',
    theme: 'all',
    language: 'all',
    search: ''
  },
  pagination: {
    page: 1,
    limit: 10,
    orderBy: 'createdAt',
    order: 'desc'
  },

  // Estado de la configuración de vista
  viewConfig: {
    mode: 'grid',
    showStats: true,
    showDescription: true,
    defaultView: 'grid',
    gridColumns: 3,
    cardSize: 'medium'
  },

  // Estado de UI
  selectedProfileId: null,
  hoveredProfileId: null,
  expandedProfileIds: [],

  // Estado de filtros
  activeFilters: [],
  searchTerm: '',
  defaultSortOption: 'createdAt_desc',
  currentSortOption: 'createdAt_desc',
  groupBy: 'none'
};

/**
 * Store de Profile
 */
export const useProfileStore = create<ProfileStoreState & ProfileActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        ...createProfileActions(set, get)
      }),
      {
        name: 'profile-store',
        partialize: (state) => ({
          viewConfig: state.viewConfig,
          filters: state.filters,
          pagination: state.pagination,
          defaultSortOption: state.defaultSortOption,
          currentSortOption: state.currentSortOption,
          groupBy: state.groupBy
        })
      }
    ),
    {
      name: 'ProfileStore',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);