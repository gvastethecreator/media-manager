import { create } from 'zustand';
import type { Collection } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createCollection,
  deleteCollection,
  getCollections,
  updateCollection,
  addImageToCollection,
  removeImageFromCollection,
  type CollectionCreate,
  type CollectionUpdate
} from '../app/actions/collection.actions';

const collectionLogger = logger.withContext('CollectionStore');

interface CollectionState {
  items: Collection[];
  loading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  selectedItem: Collection | null;
  selectedItems: Collection[];
  lastSelectedItem: Collection | null;
  filters: {
    searchQuery: string;
    sortBy: 'name' | 'type' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
    type: string[];
    visibility: ('public' | 'private')[];
  };
  // Acciones base
  loadItems: () => Promise<void>;
  loadMoreItems: () => Promise<void>;
  refreshItems: () => Promise<void>;
  createItem: (data: CollectionCreate) => Promise<void>;
  updateItem: (id: string, data: CollectionUpdate) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  selectItem: (item: Collection) => void;
  deselectItem: (id: string) => void;
  toggleItemSelection: (item: Collection, isMultiSelect: boolean) => void;
  clearSelection: () => void;
  // Acciones específicas
  addImageToCollection: (collectionId: string, imageId: string) => Promise<void>;
  removeImageFromCollection: (collectionId: string, imageId: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  // Estado inicial
  items: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 50,
  selectedItem: null,
  selectedItems: [],
  lastSelectedItem: null,
  filters: {
    searchQuery: '',
    sortBy: 'name',
    sortOrder: 'asc',
    type: [],
    visibility: ['public', 'private']
  },

  // Acciones base
  loadItems: async () => {
    try {
      set({ loading: true, error: null });
      const items = await getCollections();
      set({ items, loading: false });
      collectionLogger.info('📥 Colecciones cargadas:', { count: items.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      collectionLogger.error('❌ Error al cargar colecciones:', { error });
    }
  },

  loadMoreItems: async () => {
    const state = get();
    if (state.loading || state.currentPage >= state.totalPages) return;

    try {
      set({ loading: true });
      const nextPage = state.currentPage + 1;
      const moreItems = await getCollections();

      set({
        items: [...state.items, ...moreItems],
        currentPage: nextPage,
        loading: false
      });

      collectionLogger.info(`✅ ${moreItems.length} colecciones adicionales cargadas`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      collectionLogger.error('❌ Error al cargar más colecciones:', { error });
    }
  },

  refreshItems: async () => {
    set({
      selectedItem: null,
      selectedItems: [],
      lastSelectedItem: null
    });
    await get().loadItems();
  },

  createItem: async (data: CollectionCreate) => {
    try {
      set({ loading: true, error: null });

      // Validar datos
      if (!data.name?.trim()) {
        throw new Error('El nombre es requerido');
      }

      const item = await createCollection(data);

      set((state) => ({
        items: [...state.items, item],
        loading: false
      }));

      collectionLogger.info('✨ Colección creada:', { item });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      collectionLogger.error('❌ Error al crear colección:', { error });
    }
  },

  updateItem: async (id: string, data: CollectionUpdate) => {
    try {
      set({ loading: true, error: null });

      // Validar datos
      if (data.name !== undefined && !data.name.trim()) {
        throw new Error('El nombre no puede estar vacío');
      }

      const updatedItem = await updateCollection(id, data);

      set((state) => ({
        items: state.items.map(item =>
          item.id === id ? updatedItem : item
        ),
        loading: false
      }));

      collectionLogger.info('📝 Colección actualizada:', { id, data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      collectionLogger.error('❌ Error al actualizar colección:', { id, error });
    }
  },

  deleteItem: async (id: string) => {
    try {
      set({ loading: true, error: null });

      await deleteCollection(id);

      set((state) => ({
        items: state.items.filter(item => item.id !== id),
        loading: false
      }));

      collectionLogger.info('🗑️ Colección eliminada:', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      collectionLogger.error('❌ Error al eliminar colección:', { id, error });
    }
  },

  selectItem: (item: Collection) => {
    set((state) => ({
      selectedItem: item,
      selectedItems: [...state.selectedItems, item],
      lastSelectedItem: item
    }));
  },

  deselectItem: (id: string) => {
    set((state) => ({
      selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
      selectedItems: state.selectedItems.filter(item => item.id !== id),
      lastSelectedItem: state.lastSelectedItem?.id === id ? null : state.lastSelectedItem
    }));
  },

  toggleItemSelection: (item: Collection, isMultiSelect: boolean) => {
    const state = get();
    const isSelected = state.selectedItems.some(i => i.id === item.id);

    if (!isMultiSelect) {
      set({
        selectedItem: isSelected ? null : item,
        selectedItems: isSelected ? [] : [item],
        lastSelectedItem: isSelected ? null : item
      });
      return;
    }

    if (isSelected) {
      state.deselectItem(item.id);
    } else {
      state.selectItem(item);
    }
  },

  clearSelection: () => {
    set({
      selectedItem: null,
      selectedItems: [],
      lastSelectedItem: null
    });
  },

  // Acciones específicas para manejo de imágenes
  addImageToCollection: async (collectionId: string, imageId: string) => {
    try {
      set({ loading: true, error: null });
      await addImageToCollection(collectionId, imageId);
      await get().refreshItems();
      collectionLogger.info('✅ Imagen agregada a la colección:', { collectionId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      collectionLogger.error('❌ Error al agregar imagen a la colección:', { collectionId, imageId, error });
    }
  },

  removeImageFromCollection: async (collectionId: string, imageId: string) => {
    try {
      set({ loading: true, error: null });
      await removeImageFromCollection(collectionId, imageId);
      await get().refreshItems();
      collectionLogger.info('✅ Imagen removida de la colección:', { collectionId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      collectionLogger.error('❌ Error al remover imagen de la colección:', { collectionId, imageId, error });
    }
  }
}));