/**
 * @file Core slice para el store de Tag
 * @module store/entities/tag/slices/core.slice
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { transformTag } from '@/transformers/tag';
import type { Tag } from '@/types/entities/tag/types';
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

	// Carga de tags
	loadTags: async () => {
		// Verificar si ya están cargados o cargándose
		if (get().isLoading || get().items.length > 0) {
			logger.info('ℹ️ Tags ya cargados o cargándose, omitiendo nueva carga');
			return get().items;
		}

		try {
			set({ isLoading: true, error: null });
			logger.info('🔄 Cargando tags...');

			// Estrategia 1: Usar server action (preferida)
			try {
				const { searchTags } = await import('@/transformers/tag');
				const result = await searchTags({ take: 100 });

				if (result && Array.isArray(result.items)) {
					set({
						items: result.items,
						isLoading: false,
						lastUpdated: Date.now(),
					});
					logger.info('✅ Tags cargados con transformer:', result.items.length);
					return result.items;
				}
			} catch (transformerError) {
				logger.warn('⚠️ Error con transformer, intentando API:', transformerError);
			}

			// Estrategia 2: Usar API
			try {
				const response = await fetch('/api/entities/tags');

				if (!response.ok) {
					throw new Error(`Error al cargar tags: ${response.status}`);
				}

				const data = await response.json();
				const tags = Array.isArray(data) ? data.map(transformTag) : [];

				set({
					items: tags,
					isLoading: false,
					lastUpdated: Date.now(),
				});

				logger.info('✅ Tags cargados vía API:', tags.length);
				return tags;
			} catch (apiError) {
				logger.error('❌ Error con API:', apiError);
				throw apiError;
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error('❌ Error final al cargar tags:', error);
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
	createTag: async (data: Partial<Tag>) => {
		try {
			set({ isLoading: true, error: null });
			logger.info('➕ Creando tag:', data);

			// Estrategia 1: Usar transformer
			try {
				const { createTag } = await import('@/transformers/tag');
				const newTag = await createTag(data);

				set((state) => ({
					items: [...state.items, newTag],
					isLoading: false,
					lastUpdated: Date.now(),
				}));

				logger.info('✅ Tag creado correctamente:', newTag.id);
				toastService.system.success('Tag creado correctamente');
				return newTag;
			} catch (transformerError) {
				logger.warn('⚠️ Error con transformer, intentando API:', transformerError);
			}

			// Estrategia 2: Usar API
			const response = await fetch('/api/entities/tags', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(`Error al crear tag: ${response.status}`);
			}

			const newTag = transformTag(await response.json());

			set((state) => ({
				items: [...state.items, newTag],
				isLoading: false,
				lastUpdated: Date.now(),
			}));

			logger.info('✅ Tag creado correctamente vía API:', newTag.id);
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
	updateTag: async (id: string, data: Partial<Tag>) => {
		try {
			set({ isLoading: true, error: null });
			logger.info('🔄 Actualizando tag:', { id, data });

			// Estrategia 1: Usar transformer
			try {
				const { updateTag } = await import('@/transformers/tag');
				const updatedTag = await updateTag(id, data);

				set((state) => ({
					items: state.items.map((tag) => (tag.id === id ? updatedTag : tag)),
					isLoading: false,
					lastUpdated: Date.now(),
				}));

				logger.info('✅ Tag actualizado correctamente:', id);
				toastService.system.success('Tag actualizado correctamente');
				return;
			} catch (transformerError) {
				logger.warn('⚠️ Error con transformer, intentando API:', transformerError);
			}

			// Estrategia 2: Usar API
			const response = await fetch(`/api/entities/tags/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(`Error al actualizar tag: ${response.status}`);
			}

			const updatedTag = transformTag(await response.json());

			set((state) => ({
				items: state.items.map((tag) => (tag.id === id ? updatedTag : tag)),
				isLoading: false,
				lastUpdated: Date.now(),
			}));

			logger.info('✅ Tag actualizado correctamente vía API:', id);
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

			// Estrategia 1: Usar transformer
			try {
				const { deleteTag } = await import('@/transformers/tag');
				await deleteTag(id);

				set((state) => ({
					items: state.items.filter((tag) => tag.id !== id),
					isLoading: false,
					lastUpdated: Date.now(),
				}));

				logger.info('✅ Tag eliminado correctamente:', id);
				toastService.system.success('Tag eliminado correctamente');
				return;
			} catch (transformerError) {
				logger.warn('⚠️ Error con transformer, intentando API:', transformerError);
			}

			// Estrategia 2: Usar API
			const response = await fetch(`/api/entities/tags/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`Error al eliminar tag: ${response.status}`);
			}

			set((state) => ({
				items: state.items.filter((tag) => tag.id !== id),
				isLoading: false,
				lastUpdated: Date.now(),
			}));

			logger.info('✅ Tag eliminado correctamente vía API:', id);
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
