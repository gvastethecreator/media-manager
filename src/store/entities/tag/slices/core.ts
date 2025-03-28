/**
 * @file Slice del core para operaciones CRUD del store de Tag
 * @module store/entities/tag/slices/core
 */

import { extendTag, extendTags } from '@/transformers/tag';
import type { Tag } from '@/types/entities/tag';
import type { StateCreator } from 'zustand';
import type { TagCoreState, TagState } from '../types';

export interface TagCoreSlice {
	// Estado
	core: TagCoreState;

	// Acciones
	fetchTags: () => Promise<void>;
	fetchTagById: (id: string) => Promise<Tag | null>;
	createTag: (tag: Partial<Tag>) => Promise<Tag | null>;
	updateTag: (id: string, data: Partial<Tag>) => Promise<Tag | null>;
	deleteTag: (id: string) => Promise<boolean>;

	// Acciones locales
	addTag: (tag: Tag) => void;
	addTags: (tags: Tag[]) => void;
	updateTagLocally: (id: string, data: Partial<Tag>) => void;
	removeTag: (id: string) => void;
	setTagsLoading: (isLoading: boolean) => void;
	setTagsError: (error: string | null) => void;
	resetTags: () => void;
}

export const createTagCoreSlice: StateCreator<TagState & TagCoreSlice, [], [], TagCoreSlice> = (set, get) => ({
	core: {
		tags: {},
		isLoading: false,
		error: null,
		lastUpdated: null,
	},

	// Acción para obtener todas las etiquetas
	fetchTags: async () => {
		const { setTagsLoading, setTagsError, addTags } = get();

		try {
			setTagsLoading(true);
			setTagsError(null);

			// Realizar solicitud al servidor
			const response = await fetch('/api/tags');

			if (!response.ok) {
				throw new Error(`Error: ${response.status} - ${response.statusText}`);
			}

			const data = await response.json();

			// Extender y añadir etiquetas al store
			const extendedTags = extendTags(data.tags);
			addTags(extendedTags);

			return;
		} catch (error) {
			setTagsError(error instanceof Error ? error.message : String(error));
		} finally {
			setTagsLoading(false);
		}
	},

	// Acción para obtener una etiqueta por su ID
	fetchTagById: async (id) => {
		const { setTagsLoading, setTagsError, addTag } = get();

		try {
			setTagsLoading(true);

			// Comprobar si ya está en el store
			const existingTag = get().core.tags[id];
			if (existingTag) {
				return existingTag;
			}

			// Realizar solicitud al servidor
			const response = await fetch(`/api/tags/${id}`);

			if (!response.ok) {
				throw new Error(`Error: ${response.status} - ${response.statusText}`);
			}

			const data = await response.json();

			// Extender y añadir la etiqueta al store
			const extendedTag = extendTag(data.tag);
			addTag(extendedTag);

			return extendedTag;
		} catch (error) {
			setTagsError(error instanceof Error ? error.message : String(error));
			return null;
		} finally {
			setTagsLoading(false);
		}
	},

	// Acción para crear una etiqueta
	createTag: async (tagData) => {
		const { setTagsLoading, setTagsError, addTag } = get();

		try {
			setTagsLoading(true);

			// Realizar solicitud al servidor
			const response = await fetch('/api/tags', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(tagData),
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status} - ${response.statusText}`);
			}

			const data = await response.json();

			// Extender y añadir la etiqueta al store
			const extendedTag = extendTag(data.tag);
			addTag(extendedTag);

			return extendedTag;
		} catch (error) {
			setTagsError(error instanceof Error ? error.message : String(error));
			return null;
		} finally {
			setTagsLoading(false);
		}
	},

	// Acción para actualizar una etiqueta
	updateTag: async (id, data) => {
		const { setTagsLoading, setTagsError, updateTagLocally } = get();

		try {
			setTagsLoading(true);

			// Realizar solicitud al servidor
			const response = await fetch(`/api/tags/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status} - ${response.statusText}`);
			}

			const responseData = await response.json();

			// Actualizar la etiqueta en el store
			updateTagLocally(id, responseData.tag);

			return get().core.tags[id] || null;
		} catch (error) {
			setTagsError(error instanceof Error ? error.message : String(error));
			return null;
		} finally {
			setTagsLoading(false);
		}
	},

	// Acción para eliminar una etiqueta
	deleteTag: async (id) => {
		const { setTagsLoading, setTagsError, removeTag } = get();

		try {
			setTagsLoading(true);

			// Realizar solicitud al servidor
			const response = await fetch(`/api/tags/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status} - ${response.statusText}`);
			}

			// Eliminar la etiqueta del store
			removeTag(id);

			return true;
		} catch (error) {
			setTagsError(error instanceof Error ? error.message : String(error));
			return false;
		} finally {
			setTagsLoading(false);
		}
	},

	// Acción para añadir una etiqueta al store
	addTag: (tag) => {
		set((state) => ({
			core: {
				...state.core,
				tags: {
					...state.core.tags,
					[tag.id]: tag,
				},
				lastUpdated: new Date(),
			},
		}));
	},

	// Acción para añadir múltiples etiquetas al store
	addTags: (tags) => {
		set((state) => {
			const tagsMap = tags.reduce(
				(acc, tag) => {
					acc[tag.id] = tag;
					return acc;
				},
				{ ...state.core.tags }
			);

			return {
				core: {
					...state.core,
					tags: tagsMap,
					lastUpdated: new Date(),
				},
			};
		});
	},

	// Acción para actualizar una etiqueta localmente en el store
	updateTagLocally: (id, data) => {
		set((state) => {
			const tag = state.core.tags[id];
			if (!tag) return state;

			return {
				core: {
					...state.core,
					tags: {
						...state.core.tags,
						[id]: {
							...tag,
							...data,
						},
					},
					lastUpdated: new Date(),
				},
			};
		});
	},

	// Acción para eliminar una etiqueta del store
	removeTag: (id) => {
		set((state) => {
			const { [id]: removedTag, ...remainingTags } = state.core.tags;

			return {
				core: {
					...state.core,
					tags: remainingTags,
					lastUpdated: new Date(),
				},
			};
		});
	},

	// Acción para establecer el estado de carga
	setTagsLoading: (isLoading) => {
		set((state) => ({
			core: {
				...state.core,
				isLoading,
			},
		}));
	},

	// Acción para establecer un error
	setTagsError: (error) => {
		set((state) => ({
			core: {
				...state.core,
				error,
			},
		}));
	},

	// Acción para resetear el store
	resetTags: () => {
		set((state) => ({
			core: {
				tags: {},
				isLoading: false,
				error: null,
				lastUpdated: null,
			},
		}));
	},
});
