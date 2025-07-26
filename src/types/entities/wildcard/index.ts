/**
 * @file Exportaciones de tipos para la entidad Wildcard.
 * @module types/entities/wildcard
 * @description Centraliza la exportación de tipos canónicos, esquemas de validación y
 *              tipos legacy para una migración progresiva.
 */

import { WildcardWithStats } from './base';

// --- 🏗️ Tipos Base y Estadísticas (Nuevo Patrón) ---
// Tipos canónicos que deben usarse en toda la aplicación nueva.
export type {
	WildcardBase,
	WildcardCreateInput,
	WildcardPreview,
	WildcardStatistics,
	WildcardUpdateInput,
	WildcardWithStats,
} from './base';

// --- 🎨 Enums y Constantes ---
export {
	WILDCARD_SORT_PROPERTY_MAP,
	WildcardSortCriteria,
	WildcardViewMode,
} from './types';

// --- 🔄 Aliases for compatibility ---
export type WildcardComplete = WildcardWithStats;

// --- 🔍 Filter types ---
export interface WildcardFilters {
	search?: string;
	searchQuery?: string; // Alias para compatibilidad
	category?: string | string[];
	categories?: string[]; // Plural para compatibilidad
	type?: string | string[];
	onlyFavorites?: boolean;
	tags?: string[];
	parentId?: string;
	hasChildren?: boolean;
	limit?: number;
	offset?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	isFavorite?: boolean;
	ids?: string[];
	excludeIds?: string[];
	createdAfter?: Date;
	createdBefore?: Date;
	updatedAfter?: Date;
	updatedBefore?: Date;
}

// --- 📝 Data types for mappers ---
export interface CreateWildcardData {
	id: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	shortcut?: string | null;
	children?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

export interface UpdateWildcardData {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	shortcut?: string | null;
	children?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

export interface WildcardBulkUpdateData {
	parentId?: string | null;
	category?: string | null;
	isFavorite?: boolean;
}

export interface WildcardRelated {
	id: string;
	name: string;
	emoji: string | null;
	color: string | null;
	category: string | null;
	parentId: string | null;
	isFavorite: boolean;
}

export interface WildcardSearchOptions {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	searchQuery?: string;
	filters?: WildcardFilters;
	includeStats?: boolean;
	includeImages?: boolean;
	includeVideos?: boolean;
	includeAlbums?: boolean;
	includeTags?: boolean;
	includeParent?: boolean;
}

// Alias para compatibilidad con código existente
export type WildcardSearchFilters = WildcardFilters;

// --- 📊 Response types ---
export interface WildcardResponse {
	success: boolean;
	data: WildcardWithStats[];
	total: number;
	page: number;
	totalPages: number;
}
