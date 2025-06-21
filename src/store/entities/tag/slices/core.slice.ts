/**
 * @file Core slice para el store de Tag
 * @module store/entities/tag/slices/core.slice
 */

import { createTagAction, deleteTagAction, updateTagAction } from '@/app/actions/tags/crud.actions';
import { getTags as getTagsAction } from '@/app/actions/tags/query.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import type { TagWithStats } from '@/types/entities/tag/types';
import { StateCreator } from 'zustand';
import type { TagCoreActions, TagCoreState, TagStore } from '../types';

const logger = clientLogger.withContext('TagCoreSlice');

/**
 * 📦 Creador del slice core para el store de Tag
 */
export const createTagCoreSlice: StateCreator<TagStore, [], [], TagCoreState & TagCoreActions> = (set, get) => ({
	// Estado inicial
	items: [],
	isLoading: false,
	error: null,
	lastUpdated: null,

	// Obtiene todos los tags
	getTags: () => {
		return get().items;
	},

	// Carga de tags
	loadTags: async () => {
		if (get().isLoading) {
			logger.info('ℹ️ Tags ya cargándose, omitiendo nueva carga');
			return get().items;
		}

		try {
			set({ isLoading: true, error: null });
			logger.info('🔄 Cargando tags...');

			const tags = await getTagsAction();

			set({
				items: tags,
				isLoading: false,
				lastUpdated: Date.now(),
			});

			logger.info('✅ Tags cargados:', tags.length);
			return tags;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error('❌ Error al cargar tags:', error);
			set({ error: errorMessage, isLoading: false });
			toastService.system.error('Error al cargar tags');
			return [];
		}
	},

	// Vuelve a cargar los tags forzando una nueva petición
	refreshTags: async () => {
		set({ items: [], isLoading: true, error: null });
		return get().loadTags();
	},

	// Crea un nuevo tag
	createTag: async (data: Partial<TagWithStats>) => {
		try {
			set({ isLoading: true, error: null });
			logger.info('➕ Creando tag:', data);

			// Asegurarse de que data no contiene campos extra no válidos para la creación
			const createData = { name: data.name, ...data }; // Simplificado, idealmente usar un mapper
			const newTag = await createTagAction(createData);

			set((state) => ({
				items: [...state.items, newTag],
				isLoading: false,
				lastUpdated: Date.now(),
			}));

			logger.info('✅ Tag creado correctamente:', newTag.id);
			toastService.system.success('Tag creado correctamente');
			return newTag;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error('❌ Error al crear tag:', error);
			set({ error: errorMessage, isLoading: false });
			toastService.system.error('Error al crear tag');
			return null;
		}
	},

	// Actualiza un tag existente
	updateTag: async (id: string, data: Partial<TagWithStats>) => {
		try {
			set({ isLoading: true, error: null });
			logger.info('🔄 Actualizando tag:', { id, data });

			const updatedTag = await updateTagAction(id, data);

			set((state) => ({
				items: state.items.map((tag) => (tag.id === id ? { ...tag, ...updatedTag } : tag)),
				isLoading: false,
				lastUpdated: Date.now(),
			}));

			logger.info('✅ Tag actualizado correctamente:', id);
			toastService.system.success('Tag actualizado correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error('❌ Error al actualizar tag:', error);
			set({ error: errorMessage, isLoading: false });
			toastService.system.error('Error al actualizar tag');
		}
	},

	// Elimina un tag
	deleteTag: async (id: string) => {
		try {
			set({ isLoading: true, error: null });
			logger.info('🗑️ Eliminando tag:', id);

			await deleteTagAction(id);

			set((state) => ({
				items: state.items.filter((tag) => tag.id !== id),
				isLoading: false,
				lastUpdated: Date.now(),
			}));

			logger.info('✅ Tag eliminado correctamente:', id);
			toastService.system.success('Tag eliminado correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error('❌ Error al eliminar tag:', error);
			set({ error: errorMessage, isLoading: false });
			toastService.system.error('Error al eliminar tag');
		}
	},

	// Obtiene un tag por su ID
	getTagById: (id: string) => {
		return get().items.find((tag) => tag.id === id);
	},
});
