/**
 * @file Tipos para el store de la entidad Tag.
 * @module store/entities/tag/types
 * @description Define la forma del estado y las acciones para el store de Tag.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import type { TagSortCriteria } from '@/types/entities/tag';
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag/base';

// --- ENUMS ESPECÍFICOS DEL STORE ---

/**
 * Categorías de etiquetas
 */
export enum TagCategory {
	GENERAL = 'general',
	SUBJECT = 'subject',
	STYLE = 'style',
	COLOR = 'color',
	QUALITY = 'quality',
	TECHNIQUE = 'technique',
	COMPOSITION = 'composition',
	CONTENT = 'content',
	EMOTION = 'emotion',
	THEME = 'theme',
	GENRE = 'genre',
	CUSTOM = 'custom',
	OTHER = 'other',
}

/**
 * Rareza de etiquetas
 */
export enum TagRarity {
	COMMON = 'common',
	UNCOMMON = 'uncommon',
	RARE = 'rare',
	VERY_RARE = 'very_rare',
	LEGENDARY = 'legendary',
}

// TagSortCriteria se importa desde @/types/entities/tag

/**
 * Modos de visualización para etiquetas
 */
export enum TagViewMode {
	GRID = 'grid',
	LIST = 'list',
	CLOUD = 'cloud',
	HIERARCHY = 'hierarchy',
}

/**
 * 🎨 Estado de UI para tags
 */
export interface TagUIState {
	/** ID del tag actualmente seleccionado */
	selectedId: string | null;
	/** IDs de tags seleccionados (modo multi-selección) */
	selectedIds: string[];
	/** IDs de tags expandidos en vista de árbol */
	expandedIds: string[];
	/** ID del tag en modo de edición */
	editingId: string | null;
	/** ID del tag destacado/hover */
	highlightedId: string | null;
	/** Modo de visualización actual */
	viewMode: TagViewMode;
	/** Si se está mostrando el modal de crear tag */
	isCreateModalOpen: boolean;
	/** Si se está mostrando el modal de editar tag */
	isEditModalOpen: boolean;
	/** Si se está mostrando el modal de confirmación de eliminación */
	isDeleteModalOpen: boolean;
}

/**
 * 🔍 Filtros para tags
 */
export interface TagFilters {
	/** Criterio de ordenación */
	sortBy: TagSortCriteria;
	/** Término de búsqueda */
	searchTerm: string;
	/** Filtro por categoría */
	category: TagCategory | null;
	/** Filtro por rareza - @deprecated La rareza no es una propiedad del modelo de datos actual. */
	rarity?: string | null;
}

/**
 * 📊 Estado principal (core) del store de Tag - Patrón Record optimizado
 */
export interface TagCoreState {
	/** Tags organizados por ID para acceso O(1) */
	tags: Record<string, TagWithStats>;
	/** Si se están cargando datos */
	isLoading: boolean;
	/** Mensaje de error si existe */
	error: string | null;
	/** Timestamp de última actualización */
	lastUpdated: number | null;
}

/**
 * 🔄 Acciones del core slice
 */
export interface TagCoreActions {
	/** Carga todos los tags */
	loadTags: () => Promise<TagWithStats[]>;
	/** Obtiene todos los tags como array */
	getTags: () => TagWithStats[];
	/** Obtiene un tag por su ID */
	getTagById: (id: string) => TagWithStats | undefined;
	/** Crea un nuevo tag */
	createTag: (data: TagCreateInput) => Promise<TagWithStats | null>;
	/** Actualiza un tag existente */
	updateTag: (id: string, data: TagUpdateInput) => Promise<void>;
	/** Elimina un tag */
	deleteTag: (id: string) => Promise<void>;
	/** Actualiza múltiples tags */
	setTags: (tags: TagWithStats[]) => void;
	/** Recarga los tags forzando una nueva petición */
	refreshTags: () => Promise<TagWithStats[]>;
}

/**
 * 🎯 Acciones del UI slice
 */
export interface TagUIActions {
	/** Selecciona un tag */
	selectTag: (id: string | null) => void;
	/** Selecciona múltiples tags */
	selectTags: (ids: string[]) => void;
	/** Limpia la selección */
	clearSelection: () => void;
	/** Inicia edición de un tag */
	startEditing: (id: string | null) => void;
	/** Resalta un tag (hover) */
	highlightTag: (id: string | null) => void;
	/** Cambia el modo de visualización */
	setViewMode: (mode: TagViewMode) => void;
	/** Abre el modal de crear tag */
	openCreateModal: () => void;
	/** Cierra el modal de crear tag */
	closeCreateModal: () => void;
	/** Abre el modal de editar tag */
	openEditModal: (id: string) => void;
	/** Cierra el modal de editar tag */
	closeEditModal: () => void;
	/** Abre el modal de confirmación de eliminación */
	openDeleteModal: (id: string) => void;
	/** Cierra el modal de confirmación de eliminación */
	closeDeleteModal: () => void;
}

/**
 * 🔍 Acciones del filter slice
 */
export interface TagFilterActions {
	/** Actualiza los filtros */
	updateFilters: (filters: Partial<TagFilters>) => void;
	/** Limpia todos los filtros */
	clearFilters: () => void;
	/** Obtiene tags filtrados */
	getFilteredTags: () => TagWithStats[];
	/** Obtiene tags filtrados y ordenados */
	getSortedTags: () => TagWithStats[];
}

/**
 * 📦 Tipo del store completo de Tag
 */
export interface TagStore extends TagCoreState, TagCoreActions, TagUIState, TagUIActions, TagFilterActions {
	/** Filtros actuales */
	filters: TagFilters;
}
