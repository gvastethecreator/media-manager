import { create } from 'zustand'
import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import { collectionService } from '@/services/collection.service'
import type { Collection, CollectionCreate, CollectionUpdate } from '@/services/collection.service'

const collectionsLogger = logger.withContext('CollectionsStore')

interface CollectionsState {
  collections: Collection[]
  currentCollection: Collection | null
  currentItems: FileItem[]
  isLoading: boolean
  error: string | null
  // Acciones
  loadCollections: () => Promise<void>
  createCollection: (data: CollectionCreate) => Promise<void>
  updateCollection: (id: string, data: CollectionUpdate) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  addImageToCollection: (collectionId: string, imageId: string) => Promise<void>
  removeImageFromCollection: (collectionId: string, imageId: string) => Promise<void>
  loadCollectionContent: (id: string) => Promise<void>
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  collections: [],
  currentCollection: null,
  currentItems: [],
  isLoading: false,
  error: null,

  loadCollections: async () => {
    try {
      set({ isLoading: true, error: null })
      const collections = await collectionService.getCollections()
      set({ collections, isLoading: false })
      collectionsLogger.info('📥 Colecciones cargadas:', { count: collections.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      collectionsLogger.error('❌ Error al cargar colecciones:', { error })
    }
  },

  createCollection: async (data: CollectionCreate) => {
    try {
      set({ isLoading: true, error: null })
      const collection = await collectionService.createCollection(data)
      set(state => ({
        collections: [...state.collections, collection],
        isLoading: false
      }))
      collectionsLogger.info('✨ Colección creada:', { collection })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      collectionsLogger.error('❌ Error al crear colección:', { error })
    }
  },

  updateCollection: async (id: string, data: CollectionUpdate) => {
    try {
      set({ isLoading: true, error: null })
      const updatedCollection = await collectionService.updateCollection(id, data)
      set(state => ({
        collections: state.collections.map(c =>
          c.id === id ? updatedCollection : c
        ),
        currentCollection: state.currentCollection?.id === id ? updatedCollection : state.currentCollection,
        isLoading: false
      }))
      collectionsLogger.info('📝 Colección actualizada:', { id, data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      collectionsLogger.error('❌ Error al actualizar colección:', { id, error })
    }
  },

  deleteCollection: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      await collectionService.deleteCollection(id)
      set(state => ({
        collections: state.collections.filter(c => c.id !== id),
        currentCollection: state.currentCollection?.id === id ? null : state.currentCollection,
        currentItems: state.currentCollection?.id === id ? [] : state.currentItems,
        isLoading: false
      }))
      collectionsLogger.info('🗑️ Colección eliminada:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      collectionsLogger.error('❌ Error al eliminar colección:', { id, error })
    }
  },

  addImageToCollection: async (collectionId: string, imageId: string) => {
    try {
      await collectionService.addImageToCollection(collectionId, imageId)
      collectionsLogger.info('📸 Imagen agregada a colección:', { collectionId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      collectionsLogger.error('❌ Error al agregar imagen a colección:', { collectionId, imageId, error })
    }
  },

  removeImageFromCollection: async (collectionId: string, imageId: string) => {
    try {
      await collectionService.removeImageFromCollection(collectionId, imageId)
      set(state => ({
        currentItems: state.currentItems.filter(item => item.id !== imageId)
      }))
      collectionsLogger.info('🗑️ Imagen eliminada de colección:', { collectionId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      collectionsLogger.error('❌ Error al eliminar imagen de colección:', { collectionId, imageId, error })
    }
  },

  loadCollectionContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const collection = await collectionService.getCollection(id)
      if (!collection) {
        throw new Error('Colección no encontrada')
      }
      // TODO: Implementar endpoint para obtener imágenes de una colección
      set({
        currentCollection: collection,
        isLoading: false
      })
      collectionsLogger.info('📂 Contenido de colección cargado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      collectionsLogger.error('❌ Error al cargar contenido de colección:', { id, error })
    }
  }
}))