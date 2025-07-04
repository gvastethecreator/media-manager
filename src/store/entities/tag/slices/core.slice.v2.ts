/**
 * @file Core slice para el store de Tag
 * @module store/entities/tag/slices/core.slice
 */

import { clientLogger } from '@/lib/logger/client-logger';
// Refactor 2025-07: se utiliza cliente de API en lugar de tag.service
import {
    createTagInApi,
    deleteTagFromApi,
    getTagsFromApi,
    updateTagInApi,
} from '@/lib/api/client/tag.client';
import { toastService } from '@/lib/ui/toast';
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';
import { StateCreator } from 'zustand';
import type { TagStore } from '../types';

const logger = clientLogger.withContext('TagCoreSlice');

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
 * 🔄 Convierte array de tags a Record para acceso O(1)
 * @param tags - Array de tags
 * @returns Record de tags indexado por ID
 */
const tagsToRecord = (tags: TagWithStats[]): Record<string, TagWithStats> => {
	return tags.reduce(
		(acc, tag) => {
			acc[tag.id] = tag;
			return acc;
		},
		{} as Record<string, TagWithStats>
	);
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

                        const tags = await getTagsFromApi();

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
	createTag: async (data: TagCreateInput) => {
		try {
			set({ isLoading: true, error: null });
			logger.info('➕ Creando tag:', data);

                        const newTag = await createTagInApi(data);

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
	updateTag: async (id: string, data: TagUpdateInput) => {
		try {
			set({ isLoading: true, error: null });
			logger.info('🔄 Actualizando tag:', { id, data });

                        const updatedTag = await updateTagInApi(id, data);

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

                        await deleteTagFromApi(id);

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
