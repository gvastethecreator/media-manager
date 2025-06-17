/**
 * @file Definición de tipos para el store de Tag
 * @module store/entities/tag/types
 */

import { TagCategory, TagRarity, TagSortCriteria, TagViewMode } from '@/types/entities/tag/enums';
import type { Tag, TagComplete } from '@/types/entities/tag/types';

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
	/** Filtro por rareza */
	rarity: TagRarity | null;
}

/**
 * 📊 Estado principal (core) del store de Tag
 */
export interface TagCoreState {
	/** Lista de tags */
	items: TagComplete[];
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
	loadTags: () => Promise<TagComplete[]>;
	/** Obtiene todos los tags */
	getTags: () => TagComplete[];
	/** Crea un nuevo tag */
	createTag: (tag: Partial<Tag>) => Promise<TagComplete | null>;
	/** Actualiza un tag existente */
	updateTag: (id: string, tag: Partial<Tag>) => Promise<void>;
	/** Elimina un tag */
	deleteTag: (id: string) => Promise<void>;
	/** Obtiene un tag por su ID */
	getTagById: (id: string) => TagComplete | undefined;
	/** Recarga los tags forzando una nueva petición */
	refreshTags: () => Promise<TagComplete[]>;
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
	getFilteredTags: () => TagComplete[];
	/** Obtiene tags filtrados y ordenados */
	getSortedTags: () => TagComplete[];
}

/**
 * 📦 Tipo del store completo de Tag
 */
export interface TagStore extends TagCoreState, TagCoreActions, TagUIState, TagUIActions, TagFilterActions {
	/** Filtros actuales */
	filters: TagFilters;
}
