import { create } from 'zustand'
import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import {
  getCollections,
  getCollection,
  createCollection as createCollectionAction,
  updateCollection as updateCollectionAction,
  deleteCollection as deleteCollectionAction,
  addImageToCollection as addImageToCollectionAction,
  removeImageFromCollection as removeImageFromCollectionAction,
  getCollectionImages
} from '@/app/actions/collection.actions'

const collectionsLogger = logger.withContext('CollectionsStore')

export interface CollectionCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  sortBy?: string
  filters?: string
}

export interface CollectionUpdate extends Partial<Omit<CollectionCreate, 'name'>> {
  id: string
  name?: string
}

export type Collection = Awaited<ReturnType<typeof getCollection>>
export type CollectionWithStats = Awaited<ReturnType<typeof getCollections>>[0]
export type ImageFromServer = Awaited<ReturnType<typeof getCollectionImages>>[0]

interface CollectionsState {
  collections: CollectionWithStats[]
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

const validateMetadata = (metadata: string | null): Record<string, any> | undefined => {
  if (!metadata) return undefined
  try {
    const parsed = JSON.parse(metadata)
    return typeof parsed === 'object' ? parsed : undefined
  } catch {
    collectionsLogger.warn('⚠️ Error al parsear metadata de imagen')
    return undefined
  }
}

const convertServerImageToFileItem = (image: ImageFromServer): FileItem => {
  try {
    const metadata = validateMetadata(image.metadata)
    const thumbnail = image.thumbnail
      ? Buffer.from(image.thumbnail).toString('base64')
      : undefined

    return {
      id: image.id,
      name: image.name,
      path: image.path,
      type: 'image',
      size: image.size,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      metadata,
      thumbnail,
      thumbnailSize: image.thumbnailSize ?? undefined,
      thumbnailWidth: image.thumbnailWidth ?? undefined,
      thumbnailHeight: image.thumbnailHeight ?? undefined,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString(),
      isPublic: image.isPublic ?? false,
      isFavorite: image.isFavorite ?? false,
      folderId: image.folderId,
    }
  } catch (error) {
    collectionsLogger.error('❌ Error al convertir imagen del servidor:', { error, image })
    throw new Error('Error al procesar imagen del servidor')
  }
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
      const collections = await getCollections()
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
      const collection = await createCollectionAction(data)
      const collectionWithStats = {
        ...collection,
        _count: { images: 0 },
        totalSize: 0,
      } as CollectionWithStats
      set(state => ({
        collections: [...state.collections, collectionWithStats],
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
      const updatedCollection = await updateCollectionAction(id, data)
      const currentStats = get().collections.find(c => c.id === id)
      const updatedCollectionWithStats = {
        ...updatedCollection,
        _count: currentStats?._count || { images: 0 },
        totalSize: currentStats?.totalSize || 0,
      } as CollectionWithStats
      set(state => ({
        collections: state.collections.map(c =>
          c.id === id ? updatedCollectionWithStats : c
        ),
        currentCollection: state.currentCollection?.id === id ? updatedCollectionWithStats : state.currentCollection,
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
      await deleteCollectionAction(id)
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
      await addImageToCollectionAction(collectionId, imageId)
      collectionsLogger.info('📸 Imagen agregada a colección:', { collectionId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      collectionsLogger.error('❌ Error al agregar imagen a colección:', { collectionId, imageId, error })
    }
  },

  removeImageFromCollection: async (collectionId: string, imageId: string) => {
    try {
      await removeImageFromCollectionAction(collectionId, imageId)
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
      const [collection, images] = await Promise.all([
        getCollection(id),
        getCollectionImages(id)
      ])
      if (!collection) {
        throw new Error('Colección no encontrada')
      }

      const fileItems = images.map(convertServerImageToFileItem)

      set({
        currentCollection: collection,
        currentItems: fileItems,
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