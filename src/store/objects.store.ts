import { create } from 'zustand'
import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import {
  getObjects,
  getObject,
  createObject,
  updateObject,
  deleteObject,
  addImageToObject,
  removeImageFromObject,
  getObjectImages,
  type ObjectCreate,
  type ObjectUpdate,
  type ObjectWithStats
} from '@/app/actions/object.actions'
import { createBaseStore, type BaseEntity, type BaseState, type BaseActions, type ExtendedStore } from './base.store'

const objectLogger = logger.withContext('ObjectStore')

// Extender el tipo base con los campos específicos de Object
interface Object extends BaseEntity {
  emoji: string
  description: string | null
  color: string
  shortcut: string | null
  type: string
  rarity: string
  properties: string
  requirements: string
  origin: string
  stats: string
  sortBy: string
  filters: string
  _count?: { images: number }
  totalSize?: number
  createdAt: Date
  updatedAt: Date
}

// Estado específico para Object
interface ObjectState {
  currentObject: Object | null
  currentItems: FileItem[]
}

// Acciones específicas para Object
interface ObjectActions extends Omit<BaseActions<Object, ObjectCreate, ObjectUpdate>, 'createItem' | 'updateItem'> {
  createItem: (data: ObjectCreate) => Promise<void>
  updateItem: (id: string, data: ObjectUpdate) => Promise<void>
  addImageToObject: (objectId: string, imageId: string) => Promise<void>
  removeImageFromObject: (objectId: string, imageId: string) => Promise<void>
  loadObjectContent: (id: string) => Promise<void>
}

type ObjectStore = ExtendedStore<Object, ObjectState, ObjectCreate, ObjectUpdate> & ObjectActions

const validateMetadata = (metadata: any): string | null => {
  if (!metadata) return null
  try {
    return typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
  } catch {
    objectLogger.warn('⚠️ Error al parsear metadata de imagen')
    return null
  }
}

const convertServerImageToFileItem = (image: Awaited<ReturnType<typeof getObjectImages>>[0]): FileItem => {
  try {
    const thumbnail = image.thumbnail
      ? Buffer.from(image.thumbnail).toString('base64')
      : null

    return {
      id: image.id,
      name: image.name,
      path: image.path,
      type: 'image',
      size: image.size,
      width: image.width,
      height: image.height,
      metadata: image.metadata ?? null,
      thumbnail,
      thumbnailSize: image.thumbnailSize ?? null,
      thumbnailWidth: image.thumbnailWidth ?? null,
      thumbnailHeight: image.thumbnailHeight ?? null,
      isPublic: image.isPublic ?? false,
      isFavorite: image.isFavorite ?? false,
      folderId: image.folderId,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
      collections: [],
      tags: [],
      albums: [],
      characters: [],
      places: [],
      objects: []
    }
  } catch (error) {
    objectLogger.error('❌ Error al convertir imagen del servidor:', { error, image })
    throw new Error('Error al procesar imagen del servidor')
  }
}

export const useObjectsStore = createBaseStore<Object, ObjectState, ObjectCreate, ObjectUpdate>(
  'object',
  '/api/objects',
  { customLogger: objectLogger }
)((set, get) => {
  const baseStore: ObjectStore = {
    // Estado inicial
    currentObject: null,
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
        const objects = await getObjects()
        set({
          items: objects.map(obj => ({
            ...obj,
            _count: obj._count || { images: 0 },
            totalSize: obj.totalSize || 0
          })),
          loading: false
        })
        objectLogger.info('📥 Objetos cargados:', { count: objects.length })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        objectLogger.error('❌ Error al cargar objetos:', { error })
      }
    },

    createItem: async (data: ObjectCreate) => {
      try {
        set({ loading: true, error: null })
        const object = await createObject(data)
        const objectWithStats: Object = {
          ...object,
          _count: { images: 0 },
          totalSize: 0,
        }
        set({
          items: [...get().items, objectWithStats],
          loading: false
        })
        objectLogger.info('✨ Objeto creado:', { object })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        objectLogger.error('❌ Error al crear objeto:', { error })
      }
    },

    updateItem: async (id: string, data: ObjectUpdate) => {
      try {
        set({ loading: true, error: null })
        const updatedObject = await updateObject(id, data)
        const currentStats = get().items.find((o: Object) => o.id === id)
        const updatedObjectWithStats: Object = {
          ...updatedObject,
          _count: currentStats?._count || { images: 0 },
          totalSize: currentStats?.totalSize || 0,
        }
        set({
          items: get().items.map((o: Object) =>
            o.id === id ? updatedObjectWithStats : o
          ),
          currentObject: get().currentObject?.id === id ? updatedObjectWithStats : get().currentObject,
          loading: false
        })
        objectLogger.info('📝 Objeto actualizado:', { id, data })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        objectLogger.error('❌ Error al actualizar objeto:', { id, error })
      }
    },

    deleteItem: async (id: string) => {
      try {
        set({ loading: true, error: null })
        await deleteObject(id)
        set({
          items: get().items.filter((o: Object) => o.id !== id),
          currentObject: get().currentObject?.id === id ? null : get().currentObject,
          currentItems: get().currentObject?.id === id ? [] : get().currentItems,
          loading: false
        })
        objectLogger.info('🗑️ Objeto eliminado:', { id })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        objectLogger.error('❌ Error al eliminar objeto:', { id, error })
      }
    },

    // Métodos específicos de Object
    addImageToObject: async (objectId: string, imageId: string) => {
      try {
        await addImageToObject(objectId, imageId)
        objectLogger.info('📸 Imagen agregada a objeto:', { objectId, imageId })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage) })
        objectLogger.error('❌ Error al agregar imagen a objeto:', { objectId, imageId, error })
      }
    },

    removeImageFromObject: async (objectId: string, imageId: string) => {
      try {
        await removeImageFromObject(objectId, imageId)
        set({
          currentItems: get().currentItems.filter((item: FileItem) => item.id !== imageId)
        })
        objectLogger.info('🗑️ Imagen eliminada de objeto:', { objectId, imageId })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage) })
        objectLogger.error('❌ Error al eliminar imagen de objeto:', { objectId, imageId, error })
      }
    },

    loadObjectContent: async (id: string) => {
      try {
        set({ loading: true, error: null })
        const [object, images] = await Promise.all([
          getObject(id),
          getObjectImages(id)
        ])
        if (!object) {
          throw new Error('Objeto no encontrado')
        }

        const fileItems = images.map(convertServerImageToFileItem)

        set({
          currentObject: object as Object,
          currentItems: fileItems,
          loading: false
        })
        objectLogger.info('📂 Contenido de objeto cargado:', { id })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        objectLogger.error('❌ Error al cargar contenido de objeto:', { id, error })
      }
    },

    // Implementar métodos requeridos por BaseActions
    loadMoreItems: async () => {
      const state = get()
      if (state.loading || state.currentPage >= state.totalPages) return

      try {
        set({ loading: true })
        const nextPage = state.currentPage + 1
        const response = await fetch(`/api/objects?page=${nextPage}&limit=${state.itemsPerPage}`)

        if (!response.ok) throw new Error('Error al cargar más objetos')

        const data = await response.json()
        objectLogger.info(`✅ ${data.items.length} objetos adicionales cargados`)

        set({
          items: [...state.items, ...data.items],
          currentPage: data.page,
          loading: false
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        objectLogger.error('❌ Error al cargar más objetos:', { error })
      }
    },

    refreshItems: async () => {
      set({ selectedItem: null, selectedItems: [], lastSelectedItem: null })
      await baseStore.loadItems()
    },

    selectItem: (item: Object) => {
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

    toggleItemSelection: (item: Object, isMultiSelect: boolean) => {
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