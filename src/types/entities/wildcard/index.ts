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
	WildcardComplete,
	WildcardCreateInput,
	WildcardPreview,
	WildcardStatistics,
	WildcardUpdateInput,
	WildcardWithCounts,
	WildcardWithStats,
} from './base';

// --- 🎨 Enums y Constantes ---
export {
	WILDCARD_SORT_PROPERTY_MAP,
	WildcardSortCriteria,
	WildcardViewMode,
} from './types';

// --- 🔄 Aliases for compatibility ---
// WildcardComplete is now exported from base.ts

// --- 🔍 Filter types ---
export interface WildcardFilters {
	categories?: string[]; // Plural para compatibilidad
	category?: string | string[];
	createdAfter?: Date;
	createdBefore?: Date;
	excludeIds?: string[];
	hasChildren?: boolean;
	ids?: string[];
	isFavorite?: boolean;
	limit?: number;
	offset?: number;
	onlyFavorites?: boolean;
	parentId?: string;
	search?: string;
	searchQuery?: string; // Alias para compatibilidad
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	tags?: string[];
	type?: string | string[];
	updatedAfter?: Date;
	updatedBefore?: Date;
}

// --- 📝 Data types for mappers ---
export interface CreateWildcardData {
	category?: string | null;
	children?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	id: string;
	isFavorite?: boolean;
	name: string;
	parentId?: string | null;
	shortcut?: string | null;
}

export interface UpdateWildcardData {
	category?: string | null;
	children?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	name?: string;
	parentId?: string | null;
	shortcut?: string | null;
}

export interface WildcardBulkUpdateData {
	category?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

export interface WildcardRelated {
	category: string | null;
	color: string | null;
	emoji: string | null;
	id: string;
	isFavorite: boolean;
	name: string;
	parentId: string | null;
}

export interface WildcardSearchOptions {
	filters?: WildcardFilters;
	includeAlbums?: boolean;
	includeImages?: boolean;
	includeParent?: boolean;
	includeStats?: boolean;
	includeTags?: boolean;
	includeVideos?: boolean;
	limit?: number;
	page?: number;
	searchQuery?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

// Alias para compatibilidad con código existente
export type WildcardSearchFilters = WildcardFilters;

// --- 📊 Response types ---
export interface WildcardResponse {
	data: WildcardWithStats[];
	page: number;
	success: boolean;
	total: number;
	totalPages: number;
}
