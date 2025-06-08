/**
 * @file Slice del core para operaciones CRUD del store de Tag
 * @module store/entities/tag/slices/core
 */

import { extendTag, extendTags } from '@/transformers/tag';
import {
       createTagAction,
       deleteTagAction,
       getTagByIdAction,
       getTagsAction,
       updateTagAction,
} from '@/app/actions/tags';
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

                        const result = await getTagsAction();
                        if (result?.items) {
                                addTags(result.items);
                        }
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

                        const existingTag = get().core.tags[id];
                        if (existingTag) {
                                return existingTag;
                        }

                        const tag = await getTagByIdAction(id);
                        if (tag) {
                                addTag(tag);
                        }

                        return tag;
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

                        const newTag = await createTagAction(tagData);
                        if (newTag) {
                                addTag(newTag);
                        }

                        return newTag;
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

                        const updated = await updateTagAction(id, data);
                        if (updated) {
                                updateTagLocally(id, updated);
                        }

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

                        await deleteTagAction(id);

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
