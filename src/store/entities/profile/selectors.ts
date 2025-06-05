/**
 * @file Selectores para el store de Profile
 * @module store/entities/profile/selectors
 */

import type { ProfileStoreState } from './types';

/**
 * Selectores para el perfil activo
 */
export const selectActiveProfile = (state: ProfileStoreState) => state.activeProfile;
export const selectIsLoadingActive = (state: ProfileStoreState) => state.isLoadingActive;
export const selectActiveProfileError = (state: ProfileStoreState) => state.activeProfileError;

/**
 * Selectores para la lista de perfiles
 */
export const selectProfiles = (state: ProfileStoreState) => state.profiles;
export const selectIsLoadingProfiles = (state: ProfileStoreState) => state.isLoadingProfiles;
export const selectProfilesError = (state: ProfileStoreState) => state.profilesError;
export const selectTotalProfiles = (state: ProfileStoreState) => state.totalProfiles;
export const selectCurrentPage = (state: ProfileStoreState) => state.currentPage;

/**
 * Selectores para filtros y paginación
 */
export const selectFilters = (state: ProfileStoreState) => state.filters;
export const selectPagination = (state: ProfileStoreState) => state.pagination;

/**
 * Selectores para la configuración de vista
 */
export const selectViewConfig = (state: ProfileStoreState) => state.viewConfig;
export const selectViewMode = (state: ProfileStoreState) => state.viewConfig.mode;
export const selectShowStats = (state: ProfileStoreState) => state.viewConfig.showStats;
export const selectShowDescription = (state: ProfileStoreState) => state.viewConfig.showDescription;
export const selectGridColumns = (state: ProfileStoreState) => state.viewConfig.gridColumns;
export const selectCardSize = (state: ProfileStoreState) => state.viewConfig.cardSize;

/**
 * Selectores para el estado de UI
 */
export const selectSelectedProfileId = (state: ProfileStoreState) => state.selectedProfileId;
export const selectHoveredProfileId = (state: ProfileStoreState) => state.hoveredProfileId;
export const selectExpandedProfileIds = (state: ProfileStoreState) => state.expandedProfileIds;

/**
 * Selectores para filtros
 */
export const selectActiveFilters = (state: ProfileStoreState) => state.activeFilters;
export const selectSearchTerm = (state: ProfileStoreState) => state.searchTerm;
export const selectDefaultSortOption = (state: ProfileStoreState) => state.defaultSortOption;
export const selectCurrentSortOption = (state: ProfileStoreState) => state.currentSortOption;
export const selectGroupBy = (state: ProfileStoreState) => state.groupBy;

/**
 * Selectores compuestos
 */
export const selectIsProfileSelected = (id: string) => (state: ProfileStoreState) => state.selectedProfileId === id;

export const selectIsProfileExpanded = (id: string) => (state: ProfileStoreState) =>
	state.expandedProfileIds.includes(id);

export const selectProfileById = (id: string) => (state: ProfileStoreState) =>
	state.profiles.find((profile) => profile.id === id);

export const selectFilteredProfiles = (state: ProfileStoreState) => {
	const { profiles, searchTerm, activeFilters } = state;

	return profiles.filter((profile) => {
		// Filtrar por término de búsqueda
		if (searchTerm && !profile.name.toLowerCase().includes(searchTerm.toLowerCase())) {
			return false;
		}

		// Filtrar por filtros activos
		if (activeFilters.length > 0) {
			return activeFilters.every((filter) => {
				switch (filter) {
					case 'active':
						return profile.isActive;
					case 'inactive':
						return !profile.isActive;
					case 'hasAvatar':
						return !!profile.avatarUrl;
					default:
						return true;
				}
			});
		}

		return true;
	});
};
