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
	activeProfileError: string | null;
	currentPage: number;

	// Estado de filtros y paginación
	filters: ProfileFilters;
	isLoadingActive: boolean;
	isLoadingProfiles: boolean;
	pagination: ProfilePaginationOptions;

	// Estado de la lista de perfiles
	profiles: ProfileExtended[];
	profilesError: string | null;
	totalProfiles: number;
}

/**
 * Configuración de vista para perfiles
 */
export interface ProfileViewConfig {
	cardSize: 'small' | 'medium' | 'large';
	defaultView: 'grid' | 'list' | 'cards';
	gridColumns: 2 | 3 | 4;
	mode: 'grid' | 'list' | 'cards';
	showDescription: boolean;
	showStats: boolean;
}

/**
 * Estado UI del store de Profile
 */
export interface ProfileUIState {
	expandedProfileIds: string[];
	hoveredProfileId: string | null;
	selectedProfileId: string | null;
	viewConfig: ProfileViewConfig;
}

/**
 * Estado de filtros del store de Profile
 */
export interface ProfileFiltersState {
	activeFilters: string[];
	currentSortOption: string;
	defaultSortOption: string;
	groupBy: 'none' | 'theme' | 'language' | 'status';
	searchTerm: string;
}

/**
 * Estado completo del store de Profile
 */
export type ProfileStoreState = ProfileState & ProfileUIState & ProfileFiltersState;
