/**
 * @file Store principal para la entidad Tag
 * @module store/entities/tag
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { VERSIONING } from '@/lib/constants';
import { serverLogger } from '@/lib/logger/server-logger';
import { toastService } from '@/services/toast.service';

import { TagSortCriteria, TagViewMode } from '@/types/entities/tag/enums';
import type { TagFilters, TagStore } from './types';

const tagLogger = serverLogger.withContext('TagStore');

// 🏗️ Crear el store con persistencia
export const useTagStore = create<TagStore>()(
	persist(
		(set, get) => ({
			// 📊 Estado inicial
			tags: [],
			ui: {
				selectedId: null,
				selectedIds: [],
				expandedIds: [],
				editingId: null,
				highlightedId: null,
				viewMode: TagViewMode.LIST,
			},
			filters: {
				sortBy: TagSortCriteria.NAME_ASC,
				searchTerm: '',
				category: null,
				rarity: null,
			},
			isLoading: false,
			error: null,

			// 🔄 Acciones de carga
			loadTags: async () => {
				try {
					set({ isLoading: true, error: null });
					tagLogger.info('🔄 Cargando tags...');

					const response = await fetch('/api/tags');
					if (!response.ok) throw new Error('Error al cargar tags');

					const tags = await response.json();
					set({ tags, isLoading: false });
					tagLogger.info('✅ Tags cargados correctamente');
				} catch (error) {
					tagLogger.error('❌ Error al cargar tags:', error);
					set({ error: 'Error al cargar tags', isLoading: false });
					toastService.system.error('Error al cargar tags');
				}
			},

			// 🎯 Gestión de tags
			createTag: async (tag) => {
				try {
					tagLogger.info('➕ Creando tag:', tag);
					const response = await fetch('/api/tags', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(tag),
					});

					if (!response.ok) throw new Error('Error al crear tag');

					const newTag = await response.json();
					set((state) => ({ tags: [...state.tags, newTag] }));
					tagLogger.info('✅ Tag creado correctamente');
					toastService.system.success('Tag creado correctamente');
				} catch (error) {
					tagLogger.error('❌ Error al crear tag:', error);
					toastService.system.error('Error al crear tag');
				}
			},

			updateTag: async (id, tag) => {
				try {
					tagLogger.info('🔄 Actualizando tag:', { id, tag });
					const response = await fetch(`/api/tags/${id}`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(tag),
					});

					if (!response.ok) throw new Error('Error al actualizar tag');

					const updatedTag = await response.json();
					set((state) => ({
						tags: state.tags.map((t) => (t.id === id ? updatedTag : t)),
					}));
					tagLogger.info('✅ Tag actualizado correctamente');
					toastService.system.success('Tag actualizado correctamente');
				} catch (error) {
					tagLogger.error('❌ Error al actualizar tag:', error);
					toastService.system.error('Error al actualizar tag');
				}
			},

			deleteTag: async (id) => {
				try {
					tagLogger.info('🗑️ Eliminando tag:', id);
					const response = await fetch(`/api/tags/${id}`, {
						method: 'DELETE',
					});

					if (!response.ok) throw new Error('Error al eliminar tag');

					set((state) => ({
						tags: state.tags.filter((t) => t.id !== id),
					}));
					tagLogger.info('✅ Tag eliminado correctamente');
					toastService.system.success('Tag eliminado correctamente');
				} catch (error) {
					tagLogger.error('❌ Error al eliminar tag:', error);
					toastService.system.error('Error al eliminar tag');
				}
			},

			// 🎯 Acciones de UI
			selectTag: (id) => set((state) => ({ ui: { ...state.ui, selectedId: id } })),
			startEditing: (id) => set((state) => ({ ui: { ...state.ui, editingId: id } })),
			highlightTag: (id) => set((state) => ({ ui: { ...state.ui, highlightedId: id } })),
			setViewMode: (mode) => set((state) => ({ ui: { ...state.ui, viewMode: mode } })),

			// 🔍 Filtros
			updateFilters: (filters) =>
				set((state) => ({ filters: { ...state.filters, ...filters } })),
			clearFilters: () =>
				set({
					filters: {
						sortBy: TagSortCriteria.NAME_ASC,
						searchTerm: '',
						category: null,
						rarity: null,
					} as TagFilters
				}),

			// 🎯 Selectores
			getTagById: (id) => get().tags.find((tag) => tag.id === id),
			getFilteredTags: () => {
				const { tags, filters } = get();
				const { searchTerm, category, rarity } = filters;

				return tags.filter((tag) => {
					const matchesSearch = searchTerm
						? tag.name.toLowerCase().includes(searchTerm.toLowerCase())
						: true;
					const matchesCategory = category
						? (tag as any).category === category
						: true;
					const matchesRarity = rarity
						? (tag as any).rarity === rarity
						: true;

					return matchesSearch && matchesCategory && matchesRarity;
				});
			},
			getSortedTags: () => {
				const { filters } = get();
				const filteredTags = get().getFilteredTags();

				return [...filteredTags].sort((a, b) => {
					switch (filters.sortBy) {
						case TagSortCriteria.NAME_ASC:
							return a.name.localeCompare(b.name);
						case TagSortCriteria.NAME_DESC:
							return b.name.localeCompare(a.name);
						case TagSortCriteria.CREATED_ASC:
						case TagSortCriteria.CREATED_DESC:
							// Adaptar nombres de campos
							const createdAsc = filters.sortBy === TagSortCriteria.CREATED_ASC;
							const dateA = new Date(a.createdAt).getTime();
							const dateB = new Date(b.createdAt).getTime();
							return createdAsc ? dateA - dateB : dateB - dateA;
						case TagSortCriteria.UPDATED_ASC:
						case TagSortCriteria.UPDATED_DESC:
							// Adaptar nombres de campos
							const updatedAsc = filters.sortBy === TagSortCriteria.UPDATED_ASC;
							const updatedA = new Date(a.updatedAt).getTime();
							const updatedB = new Date(b.updatedAt).getTime();
							return updatedAsc ? updatedA - updatedB : updatedB - updatedA;
						default:
							return 0;
					}
				});
			},
		}),
		{
			name: 'tag-store',
			storage: createJSONStorage(() => localStorage),
			version: parseInt(VERSIONING.STORE),
		}
	)
);

// Re-exportar tipos
export * from './types';

