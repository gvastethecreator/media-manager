/**
 * @file Enums y constantes principales para la entidad Wildcard
 * @module types/entities/wildcard/types
 */

import type { WildcardWithStats } from './base';

export enum WildcardSortCriteria {
	NAME = 'name',
	DATE = 'date',
	CATEGORY = 'category',
}

export enum WildcardViewMode {
	GRID = 'grid',
	LIST = 'list',
	DETAIL = 'detail',
}

export const WILDCARD_SORT_PROPERTY_MAP = {
	name: 'Nombre',
	date: 'Fecha',
	category: 'Categoría',
};

// --- 💀 Tipos Legacy (Compatibilidad Temporal) ---
// @deprecated - Usar WildcardWithStats en su lugar
export type WildcardComplete = WildcardWithStats;

// @deprecated - Definir filtros con Zod schemas
export interface WildcardSearchOptions {
	query?: string;
	category?: string;
	sortBy?: WildcardSortCriteria;
	sortOrder?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
	page?: number;
	searchQuery?: string;
	filters?: WildcardSearchFilters;
	includeStats?: boolean;
	includeImages?: boolean;
	includeVideos?: boolean;
	includeAlbums?: boolean;
	includeCollections?: boolean;
	includeCharacters?: boolean;
	includePlaces?: boolean;
	includeWorldItems?: boolean;
	includeConcepts?: boolean;
	includeNotes?: boolean;
	includeWildcards?: boolean;
	includeGroups?: boolean;
	includePrompts?: boolean;
}

// @deprecated - Usar propiedades directas de WildcardWithStats
export interface WildcardChild {
	id: string;
	name: string;
	description?: string;
	category?: string;
}

// @deprecated - Usar WildcardCreateInput/UpdateInput
export interface CreateWildcardData {
	id?: string;
	name: string;
	description?: string;
	category?: string;
	emoji?: string;
	color?: string;
	shortcut?: string;
	parentId?: string;
	isFavorite?: boolean;
	featuredImage?: string;
	tags?: string[];
	properties?: Record<string, unknown>;
	children?: string;
}

export interface UpdateWildcardData extends Partial<CreateWildcardData> {
	id: string;
}

export interface WildcardBulkUpdateData {
	ids: string[];
	data: Partial<Omit<CreateWildcardData, 'name' | 'id'>>;
}

export interface WildcardRelated {
	id?: string;
	name?: string;
	properties: Array<{ id: string; name: string }>;
	tags: Array<{ id: string; name: string }>;
}

export interface WildcardSearchFilters {
	searchQuery?: string;
	category?: string;
	tags?: string[];
}

// @deprecated - Usar WildcardWithStats base + relaciones
export interface WildcardDeserialized {
	id: string;
	name: string;
	description?: string | null;
	category?: string | null;
	properties: Array<{ id: string; name: string; value?: unknown }>;
	children: Array<{ id: string; name: string }>;
	tags: Array<{ id: string; name: string }>;
	createdAt: Date;
	updatedAt: Date;
}
