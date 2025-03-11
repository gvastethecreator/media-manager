import {
	type Tag,
	type TagCreate,
	type TagUpdate,
	type TagWithStats,
	addTagToImage as addTagToImageAction,
	createTag as createTagAction,
	deleteTag as deleteTagAction,
	getTags,
	updateTag as updateTagAction,
} from '@/app/actions/tags/tag.actions';
import { logger } from '@/lib/logger/logger';
import { create } from 'zustand';

const tagsLogger = logger.withContext('TagsStore');

interface TagsStore {
	tags: TagWithStats[];
	isLoading: boolean;
	error: string | null;
	loadTags: () => Promise<void>;
	createTag: (tag: TagCreate) => Promise<Tag | null>;
	updateTag: (id: string, tag: TagUpdate) => Promise<void>;
	deleteTag: (id: string) => Promise<void>;
	addTagToImage: (imageId: string, tagId: string) => Promise<void>;
}

export const useTagsStore = create<TagsStore>((set, _get) => ({
	tags: [],
	isLoading: false,
	error: null,
	loadTags: async () => {
		try {
			set({ isLoading: true, error: null });
			tagsLogger.info('Cargando etiquetas');
			const tags = await getTags();
			set({ tags, isLoading: false });
			tagsLogger.info('✅ Etiquetas cargadas');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar etiquetas';
			tagsLogger.error('❌ Error al cargar etiquetas:', error);
			set({ error: message, isLoading: false });
		}
	},
	createTag: async (tag) => {
		try {
			set({ isLoading: true, error: null });
			tagsLogger.info('✨ Creando etiqueta:', tag);
			const createdTag = await createTagAction(tag);
			const tags = await getTags();
			set({ tags, isLoading: false });
			tagsLogger.info('✅ Etiqueta creada', createdTag);
			return createdTag;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear etiqueta';
			tagsLogger.error('❌ Error al crear etiqueta:', error);
			set({ error: message, isLoading: false });
			return null;
		}
	},
	updateTag: async (id, tag) => {
		try {
			set({ isLoading: true, error: null });
			tagsLogger.info('💾 Actualizando etiqueta:', tag);
			await updateTagAction(id, { ...tag, id });
			const tags = await getTags();
			set({ tags, isLoading: false });
			tagsLogger.info('✅ Etiqueta actualizada');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar etiqueta';
			tagsLogger.error('❌ Error al actualizar etiqueta:', error);
			set({ error: message, isLoading: false });
		}
	},
	deleteTag: async (id) => {
		try {
			set({ isLoading: true, error: null });
			tagsLogger.info('🗑️ Eliminando etiqueta:', id);
			await deleteTagAction(id);
			const tags = await getTags();
			set({ tags, isLoading: false });
			tagsLogger.info('✅ Etiqueta eliminada');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar etiqueta';
			tagsLogger.error('❌ Error al eliminar etiqueta:', error);
			set({ error: message, isLoading: false });
		}
	},
	addTagToImage: async (imageId, tagId) => {
		try {
			set({ isLoading: true, error: null });
			tagsLogger.info('➕ Agregando etiqueta a imagen:', { tagId, imageId });
			await addTagToImageAction(tagId, imageId);
			const tags = await getTags();
			set({ tags, isLoading: false });
			tagsLogger.info('✅ Etiqueta agregada a la imagen');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al agregar etiqueta a la imagen';
			tagsLogger.error('❌ Error al agregar etiqueta a la imagen:', error);
			set({ error: message, isLoading: false });
		}
	},
}));
