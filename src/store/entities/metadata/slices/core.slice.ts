/**
 * @file Core slice para el store de metadata
 * @module store/entities/metadata/slices/core
 */

import { MetadataExtended } from '@/types/entities/metadata/extended';
import { StateCreator } from 'zustand';
import { MetadataStore } from '..';

// Estado
export interface CoreState {
  // Datos
  metadatas: MetadataExtended[];
  isLoading: boolean;
  error: string | null;
}

// Acciones
export interface CoreActions {
  // Setters básicos
  setMetadatas: (metadatas: MetadataExtended[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Operaciones
  addMetadata: (metadata: MetadataExtended) => void;
  updateMetadata: (id: string, metadata: Partial<MetadataExtended>) => void;
  removeMetadata: (id: string) => void;

  // Operaciones masivas
  reset: () => void;
}

// Estado inicial
const initialState: CoreState = {
  metadatas: [],
  isLoading: false,
  error: null
};

// Crear slice
export const createCoreSlice: StateCreator<
  MetadataStore,
  [],
  [],
  CoreState & CoreActions
> = (set, get) => ({
  ...initialState,

  // Setters básicos
  setMetadatas: (metadatas) => set({ metadatas }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Operaciones
  addMetadata: (metadata) => {
    const { metadatas } = get();
    set({ metadatas: [...metadatas, metadata] });
  },

  updateMetadata: (id, updatedData) => {
    const { metadatas } = get();
    const updatedMetadatas = metadatas.map(metadata =>
      metadata.id === id ? { ...metadata, ...updatedData } : metadata
    );
    set({ metadatas: updatedMetadatas });
  },

  removeMetadata: (id) => {
    const { metadatas } = get();
    set({ metadatas: metadatas.filter(metadata => metadata.id !== id) });
  },

  // Operaciones masivas
  reset: () => set(initialState)
});