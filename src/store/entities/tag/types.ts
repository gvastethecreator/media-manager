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
	/** ID del tag en modo de edición */
	editingId: string | null;
	/** IDs de tags expandidos en vista de árbol */
	expandedIds: string[];
	/** ID del tag destacado/hover */
	highlightedId: string | null;
	/** Si se está mostrando el modal de crear tag */
	isCreateModalOpen: boolean;
	/** Si se está mostrando el modal de confirmación de eliminación */
	isDeleteModalOpen: boolean;
	/** Si se está mostrando el modal de editar tag */
	isEditModalOpen: boolean;
	/** ID del tag actualmente seleccionado */
	selectedId: string | null;
	/** IDs de tags seleccionados (modo multi-selección) */
	selectedIds: string[];
	/** Modo de visualización actual */
	viewMode: TagViewMode;
}

/**
 * 🔍 Filtros para tags
 */
export interface TagFilters {
	/** Filtro por categoría */
	category: TagCategory | null;
	/** Filtro por rareza - @deprecated La rareza no es una propiedad del modelo de datos actual. */
	rarity?: string | null;
	/** Término de búsqueda */
	searchTerm: string;
	/** Criterio de ordenación */
	sortBy: TagSortCriteria;
}

/**
 * 📊 Estado principal (core) del store de Tag - Patrón Record optimizado
 */
export interface TagCoreState {
	/** Mensaje de error si existe */
	error: string | null;
	/** Si se están cargando datos */
	isLoading: boolean;
	/** Timestamp de última actualización */
	lastUpdated: number | null;
	/** Tags organizados por ID para acceso O(1) */
	tags: Record<string, TagWithStats>;
}

/**
 * 🔄 Acciones del core slice
 */
export interface TagCoreActions {
	/** Crea un nuevo tag */
	createTag: (data: TagCreateInput) => Promise<TagWithStats | null>;
	/** Elimina un tag */
	deleteTag: (id: string) => Promise<void>;
	/** Obtiene un tag por su ID */
	getTagById: (id: string) => TagWithStats | undefined;
	/** Obtiene todos los tags como array */
	getTags: () => TagWithStats[];
	/** Carga todos los tags */
	loadTags: () => Promise<TagWithStats[]>;
	/** Recarga los tags forzando una nueva petición */
	refreshTags: () => Promise<TagWithStats[]>;
	/** Actualiza múltiples tags */
	setTags: (tags: TagWithStats[]) => void;
	/** Actualiza un tag existente */
	updateTag: (id: string, data: TagUpdateInput) => Promise<void>;
}

/**
 * 🎯 Acciones del UI slice
 */
export interface TagUIActions {
	/** Limpia la selección */
	clearSelection: () => void;
	/** Cierra el modal de crear tag */
	closeCreateModal: () => void;
	/** Cierra el modal de confirmación de eliminación */
	closeDeleteModal: () => void;
	/** Cierra el modal de editar tag */
	closeEditModal: () => void;
	/** Resalta un tag (hover) */
	highlightTag: (id: string | null) => void;
	/** Abre el modal de crear tag */
	openCreateModal: () => void;
	/** Abre el modal de confirmación de eliminación */
	openDeleteModal: (id: string) => void;
	/** Abre el modal de editar tag */
	openEditModal: (id: string) => void;
	/** Selecciona un tag */
	selectTag: (id: string | null) => void;
	/** Selecciona múltiples tags */
	selectTags: (ids: string[]) => void;
	/** Cambia el modo de visualización */
	setViewMode: (mode: TagViewMode) => void;
	/** Inicia edición de un tag */
	startEditing: (id: string | null) => void;
}

/**
 * 🔍 Acciones del filter slice
 */
export interface TagFilterActions {
	/** Limpia todos los filtros */
	clearFilters: () => void;
	/** Obtiene tags filtrados */
	getFilteredTags: () => TagWithStats[];
	/** Obtiene tags filtrados y ordenados */
	getSortedTags: () => TagWithStats[];
	/** Actualiza los filtros */
	updateFilters: (filters: Partial<TagFilters>) => void;
}

/**
 * 📦 Tipo del store completo de Tag
 */
export interface TagStore extends TagCoreState, TagCoreActions, TagUIState, TagUIActions, TagFilterActions {
	/** Filtros actuales */
	filters: TagFilters;
}
