/**
 * @file Tipos para el store de Profile
 * @module store/entities/profile/types
 */

import type { ProfileExtended, ProfileFilters, ProfilePaginationOptions } from '@/types/entities/profile';

/**
 * Estado base del store de Profile
 */
export interface ProfileState {
	// Estado del perfil activo
	activeProfile: ProfileExtended | null;
	isLoadingActive: boolean;
	activeProfileError: string | null;

	// Estado de la lista de perfiles
	profiles: ProfileExtended[];
	isLoadingProfiles: boolean;
	profilesError: string | null;
	totalProfiles: number;
	currentPage: number;

	// Estado de filtros y paginación
	filters: ProfileFilters;
	pagination: ProfilePaginationOptions;
}

/**
 * Configuración de vista para perfiles
 */
export interface ProfileViewConfig {
	mode: 'grid' | 'list' | 'cards';
	showStats: boolean;
	showDescription: boolean;
	defaultView: 'grid' | 'list' | 'cards';
	gridColumns: 2 | 3 | 4;
	cardSize: 'small' | 'medium' | 'large';
}

/**
 * Estado UI del store de Profile
 */
export interface ProfileUIState {
	viewConfig: ProfileViewConfig;
	selectedProfileId: string | null;
	hoveredProfileId: string | null;
	expandedProfileIds: string[];
}

/**
 * Estado de filtros del store de Profile
 */
export interface ProfileFiltersState {
	activeFilters: string[];
	searchTerm: string;
	defaultSortOption: string;
	currentSortOption: string;
	groupBy: 'none' | 'theme' | 'language' | 'status';
}

/**
 * Estado completo del store de Profile
 */
export type ProfileStoreState = ProfileState & ProfileUIState & ProfileFiltersState;
