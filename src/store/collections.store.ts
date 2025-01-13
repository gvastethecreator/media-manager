import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addImageToCollection,
  removeImageFromCollection,
  getCollectionImages,
} from '@/app/actions/collection.actions'
import type {
  CollectionCreate,
  CollectionUpdate,
  CollectionWithStats as ServerCollection
} from '@/services/collection.service'
import { createBaseStore, type BaseEntity, type BaseState, type BaseActions } from './base.store'

const collectionLogger = logger.withContext('CollectionStore')

// Extender el tipo base con los campos específicos de Collection
interface Collection extends BaseEntity {
  emoji: string
  description: string | null
  color: string
  shortcut: string | null
  sortBy: string
  filters: string
  _count?: { images: number }
  totalSize?: number
  createdAt: Date
  updatedAt: Date
}

// Estado específico para Collection
interface CollectionState extends Omit<BaseState<Collection>, 'error'> {
  currentCollection: Collection | null
  currentItems: FileItem[]
  error: Error | null
}

// Acciones específicas para Collection
interface CollectionActions extends Omit<BaseActions<Collection>, 'createItem' | 'updateItem'> {
  createItem: (data: CollectionCreate) => Promise<void>
  updateItem: (id: string, data: CollectionUpdate) => Promise<void>
  addImageToCollection: (collectionId: string, imageId: string) => Promise<void>
  removeImageFromCollection: (collectionId: string, imageId: string) => Promise<void>
  loadCollectionContent: (id: string) => Promise<void>
}

type CollectionStore = CollectionState & CollectionActions

const validateMetadata = (metadata: string | null): Record<string, any> | undefined => {
  if (!metadata) return undefined
  try {
    const parsed = JSON.parse(metadata)
    return typeof parsed === 'object' ? parsed : undefined
  } catch {
    collectionLogger.warn('⚠️ Error al parsear metadata de imagen')
    return undefined
  }
}

const convertServerImageToFileItem = (image: Awaited<ReturnType<typeof getCollectionImages>>[0]): FileItem => {
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
    collectionLogger.error('❌ Error al convertir imagen del servidor:', { error, image })
    throw new Error('Error al procesar imagen del servidor')
  }
}

export const useCollectionsStore = createBaseStore<Collection>(
  'collection',
  '/api/collections',
  { customLogger: collectionLogger }
)((set: (state: Partial<CollectionState>) => void, get: () => CollectionState) => {
  const baseStore: CollectionStore = {
    // Estado inicial
    currentCollection: null,
    currentItems: [],
    items: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 50,
    selectedItem: null,
    selectedItems: [],
    lastSelectedItem: null,

    // Sobreescribir métodos del BaseStore
    loadItems: async () => {
      try {
        set({ loading: true, error: null })
        const collections = await getCollections()
        set({
          items: collections.map(collection => ({
            ...collection,
            _count: collection._count || { images: 0 },
            totalSize: collection.totalSize || 0
          })),
          loading: false
        })
        collectionLogger.info('📥 Colecciones cargadas:', { count: collections.length })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        collectionLogger.error('❌ Error al cargar colecciones:', { error })
      }
    },

    createItem: async (data: CollectionCreate) => {
      try {
        set({ loading: true, error: null })
        const collection = await createCollection(data)
        const collectionWithStats: Collection = {
          ...collection,
          _count: { images: 0 },
          totalSize: 0,
        }
        set({
          items: [...get().items, collectionWithStats],
          loading: false
        })
        collectionLogger.info('✨ Colección creada:', { collection })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        collectionLogger.error('❌ Error al crear colección:', { error })
      }
    },

    updateItem: async (id: string, data: CollectionUpdate) => {
      try {
        set({ loading: true, error: null })
        const updatedCollection = await updateCollection(id, data)
        const currentStats = get().items.find((c: Collection) => c.id === id)
        const updatedCollectionWithStats: Collection = {
          ...updatedCollection,
          _count: currentStats?._count || { images: 0 },
          totalSize: currentStats?.totalSize || 0,
        }
        set({
          items: get().items.map((c: Collection) =>
            c.id === id ? updatedCollectionWithStats : c
          ),
          currentCollection: get().currentCollection?.id === id ? updatedCollectionWithStats : get().currentCollection,
          loading: false
        })
        collectionLogger.info('📝 Colección actualizada:', { id, data })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        collectionLogger.error('❌ Error al actualizar colección:', { id, error })
      }
    },

    deleteItem: async (id: string) => {
      try {
        set({ loading: true, error: null })
        await deleteCollection(id)
        set({
          items: get().items.filter((c: Collection) => c.id !== id),
          currentCollection: get().currentCollection?.id === id ? null : get().currentCollection,
          currentItems: get().currentCollection?.id === id ? [] : get().currentItems,
          loading: false
        })
        collectionLogger.info('🗑️ Colección eliminada:', { id })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        collectionLogger.error('❌ Error al eliminar colección:', { id, error })
      }
    },

    // Métodos específicos de Collection
    addImageToCollection: async (collectionId: string, imageId: string) => {
      try {
        await addImageToCollection(collectionId, imageId)
        collectionLogger.info('📸 Imagen agregada a colección:', { collectionId, imageId })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage) })
        collectionLogger.error('❌ Error al agregar imagen a colección:', { collectionId, imageId, error })
      }
    },

    removeImageFromCollection: async (collectionId: string, imageId: string) => {
      try {
        await removeImageFromCollection(collectionId, imageId)
        set({
          currentItems: get().currentItems.filter((item: FileItem) => item.id !== imageId)
        })
        collectionLogger.info('🗑️ Imagen eliminada de colección:', { collectionId, imageId })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage) })
        collectionLogger.error('❌ Error al eliminar imagen de colección:', { collectionId, imageId, error })
      }
    },

    loadCollectionContent: async (id: string) => {
      try {
        set({ loading: true, error: null })
        const [collection, images] = await Promise.all([
          getCollection(id),
          getCollectionImages(id)
        ])
        if (!collection) {
          throw new Error('Colección no encontrada')
        }

        const fileItems = images.map(convertServerImageToFileItem)

        set({
          currentCollection: collection as Collection,
          currentItems: fileItems,
          loading: false
        })
        collectionLogger.info('📂 Contenido de colección cargado:', { id })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        collectionLogger.error('❌ Error al cargar contenido de colección:', { id, error })
      }
    },

    // Implementar métodos requeridos por BaseActions
    loadMoreItems: async () => {
      const state = get()
      if (state.loading || state.currentPage >= state.totalPages) return

      try {
        set({ loading: true })
        const nextPage = state.currentPage + 1
        const response = await fetch(`/api/collections?page=${nextPage}&limit=${state.itemsPerPage}`)

        if (!response.ok) throw new Error('Error al cargar más colecciones')

        const data = await response.json()
        collectionLogger.info(`✅ ${data.items.length} colecciones adicionales cargadas`)

        set({
          items: [...state.items, ...data.items],
          currentPage: data.page,
          loading: false
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        collectionLogger.error('❌ Error al cargar más colecciones:', { error })
      }
    },

    refreshItems: async () => {
      set({ selectedItem: null, selectedItems: [], lastSelectedItem: null })
      await baseStore.loadItems()
    },

    selectItem: (item: Collection) => {
      set({
        selectedItem: item,
        selectedItems: [...get().selectedItems, item],
        lastSelectedItem: item
      })
    },

    deselectItem: (id: string) => {
      const state = get()
      set({
        selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
        selectedItems: state.selectedItems.filter(item => item.id !== id),
        lastSelectedItem: state.lastSelectedItem?.id === id ? null : state.lastSelectedItem
      })
    },

    toggleItemSelection: (item: Collection, isMultiSelect: boolean) => {
      const state = get()
      const isSelected = state.selectedItems.some(i => i.id === item.id)

      if (!isMultiSelect) {
        set({
          selectedItem: isSelected ? null : item,
          selectedItems: isSelected ? [] : [item],
          lastSelectedItem: isSelected ? null : item
        })
        return
      }

      if (isSelected) {
        baseStore.deselectItem(item.id)
      } else {
        baseStore.selectItem(item)
      }
    },

    clearSelection: () => {
      set({
        selectedItem: null,
        selectedItems: [],
        lastSelectedItem: null
      })
    }
  }

  return baseStore
})