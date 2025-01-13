import { create } from 'zustand'
import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import {
  getTags,
  getTag,
  createTag as createTagAction,
  updateTag as updateTagAction,
  deleteTag as deleteTagAction,
  addImageToTag as addImageToTagAction,
  removeImageFromTag as removeImageFromTagAction,
  getTagImages
} from '@/app/actions/tag.actions'

const tagLogger = logger.withContext('TagStore')

export interface TagCreate {
  name: string
  color?: string
  description?: string
  shortcut?: string
}

export interface TagUpdate extends Partial<Omit<TagCreate, 'name'>> {
  id: string
  name?: string
}

export type Tag = Awaited<ReturnType<typeof getTag>>
export type TagWithStats = Awaited<ReturnType<typeof getTags>>[0]
export type ImageFromServer = Awaited<ReturnType<typeof getTagImages>>[0]

interface TagsState {
  tags: TagWithStats[]
  currentTag: Tag | null
  currentItems: FileItem[]
  isLoading: boolean
  error: string | null
  // Acciones
  loadTags: () => Promise<void>
  createTag: (data: TagCreate) => Promise<void>
  updateTag: (id: string, data: TagUpdate) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  addImageToTag: (tagId: string, imageId: string) => Promise<void>
  removeImageFromTag: (tagId: string, imageId: string) => Promise<void>
  loadTagContent: (id: string) => Promise<void>
}

const convertServerImageToFileItem = (image: ImageFromServer): FileItem => {
  try {
    const thumbnail = image.thumbnail
      ? Buffer.from(image.thumbnail).toString('base64')
      : null;

    return {
      id: image.id,
      name: image.name,
      path: image.path,
      type: 'image',
      size: image.size,
      width: image.width,
      height: image.height,
      metadata: image.metadata,
      thumbnail,
      thumbnailSize: image.thumbnailSize,
      thumbnailWidth: image.thumbnailWidth,
      thumbnailHeight: image.thumbnailHeight,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
      isPublic: image.isPublic ?? false,
      isFavorite: image.isFavorite ?? false,
      folderId: image.folderId,
      collections: [],
      tags: [],
      albums: [],
      characters: [],
      places: [],
      objects: []
    }
  } catch (error) {
    tagLogger.error('❌ Error al convertir imagen del servidor:', { error, image })
    throw new Error('Error al procesar imagen del servidor')
  }
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  currentTag: null,
  currentItems: [],
  isLoading: false,
  error: null,

  loadTags: async () => {
    try {
      set({ isLoading: true, error: null })
      const tags = await getTags()
      set({ tags, isLoading: false })
      tagLogger.info('📥 Etiquetas cargadas:', { count: tags.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      tagLogger.error('❌ Error al cargar etiquetas:', { error })
    }
  },

  createTag: async (data: TagCreate) => {
    try {
      set({ isLoading: true, error: null })
      const tag = await createTagAction(data)
      const tagWithStats = {
        ...tag,
        _count: { images: 0 },
        totalSize: 0,
      } as TagWithStats
      set(state => ({
        tags: [...state.tags, tagWithStats],
        isLoading: false
      }))
      tagLogger.info('✨ Etiqueta creada:', { tag })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      tagLogger.error('❌ Error al crear etiqueta:', { error })
    }
  },

  updateTag: async (id: string, data: TagUpdate) => {
    try {
      set({ isLoading: true, error: null })
      const updatedTag = await updateTagAction(id, data)
      const currentStats = get().tags.find(t => t.id === id)
      const updatedTagWithStats = {
        ...updatedTag,
        _count: currentStats?._count || { images: 0 },
        totalSize: currentStats?.totalSize || 0,
      } as TagWithStats
      set(state => ({
        tags: state.tags.map(t =>
          t.id === id ? updatedTagWithStats : t
        ),
        currentTag: state.currentTag?.id === id ? updatedTagWithStats : state.currentTag,
        isLoading: false
      }))
      tagLogger.info('📝 Etiqueta actualizada:', { id, data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      tagLogger.error('❌ Error al actualizar etiqueta:', { id, error })
    }
  },

  deleteTag: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      await deleteTagAction(id)
      set(state => ({
        tags: state.tags.filter(t => t.id !== id),
        currentTag: state.currentTag?.id === id ? null : state.currentTag,
        currentItems: state.currentTag?.id === id ? [] : state.currentItems,
        isLoading: false
      }))
      tagLogger.info('🗑️ Etiqueta eliminada:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      tagLogger.error('❌ Error al eliminar etiqueta:', { id, error })
    }
  },

  addImageToTag: async (tagId: string, imageId: string) => {
    try {
      await addImageToTagAction(tagId, imageId)
      tagLogger.info('📸 Imagen agregada a etiqueta:', { tagId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      tagLogger.error('❌ Error al agregar imagen a etiqueta:', { tagId, imageId, error })
    }
  },

  removeImageFromTag: async (tagId: string, imageId: string) => {
    try {
      await removeImageFromTagAction(tagId, imageId)
      set(state => ({
        currentItems: state.currentItems.filter(item => item.id !== imageId)
      }))
      tagLogger.info('🗑️ Imagen eliminada de etiqueta:', { tagId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      tagLogger.error('❌ Error al eliminar imagen de etiqueta:', { tagId, imageId, error })
    }
  },

  loadTagContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const [tag, images] = await Promise.all([
        getTag(id),
        getTagImages(id)
      ])
      if (!tag) {
        throw new Error('Etiqueta no encontrada')
      }

      const fileItems = images.map(convertServerImageToFileItem)

      set({
        currentTag: tag,
        currentItems: fileItems,
        isLoading: false
      })
      tagLogger.info('📂 Contenido de etiqueta cargado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      tagLogger.error('❌ Error al cargar contenido de etiqueta:', { id, error })
    }
  }
}))