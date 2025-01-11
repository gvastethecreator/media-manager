import { create } from 'zustand'
import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import {
  getObjects,
  getObject,
  createObject as createObjectAction,
  updateObject as updateObjectAction,
  deleteObject as deleteObjectAction,
  addImageToObject as addImageToObjectAction,
  removeImageFromObject as removeImageFromObjectAction,
  getObjectImages
} from '@/app/actions/objects'

const objectLogger = logger.withContext('ObjectStore')

export interface ObjectCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  type?: string
  rarity?: string
  properties?: string
  requirements?: string
  origin?: string
  stats?: string
  sortBy?: string
  filters?: string
}

export interface ObjectUpdate extends Partial<Omit<ObjectCreate, 'name'>> {
  id: string
  name?: string
}

export type Object = Awaited<ReturnType<typeof getObject>>
export type ObjectWithStats = Awaited<ReturnType<typeof getObjects>>[0]
export type ImageFromServer = Awaited<ReturnType<typeof getObjectImages>>[0]

interface ObjectsState {
  objects: ObjectWithStats[]
  currentObject: Object | null
  currentItems: FileItem[]
  isLoading: boolean
  error: string | null
  // Acciones
  loadObjects: () => Promise<void>
  createObject: (data: ObjectCreate) => Promise<void>
  updateObject: (id: string, data: ObjectUpdate) => Promise<void>
  deleteObject: (id: string) => Promise<void>
  addImageToObject: (objectId: string, imageId: string) => Promise<void>
  removeImageFromObject: (objectId: string, imageId: string) => Promise<void>
  loadObjectContent: (id: string) => Promise<void>
}

const validateMetadata = (metadata: string | null): Record<string, any> | undefined => {
  if (!metadata) return undefined
  try {
    const parsed = JSON.parse(metadata)
    return typeof parsed === 'object' ? parsed : undefined
  } catch {
    objectLogger.warn('⚠️ Error al parsear metadata de imagen')
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
    objectLogger.error('❌ Error al convertir imagen del servidor:', { error, image })
    throw new Error('Error al procesar imagen del servidor')
  }
}

export const useObjectsStore = create<ObjectsState>((set, get) => ({
  objects: [],
  currentObject: null,
  currentItems: [],
  isLoading: false,
  error: null,

  loadObjects: async () => {
    try {
      set({ isLoading: true, error: null })
      const objects = await getObjects()
      set({ objects, isLoading: false })
      objectLogger.info('📥 Objetos cargados:', { count: objects.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      objectLogger.error('❌ Error al cargar objetos:', { error })
    }
  },

  createObject: async (data: ObjectCreate) => {
    try {
      set({ isLoading: true, error: null })
      const object = await createObjectAction(data)
      const objectWithStats = {
        ...object,
        _count: { images: 0 },
        totalSize: 0,
      } as ObjectWithStats
      set(state => ({
        objects: [...state.objects, objectWithStats],
        isLoading: false
      }))
      objectLogger.info('✨ Objeto creado:', { object })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      objectLogger.error('❌ Error al crear objeto:', { error })
    }
  },

  updateObject: async (id: string, data: ObjectUpdate) => {
    try {
      set({ isLoading: true, error: null })
      const updatedObject = await updateObjectAction(id, data)
      const currentStats = get().objects.find(o => o.id === id)
      const updatedObjectWithStats = {
        ...updatedObject,
        _count: currentStats?._count || { images: 0 },
        totalSize: currentStats?.totalSize || 0,
      } as ObjectWithStats
      set(state => ({
        objects: state.objects.map(o =>
          o.id === id ? updatedObjectWithStats : o
        ),
        currentObject: state.currentObject?.id === id ? updatedObjectWithStats : state.currentObject,
        isLoading: false
      }))
      objectLogger.info('📝 Objeto actualizado:', { id, data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      objectLogger.error('❌ Error al actualizar objeto:', { id, error })
    }
  },

  deleteObject: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      await deleteObjectAction(id)
      set(state => ({
        objects: state.objects.filter(o => o.id !== id),
        currentObject: state.currentObject?.id === id ? null : state.currentObject,
        currentItems: state.currentObject?.id === id ? [] : state.currentItems,
        isLoading: false
      }))
      objectLogger.info('🗑️ Objeto eliminado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      objectLogger.error('❌ Error al eliminar objeto:', { id, error })
    }
  },

  addImageToObject: async (objectId: string, imageId: string) => {
    try {
      await addImageToObjectAction(objectId, imageId)
      objectLogger.info('📸 Imagen agregada a objeto:', { objectId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      objectLogger.error('❌ Error al agregar imagen a objeto:', { objectId, imageId, error })
    }
  },

  removeImageFromObject: async (objectId: string, imageId: string) => {
    try {
      await removeImageFromObjectAction(objectId, imageId)
      set(state => ({
        currentItems: state.currentItems.filter(item => item.id !== imageId)
      }))
      objectLogger.info('🗑️ Imagen eliminada de objeto:', { objectId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      objectLogger.error('❌ Error al eliminar imagen de objeto:', { objectId, imageId, error })
    }
  },

  loadObjectContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const [object, images] = await Promise.all([
        getObject(id),
        getObjectImages(id)
      ])
      if (!object) {
        throw new Error('Objeto no encontrado')
      }

      const fileItems = images.map(convertServerImageToFileItem)

      set({
        currentObject: object,
        currentItems: fileItems,
        isLoading: false
      })
      objectLogger.info('📂 Contenido de objeto cargado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      objectLogger.error('❌ Error al cargar contenido de objeto:', { id, error })
    }
  }
}))