/**
 * @file Core slice para el store de Tag
 * @module store/entities/tag/slices/core.slice
 */

import {
    createTag as createTagAction,
    deleteTag as deleteTagAction,
    updateTag as updateTagAction
} from '@/app/actions/tags/crud.actions';
import { getTags as getTagsAction } from '@/app/actions/tags/query.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import type { TagWithStats } from '@/types/entities/tag';
import type { Prisma } from '@prisma/client';
import { StateCreator } from 'zustand';
import type { TagCoreActions, TagCoreState, TagStore } from '../types';

const logger = clientLogger.withContext('TagCoreSlice');

/**
 * 🔄 Convierte array de tags a Record para acceso O(1)
 * @param tags - Array de tags
 * @returns Record de tags indexado por ID
 */
const tagsToRecord = (tags: TagWithStats[]): Record<string, TagWithStats> => {
	return tags.reduce((acc, tag) => {
		acc[tag.id] = tag;
		return acc;
	}, {} as Record<string, TagWithStats>);
};

/**
 * 📦 Creador del slice core para el store de Tag
 */
export const createTagCoreSlice: StateCreator<TagStore, [], [], TagCoreState & TagCoreActions> = (set, get) => ({
	// Estado inicial - Patrón Record optimizado
	tags: {},
	isLoading: false,
	error: null,
	lastUpdated: null,

	// 📋 Obtiene todos los tags como array
	getTags: () => {
		return Object.values(get().tags);
	},

	// 🔍 Obtiene un tag por su ID - Acceso O(1)
	getTagById: (id: string) => {
		return get().tags[id];
	},

	// 🔄 Actualiza múltiples tags
	setTags: (tags: TagWithStats[]) => {
		set({
			tags: tagsToRecord(tags),
			lastUpdated: Date.now(),
		});
	},

	// 📥 Carga de tags
	loadTags: async () => {
		if (get().isLoading) {
			logger.info('ℹ️ Tags ya cargándose, omitiendo nueva carga');
			return get().getTags();
		}

		try {
			set({ isLoading: true, error: null });
			logger.info('🔄 Cargando tags...');

			const tags = await getTagsAction();

			set({
				tags: tagsToRecord(tags),
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

	// 🔄 Vuelve a cargar los tags forzando una nueva petición
	refreshTags: async () => {
		set({ tags: {}, isLoading: true, error: null });
		return get().loadTags();
	},

	// ➕ Crea un nuevo tag
	createTag: async (data: Prisma.TagCreateInput) => {
		try {
			set({ isLoading: true, error: null });
			logger.info('➕ Creando tag:', data);

			const newTag = await createTagAction(data);

			if (!newTag) {
				throw new Error('La acción del servidor no devolvió una etiqueta creada.');
			}

			set((state) => ({
				tags: {
					...state.tags,
					[newTag.id]: newTag,
				},
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

	// 🔄 Actualiza un tag existente
	updateTag: async (id: string, data: Prisma.TagUpdateInput) => {
		try {
			set({ isLoading: true, error: null });
			logger.info('🔄 Actualizando tag:', { id, data });

			const updatedTag = await updateTagAction(id, data);

			set((state) => ({
				tags: {
					...state.tags,
					[id]: updatedTag,
				},
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

	// 🗑️ Elimina un tag
	deleteTag: async (id: string) => {
		try {
			set({ isLoading: true, error: null });
			logger.info('🗑️ Eliminando tag:', id);

			await deleteTagAction(id);

			set((state) => {
				const { [id]: deletedTag, ...remainingTags } = state.tags;
				return {
					tags: remainingTags,
					isLoading: false,
					lastUpdated: Date.now(),
				};
			});

			logger.info('✅ Tag eliminado correctamente:', id);
			toastService.system.success('Tag eliminado correctamente');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error('❌ Error al eliminar tag:', error);
			set({ error: errorMessage, isLoading: false });
			toastService.system.error('Error al eliminar tag');
		}
	},
});
