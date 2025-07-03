/**
 * @file Definición de tipos para el store de Property
 * @module store/entities/property/types
 * @description Tipos refactorizados siguiendo el patrón de slices.
 */

import type { Prisma } from '@prisma/client';
import type { PropertyWithStats } from '@/types/entities/property';

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
	properties: Record<string, PropertyWithStats>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

/**
 * 🔄 Acciones del core slice
 */
export interface PropertyCoreActions {
	loadProperties: () => Promise<PropertyWithStats[]>;
	createProperty: (data: Prisma.PropertyCreateInput) => Promise<PropertyWithStats | null>;
	updateProperty: (id: string, data: Prisma.PropertyUpdateInput) => Promise<void>;
	deleteProperty: (id: string) => Promise<void>;
	setProperties: (properties: PropertyWithStats[]) => void;
}

/**
 * 🎨 Estado de UI para propiedades
 */
export interface PropertyUIState {
	selectedId: string | null;
	editingId: string | null;
	highlightedId: string | null;
	viewMode: PropertyViewMode;
	isCreateModalOpen: boolean;
	isEditModalOpen: boolean;
	isDeleteModalOpen: boolean;
}

/**
 * 🎯 Acciones del UI slice
 */
export interface PropertyUIActions {
	selectProperty: (id: string | null) => void;
	startEditing: (id: string | null) => void;
	highlightProperty: (id: string | null) => void;
	setViewMode: (mode: PropertyViewMode) => void;
	openCreateModal: () => void;
	closeCreateModal: () => void;
	openEditModal: (id: string) => void;
	closeEditModal: () => void;
	openDeleteModal: (id: string) => void;
	closeDeleteModal: () => void;
}

/**
 * 🔍 Filtros para propiedades
 */
export interface PropertyFilters {
	sortBy: PropertySortCriteria;
	searchTerm: string;
	category: string | null;
	onlyFavorites: boolean;
}

/**
 * 🔍 Acciones del filter slice
 */
export interface PropertyFilterActions {
	updateFilters: (filters: Partial<PropertyFilters>) => void;
	clearFilters: () => void;
}

/**
 * 📦 Tipo del store completo de Property
 */
export interface PropertyStore
	extends PropertyCoreState,
		PropertyCoreActions,
		PropertyUIState,
		PropertyUIActions,
		PropertyFilterActions {
	filters: PropertyFilters;
}
