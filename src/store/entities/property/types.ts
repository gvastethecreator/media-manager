/**
 * @file Definición de tipos para el store de Property
 * @module store/entities/property/types
 * @description Tipos refactorizados siguiendo el patrón de slices.
 * @updated 2025-01-27 - Migrado a tipos locales sin Prisma
 */

import type { PropertyCreateInput, PropertyUpdateInput, PropertyWithStats } from '@/types/entities/property';

// --- ENUMS ESPECÍFICOS DEL STORE ---

/**
 * Criterios de ordenación para propiedades
 */
export enum PropertySortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	USAGE_ASC = 'usage:asc',
	USAGE_DESC = 'usage:desc',
	CREATED_ASC = 'createdAt:asc',
	CREATED_DESC = 'createdAt:desc',
	UPDATED_ASC = 'updatedAt:asc',
	UPDATED_DESC = 'updatedAt:desc',
}

/**
 * Modos de visualización para propiedades
 */
export enum PropertyViewMode {
	GRID = 'grid',
	LIST = 'list',
}

// --- Interfaces de Estado y Acciones por Slice ---

/**
 * 📊 Estado principal (core) del store de Property
 */
export interface PropertyCoreState {
	error: string | null;
	isLoading: boolean;
	lastUpdated: number | null;
	properties: Record<string, PropertyWithStats>;
}

/**
 * 🔄 Acciones del core slice
 */
export interface PropertyCoreActions {
	createProperty: (data: PropertyCreateInput) => Promise<PropertyWithStats | null>;
	deleteProperty: (id: string) => Promise<void>;
	loadProperties: () => Promise<PropertyWithStats[]>;
	setProperties: (properties: PropertyWithStats[]) => void;
	updateProperty: (id: string, data: PropertyUpdateInput) => Promise<void>;
}

/**
 * 🎨 Estado de UI para propiedades
 */
export interface PropertyUIState {
	editingId: string | null;
	highlightedId: string | null;
	isCreateModalOpen: boolean;
	isDeleteModalOpen: boolean;
	isEditModalOpen: boolean;
	selectedId: string | null;
	viewMode: PropertyViewMode;
}

/**
 * 🎯 Acciones del UI slice
 */
export interface PropertyUIActions {
	closeCreateModal: () => void;
	closeDeleteModal: () => void;
	closeEditModal: () => void;
	highlightProperty: (id: string | null) => void;
	openCreateModal: () => void;
	openDeleteModal: (id: string) => void;
	openEditModal: (id: string) => void;
	selectProperty: (id: string | null) => void;
	setViewMode: (mode: PropertyViewMode) => void;
	startEditing: (id: string | null) => void;
}

/**
 * 🔍 Filtros para propiedades
 */
export interface PropertyFilters {
	category: string | null;
	onlyFavorites: boolean;
	searchTerm: string;
	sortBy: PropertySortCriteria;
}

/**
 * 🔍 Acciones del filter slice
 */
export interface PropertyFilterActions {
	clearFilters: () => void;
	updateFilters: (filters: Partial<PropertyFilters>) => void;
}

/**
 * 📦 Tipo del store completo de Property
 */
export interface PropertyStore
	extends PropertyCoreState, PropertyCoreActions, PropertyUIState, PropertyUIActions, PropertyFilterActions {
	filters: PropertyFilters;
}
