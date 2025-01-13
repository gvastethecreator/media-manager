import { create } from 'zustand';
import type { Collection } from '@prisma/client';
import { BaseState, BaseActions } from './base.store';
import { logger } from '@/lib/logger';

const collectionLogger = logger.withContext('CollectionStore');

interface CollectionState extends BaseState<Collection> {
  collections: Collection[];
  currentCollection: Collection | null;
  addImageToCollection: (collectionId: string, imageId: string) => Promise<void>;
  removeImageFromCollection: (collectionId: string, imageId: string) => Promise<void>;
  loadCollectionContent: (id: string) => Promise<void>;
  selectItem: (item: Collection) => void;
  deselectItem: (id: string) => void;
  toggleItemSelection: (item: Collection, isMultiSelect: boolean) => void;
  clearSelection: () => void;
  loadItems: () => Promise<void>;
  loadMoreItems: () => Promise<void>;
  refreshItems: () => Promise<void>;
}

export const useCollectionsStore = create<CollectionState>((set, get) => ({
  // Estado inicial
  items: [],
  collections: [],
  currentCollection: null,
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 50,
  selectedItem: null,
  selectedItems: [],
  lastSelectedItem: null,

  // Implementación de métodos
  loadItems: async () => {
    try {
      set({ loading: true, error: null });
      // Implementación de carga
      set({ loading: false });
    } catch (error) {
      set({ error: error as Error, loading: false });
    }
  },

  loadMoreItems: async () => {
    // Implementación
  },

  refreshItems: async () => {
    // Implementación
  },

  addImageToCollection: async (collectionId: string, imageId: string) => {
    try {
      // Implementación
      collectionLogger.info('Imagen agregada a colección:', { collectionId, imageId });
    } catch (error) {
      set({ error: error as Error });
    }
  },

  removeImageFromCollection: async (collectionId: string, imageId: string) => {
    try {
      // Implementación
      collectionLogger.info('Imagen eliminada de colección:', { collectionId, imageId });
    } catch (error) {
      set({ error: error as Error });
    }
  },

  loadCollectionContent: async (id: string) => {
    try {
      set({ loading: true, error: null });
      // Implementación
      set({ loading: false });
    } catch (error) {
      set({ error: error as Error, loading: false });
    }
  },

  // Métodos de selección
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
  }
}));