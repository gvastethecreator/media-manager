import { createStoreFactory } from './store.factory';
import type { Tag as PrismaTag } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createTag as createTagAction,
  deleteTag as deleteTagAction,
  getTags,
  updateTag as updateTagAction,
  addTagToImage as addTagToImageAction,
  type TagCreate,
  type TagUpdate,
  type TagWithStats
} from '../app/actions/tag.actions';

// Estado extendido específico para Tag
interface TagState {
  filters: {
    searchQuery: string;
    sortBy: 'name' | 'category' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
    category: string[];
  };
}

// Función para formatear bytes a un string legible
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Función para transformar PrismaTag a TagWithStats
function transformToTagWithStats(tag: PrismaTag): TagWithStats {
  return {
    ...tag,
    count: 0, // Por ahora dejamos el contador en 0
    size: formatBytes(0) // Por ahora dejamos el tamaño en 0
  };
}

const useTagStore = createStoreFactory<PrismaTag, TagState, TagCreate, TagUpdate>(
  {
    name: 'tags',
    logger,
    actions: {
      beforeCreate: async (data) => {
        // Validar datos antes de crear
        if (!data.name?.trim()) {
          throw new Error('El nombre es requerido');
        }
        // Normalizar el nombre del tag (lowercase, sin espacios extras)
        data.name = data.name.trim().toLowerCase();
        return data;
      },
      afterCreate: async (tag) => {
        logger.info('Tag creado exitosamente', { tag });
      },
      beforeUpdate: async (id, data) => {
        // Validar datos antes de actualizar
        if (data.name !== undefined) {
          if (!data.name.trim()) {
            throw new Error('El nombre no puede estar vacío');
          }
          // Normalizar el nombre del tag
          data.name = data.name.trim().toLowerCase();
        }
        return data;
      },
      afterUpdate: async (tag) => {
        logger.info('Tag actualizado exitosamente', { tag });
      },
      beforeDelete: async (id) => {
        // Aquí podríamos verificar si el tag tiene imágenes asociadas
        logger.info('Preparando eliminación de tag', { id });
      },
      afterDelete: async (id) => {
        logger.info('Tag eliminado exitosamente', { id });
      }
    }
  },
  {
    getItems: getTags,
    createItem: createTagAction,
    updateItem: updateTagAction,
    deleteItem: deleteTagAction
  }
);

// Exportar el hook con el nombre anterior para mantener compatibilidad
export const useTagsStore = () => {
  const store = useTagStore();
  return {
    tags: store.items.map(transformToTagWithStats),
    loading: store.loading,
    error: store.error,
    loadTags: store.loadItems,
    createTag: store.createItem,
    updateTag: store.updateItem,
    deleteTag: store.deleteItem,
    addImageToTag: async (tagId: string, imageId: string) => {
      try {
        await addTagToImageAction(tagId, imageId);
      } catch (error) {
        logger.error('Error adding image to tag:', error);
        throw error;
      }
    }
  };
};