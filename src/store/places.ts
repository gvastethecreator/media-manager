import { create } from 'zustand'
import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import {
  getPlaces,
  getPlace,
  createPlace as createPlaceAction,
  updatePlace as updatePlaceAction,
  deletePlace as deletePlaceAction,
  addImageToPlace as addImageToPlaceAction,
  removeImageFromPlace as removeImageFromPlaceAction,
  getPlaceImages
} from '@/app/actions/places'

const placeLogger = logger.withContext('PlaceStore')

export interface PlaceCreate {
  name: string
  emoji?: string
  color?: string
  description?: string
  shortcut?: string
  region?: string
  type?: string
  climate?: string
  population?: number
  government?: string
  dangers?: string
  resources?: string
  lore?: string
  history?: string
  stats?: string
  sortBy?: string
  filters?: string
}

export interface PlaceUpdate extends Partial<Omit<PlaceCreate, 'name'>> {
  id: string
  name?: string
}

export type Place = Awaited<ReturnType<typeof getPlace>>
export type PlaceWithStats = Awaited<ReturnType<typeof getPlaces>>[0]
export type ImageFromServer = Awaited<ReturnType<typeof getPlaceImages>>[0]

interface PlacesState {
  places: PlaceWithStats[]
  currentPlace: Place | null
  currentItems: FileItem[]
  isLoading: boolean
  error: string | null
  // Acciones
  loadPlaces: () => Promise<void>
  createPlace: (data: PlaceCreate) => Promise<void>
  updatePlace: (id: string, data: PlaceUpdate) => Promise<void>
  deletePlace: (id: string) => Promise<void>
  addImageToPlace: (placeId: string, imageId: string) => Promise<void>
  removeImageFromPlace: (placeId: string, imageId: string) => Promise<void>
  loadPlaceContent: (id: string) => Promise<void>
}

const validateMetadata = (metadata: string | null): Record<string, any> | undefined => {
  if (!metadata) return undefined
  try {
    const parsed = JSON.parse(metadata)
    return typeof parsed === 'object' ? parsed : undefined
  } catch {
    placeLogger.warn('⚠️ Error al parsear metadata de imagen')
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
    placeLogger.error('❌ Error al convertir imagen del servidor:', { error, image })
    throw new Error('Error al procesar imagen del servidor')
  }
}

export const usePlacesStore = create<PlacesState>((set, get) => ({
  places: [],
  currentPlace: null,
  currentItems: [],
  isLoading: false,
  error: null,

  loadPlaces: async () => {
    try {
      set({ isLoading: true, error: null })
      const places = await getPlaces()
      set({ places, isLoading: false })
      placeLogger.info('📥 Lugares cargados:', { count: places.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      placeLogger.error('❌ Error al cargar lugares:', { error })
    }
  },

  createPlace: async (data: PlaceCreate) => {
    try {
      set({ isLoading: true, error: null })
      const place = await createPlaceAction(data)
      const placeWithStats = {
        ...place,
        _count: { images: 0 },
        totalSize: 0,
      } as PlaceWithStats
      set(state => ({
        places: [...state.places, placeWithStats],
        isLoading: false
      }))
      placeLogger.info('✨ Lugar creado:', { place })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      placeLogger.error('❌ Error al crear lugar:', { error })
    }
  },

  updatePlace: async (id: string, data: PlaceUpdate) => {
    try {
      set({ isLoading: true, error: null })
      const updatedPlace = await updatePlaceAction(id, data)
      const currentStats = get().places.find(p => p.id === id)
      const updatedPlaceWithStats = {
        ...updatedPlace,
        _count: currentStats?._count || { images: 0 },
        totalSize: currentStats?.totalSize || 0,
      } as PlaceWithStats
      set(state => ({
        places: state.places.map(p =>
          p.id === id ? updatedPlaceWithStats : p
        ),
        currentPlace: state.currentPlace?.id === id ? updatedPlaceWithStats : state.currentPlace,
        isLoading: false
      }))
      placeLogger.info('📝 Lugar actualizado:', { id, data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      placeLogger.error('❌ Error al actualizar lugar:', { id, error })
    }
  },

  deletePlace: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      await deletePlaceAction(id)
      set(state => ({
        places: state.places.filter(p => p.id !== id),
        currentPlace: state.currentPlace?.id === id ? null : state.currentPlace,
        currentItems: state.currentPlace?.id === id ? [] : state.currentItems,
        isLoading: false
      }))
      placeLogger.info('🗑️ Lugar eliminado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      placeLogger.error('❌ Error al eliminar lugar:', { id, error })
    }
  },

  addImageToPlace: async (placeId: string, imageId: string) => {
    try {
      await addImageToPlaceAction(placeId, imageId)
      placeLogger.info('📸 Imagen agregada a lugar:', { placeId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      placeLogger.error('❌ Error al agregar imagen a lugar:', { placeId, imageId, error })
    }
  },

  removeImageFromPlace: async (placeId: string, imageId: string) => {
    try {
      await removeImageFromPlaceAction(placeId, imageId)
      set(state => ({
        currentItems: state.currentItems.filter(item => item.id !== imageId)
      }))
      placeLogger.info('🗑️ Imagen eliminada de lugar:', { placeId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      placeLogger.error('❌ Error al eliminar imagen de lugar:', { placeId, imageId, error })
    }
  },

  loadPlaceContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const [place, images] = await Promise.all([
        getPlace(id),
        getPlaceImages(id)
      ])
      if (!place) {
        throw new Error('Lugar no encontrado')
      }

      const fileItems = images.map(convertServerImageToFileItem)

      set({
        currentPlace: place,
        currentItems: fileItems,
        isLoading: false
      })
      placeLogger.info('📂 Contenido de lugar cargado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      placeLogger.error('❌ Error al cargar contenido de lugar:', { id, error })
    }
  }
}))