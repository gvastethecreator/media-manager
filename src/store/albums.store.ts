import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import {
  getAlbums,
  getAlbum,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addImageToAlbum,
  removeImageFromAlbum,
  getAlbumImages,
  type AlbumCreate,
  type AlbumUpdate,
  type AlbumWithStats
} from '@/app/actions/album.actions'
import { createBaseStore, type BaseEntity, type BaseState, type BaseActions } from './base.store'

const albumLogger = logger.withContext('AlbumStore')

// Extender el tipo base con los campos específicos de Album
interface Album extends BaseEntity {
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

// Estado específico para Album
interface AlbumState extends Omit<BaseState<Album>, 'error'> {
  currentAlbum: Album | null
  currentItems: FileItem[]
  error: Error | null
}

// Acciones específicas para Album
interface AlbumActions extends Omit<BaseActions<Album>, 'createItem' | 'updateItem'> {
  createItem: (data: AlbumCreate) => Promise<void>
  updateItem: (id: string, data: AlbumUpdate) => Promise<void>
  addImageToAlbum: (albumId: string, imageId: string) => Promise<void>
  removeImageFromAlbum: (albumId: string, imageId: string) => Promise<void>
  loadAlbumContent: (id: string) => Promise<void>
}

type AlbumStore = AlbumState & AlbumActions

const validateMetadata = (metadata: string | null): Record<string, any> | undefined => {
  if (!metadata) return undefined
  try {
    const parsed = JSON.parse(metadata)
    return typeof parsed === 'object' ? parsed : undefined
  } catch {
    albumLogger.warn('⚠️ Error al parsear metadata de imagen')
    return undefined
  }
}

const convertServerImageToFileItem = (image: Awaited<ReturnType<typeof getAlbumImages>>[0]): FileItem => {
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
    albumLogger.error('❌ Error al convertir imagen del servidor:', { error, image })
    throw new Error('Error al procesar imagen del servidor')
  }
}

export const useAlbumsStore = createBaseStore<Album>(
  'album',
  '/api/albums',
  { customLogger: albumLogger }
)((set: (state: Partial<AlbumState>) => void, get: () => AlbumState) => {
  const baseStore: AlbumStore = {
    // Estado inicial
    currentAlbum: null,
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
        const albums = await getAlbums()
        set({
          items: albums.map(album => ({
            ...album,
            _count: album._count || { images: 0 },
            totalSize: album.totalSize || 0
          })),
          loading: false
        })
        albumLogger.info('📥 Álbumes cargados:', { count: albums.length })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        albumLogger.error('❌ Error al cargar álbumes:', { error })
      }
    },

    createItem: async (data: AlbumCreate) => {
      try {
        set({ loading: true, error: null })
        const album = await createAlbum(data)
        const albumWithStats: Album = {
          ...album,
          _count: { images: 0 },
          totalSize: 0,
        }
        set({
          items: [...get().items, albumWithStats],
          loading: false
        })
        albumLogger.info('✨ Álbum creado:', { album })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        albumLogger.error('❌ Error al crear álbum:', { error })
      }
    },

    updateItem: async (id: string, data: AlbumUpdate) => {
      try {
        set({ loading: true, error: null })
        const updatedAlbum = await updateAlbum(id, data)
        const currentStats = get().items.find((a: Album) => a.id === id)
        const updatedAlbumWithStats: Album = {
          ...updatedAlbum,
          _count: currentStats?._count || { images: 0 },
          totalSize: currentStats?.totalSize || 0,
        }
        set({
          items: get().items.map((a: Album) =>
            a.id === id ? updatedAlbumWithStats : a
          ),
          currentAlbum: get().currentAlbum?.id === id ? updatedAlbumWithStats : get().currentAlbum,
          loading: false
        })
        albumLogger.info('📝 Álbum actualizado:', { id, data })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        albumLogger.error('❌ Error al actualizar álbum:', { id, error })
      }
    },

    deleteItem: async (id: string) => {
      try {
        set({ loading: true, error: null })
        await deleteAlbum(id)
        set({
          items: get().items.filter((a: Album) => a.id !== id),
          currentAlbum: get().currentAlbum?.id === id ? null : get().currentAlbum,
          currentItems: get().currentAlbum?.id === id ? [] : get().currentItems,
          loading: false
        })
        albumLogger.info('🗑️ Álbum eliminado:', { id })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        albumLogger.error('❌ Error al eliminar álbum:', { id, error })
      }
    },

    // Métodos específicos de Album
    addImageToAlbum: async (albumId: string, imageId: string) => {
      try {
        await addImageToAlbum(albumId, imageId)
        albumLogger.info('📸 Imagen agregada a álbum:', { albumId, imageId })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage) })
        albumLogger.error('❌ Error al agregar imagen a álbum:', { albumId, imageId, error })
      }
    },

    removeImageFromAlbum: async (albumId: string, imageId: string) => {
      try {
        await removeImageFromAlbum(albumId, imageId)
        set({
          currentItems: get().currentItems.filter((item: FileItem) => item.id !== imageId)
        })
        albumLogger.info('🗑️ Imagen eliminada de álbum:', { albumId, imageId })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage) })
        albumLogger.error('❌ Error al eliminar imagen de álbum:', { albumId, imageId, error })
      }
    },

    loadAlbumContent: async (id: string) => {
      try {
        set({ loading: true, error: null })
        const [album, images] = await Promise.all([
          getAlbum(id),
          getAlbumImages(id)
        ])
        if (!album) {
          throw new Error('Álbum no encontrado')
        }

        const fileItems = images.map(convertServerImageToFileItem)

        set({
          currentAlbum: album as Album,
          currentItems: fileItems,
          loading: false
        })
        albumLogger.info('📂 Contenido de álbum cargado:', { id })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        albumLogger.error('❌ Error al cargar contenido de álbum:', { id, error })
      }
    },

    // Implementar métodos requeridos por BaseActions
    loadMoreItems: async () => {
      const state = get()
      if (state.loading || state.currentPage >= state.totalPages) return

      try {
        set({ loading: true })
        const nextPage = state.currentPage + 1
        const response = await fetch(`/api/albums?page=${nextPage}&limit=${state.itemsPerPage}`)

        if (!response.ok) throw new Error('Error al cargar más álbumes')

        const data = await response.json()
        albumLogger.info(`✅ ${data.items.length} álbumes adicionales cargados`)

        set({
          items: [...state.items, ...data.items],
          currentPage: data.page,
          loading: false
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        set({ error: new Error(errorMessage), loading: false })
        albumLogger.error('❌ Error al cargar más álbumes:', { error })
      }
    },

    refreshItems: async () => {
      set({ selectedItem: null, selectedItems: [], lastSelectedItem: null })
      await baseStore.loadItems()
    },

    selectItem: (item: Album) => {
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

    toggleItemSelection: (item: Album, isMultiSelect: boolean) => {
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