/**
 * @file Acciones para el store de Profile
 * @module store/entities/profile/actions
 */

import type { StateCreator } from 'zustand';
// Refactor 2025-07: se usan funciones del cliente API de perfiles
import { getActiveProfileFromApi, getProfilesFromApi } from '@/lib/api/client/profile.client';
import type { ProfileExtended, ProfileFilters, ProfilePaginationOptions } from '@/types/entities/profile';
import type { ProfileStoreState } from './types';

/**
 * Acciones para el store de Profile
 */
export interface ProfileActions {
	// Acciones para el perfil activo
	fetchActiveProfile: () => Promise<void>;

	// Acciones para la lista de perfiles
	fetchProfiles: () => Promise<void>;

	// Acciones compuestas
	resetFilters: () => void;
	resetUI: () => void;

	// Acciones para filtros
	setActiveFilters: (filters: string[]) => void;
	setActiveProfile: (profile: ProfileExtended | null) => void;
	setActiveProfileError: (error: string | null) => void;
	setCardSize: (size: 'small' | 'medium' | 'large') => void;
	setCurrentPage: (page: number) => void;

	// Acciones para filtros y paginación
	setFilters: (filters: ProfileFilters) => void;
	setGridColumns: (columns: 2 | 3 | 4) => void;
	setGroupBy: (groupBy: 'none' | 'theme' | 'language' | 'status') => void;
	setHoveredProfileId: (id: string | null) => void;
	setIsLoadingActive: (isLoading: boolean) => void;
	setIsLoadingProfiles: (isLoading: boolean) => void;
	setPagination: (pagination: ProfilePaginationOptions) => void;
	setProfiles: (profiles: ProfileExtended[]) => void;
	setProfilesError: (error: string | null) => void;
	setSearchTerm: (term: string) => void;

	// Acciones para el estado de UI
	setSelectedProfileId: (id: string | null) => void;
	setShowDescription: (show: boolean) => void;
	setShowStats: (show: boolean) => void;
	setSortOption: (option: string) => void;
	setTotalProfiles: (total: number) => void;

	// Acciones para la configuración de vista
	setViewMode: (mode: 'grid' | 'list' | 'cards') => void;
	toggleExpandedProfileId: (id: string) => void;
}

/**
 * Creador de acciones para el store de Profile
 */
export const createProfileActions: StateCreator<ProfileStoreState & ProfileActions, [], [], ProfileActions> = (
	set,
	get
) => ({
	// Acciones para el perfil activo
	fetchActiveProfile: async () => {
		set({ isLoadingActive: true, activeProfileError: null });
		try {
			const profile = await getActiveProfileFromApi();
			set({ activeProfile: profile, isLoadingActive: false });
		} catch (error) {
			set({
				activeProfileError: error instanceof Error ? error.message : 'Error al obtener el perfil activo',
				isLoadingActive: false,
			});
		}
	},
	setActiveProfile: (profile) => set({ activeProfile: profile }),
	setIsLoadingActive: (isLoading) => set({ isLoadingActive: isLoading }),
	setActiveProfileError: (error) => set({ activeProfileError: error }),

	// Acciones para la lista de perfiles
	fetchProfiles: async () => {
		set({ isLoadingProfiles: true, profilesError: null });
		try {
			const { filters, pagination } = get();
			const profiles = await getProfilesFromApi();
			set({ profiles, totalProfiles: profiles.length, isLoadingProfiles: false });
		} catch (error) {
			set({
				profilesError: error instanceof Error ? error.message : 'Error al obtener los perfiles',
				isLoadingProfiles: false,
			});
		}
	},
	setProfiles: (profiles) => set({ profiles }),
	setIsLoadingProfiles: (isLoading) => set({ isLoadingProfiles: isLoading }),
	setProfilesError: (error) => set({ profilesError: error }),
	setTotalProfiles: (total) => set({ totalProfiles: total }),
	setCurrentPage: (page) => set({ currentPage: page }),

	// Acciones para filtros y paginación
	setFilters: (filters) => set({ filters }),
	setPagination: (pagination) => set({ pagination }),

	// Acciones para la configuración de vista
	setViewMode: (mode) =>
		set((state) => {
			if (state.viewConfig.mode === mode) return state;
			return { viewConfig: { ...state.viewConfig, mode } };
		}),
	setShowStats: (show) => set((state) => ({ viewConfig: { ...state.viewConfig, showStats: show } })),
	setShowDescription: (show) => set((state) => ({ viewConfig: { ...state.viewConfig, showDescription: show } })),
	setGridColumns: (columns) => set((state) => ({ viewConfig: { ...state.viewConfig, gridColumns: columns } })),
	setCardSize: (size) => set((state) => ({ viewConfig: { ...state.viewConfig, cardSize: size } })),

	// Acciones para el estado de UI
	setSelectedProfileId: (id) => set({ selectedProfileId: id }),
	setHoveredProfileId: (id) => set({ hoveredProfileId: id }),
	toggleExpandedProfileId: (id) =>
		set((state) => ({
			expandedProfileIds: state.expandedProfileIds.includes(id)
				? state.expandedProfileIds.filter((expandedId) => expandedId !== id)
				: [...state.expandedProfileIds, id],
		})),

	// Acciones para filtros
	setActiveFilters: (filters) => set({ activeFilters: filters }),
	setSearchTerm: (term) => set({ searchTerm: term }),
	setSortOption: (option) => set({ currentSortOption: option }),
	setGroupBy: (groupBy) => set({ groupBy }),

	// Acciones compuestas
	resetFilters: () =>
		set((state) => ({
			activeFilters: [],
			searchTerm: '',
			currentSortOption: state.defaultSortOption,
			groupBy: 'none',
		})),
	resetUI: () =>
		set({
			selectedProfileId: null,
			hoveredProfileId: null,
			expandedProfileIds: [],
		}),
});
