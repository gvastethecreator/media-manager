/**
 * @file Store principal para la entidad Tag
 * @module store/entities/tag
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { VERSIONING } from '@/lib/constants';
import { createTagCoreSlice } from './slices/core.slice';
import { createTagFiltersSlice } from './slices/filters.slice';
import { createTagUISlice } from './slices/ui.slice';
import type { TagStore } from './types';

/**
 * 🏷️ Store para la gestión de tags
 * Implementa un patrón de slices para separar preocupaciones:
 * - Core: Gestión de datos y operaciones CRUD
 * - UI: Estado de la interfaz de usuario
 * - Filters: Filtrado y ordenación
 */
export const useTagStore = create<TagStore>()(
	persist(
		(...args) => ({
			...createTagCoreSlice(...args),
			...createTagUISlice(...args),
			...createTagFiltersSlice(...args),
		}),
		{
			name: 'tag-store',
			storage: createJSONStorage(() => localStorage),
			version: Number.parseInt(VERSIONING.STORE, 10),
			// Solo persistir ciertos elementos del estado
			partialize: (state) => ({
				// Mantener filtros y configuración de UI pero no los datos
				filters: state.filters,
				viewMode: state.viewMode,
				// No persistir el estado de la UI que debe ser transitorio
				selectedId: null,
				selectedIds: [],
				expandedIds: [],
				editingId: null,
				highlightedId: null,
				isCreateModalOpen: false,
				isEditModalOpen: false,
				isDeleteModalOpen: false,
			}),
		}
	)
);

// Re-exportar tipos
export * from './types';
