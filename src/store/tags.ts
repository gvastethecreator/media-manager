import { create } from 'zustand'
import { logger } from '@/lib/logger'
import type { FileItem } from '@/types/file-item'
import { tagService } from '@/services/tag.service'
import type { Tag, TagCreate, TagUpdate } from '@/services/tag.service'

const tagsLogger = logger.withContext('TagsStore')

interface TagsState {
  tags: Tag[]
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

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  currentTag: null,
  currentItems: [],
  isLoading: false,
  error: null,

  loadTags: async () => {
    try {
      set({ isLoading: true, error: null })
      const tags = await tagService.getTags()
      set({ tags, isLoading: false })
      tagsLogger.info('📥 Tags cargados:', { count: tags.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      tagsLogger.error('❌ Error al cargar tags:', { error })
    }
  },

  createTag: async (data: TagCreate) => {
    try {
      set({ isLoading: true, error: null })
      const tag = await tagService.createTag(data)
      set(state => ({
        tags: [...state.tags, tag],
        isLoading: false
      }))
      tagsLogger.info('✨ Tag creado:', { tag })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      tagsLogger.error('❌ Error al crear tag:', { error })
    }
  },

  updateTag: async (id: string, data: TagUpdate) => {
    try {
      set({ isLoading: true, error: null })
      const updatedTag = await tagService.updateTag(id, data)
      set(state => ({
        tags: state.tags.map(t =>
          t.id === id ? updatedTag : t
        ),
        currentTag: state.currentTag?.id === id ? updatedTag : state.currentTag,
        isLoading: false
      }))
      tagsLogger.info('📝 Tag actualizado:', { id, data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      tagsLogger.error('❌ Error al actualizar tag:', { id, error })
    }
  },

  deleteTag: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      await tagService.deleteTag(id)
      set(state => ({
        tags: state.tags.filter(t => t.id !== id),
        currentTag: state.currentTag?.id === id ? null : state.currentTag,
        currentItems: state.currentTag?.id === id ? [] : state.currentItems,
        isLoading: false
      }))
      tagsLogger.info('🗑️ Tag eliminado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      tagsLogger.error('❌ Error al eliminar tag:', { id, error })
    }
  },

  addImageToTag: async (tagId: string, imageId: string) => {
    try {
      await tagService.addImageToTag(tagId, imageId)
      tagsLogger.info('📸 Imagen agregada a tag:', { tagId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      tagsLogger.error('❌ Error al agregar imagen a tag:', { tagId, imageId, error })
    }
  },

  removeImageFromTag: async (tagId: string, imageId: string) => {
    try {
      await tagService.removeImageFromTag(tagId, imageId)
      set(state => ({
        currentItems: state.currentItems.filter(item => item.id !== imageId)
      }))
      tagsLogger.info('🗑️ Imagen eliminada de tag:', { tagId, imageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      tagsLogger.error('❌ Error al eliminar imagen de tag:', { tagId, imageId, error })
    }
  },

  loadTagContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const tag = await tagService.getTag(id)
      if (!tag) {
        throw new Error('Tag no encontrado')
      }
      // TODO: Implementar endpoint para obtener imágenes de un tag
      set({
        currentTag: tag,
        isLoading: false
      })
      tagsLogger.info('📂 Contenido de tag cargado:', { id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, isLoading: false })
      tagsLogger.error('❌ Error al cargar contenido de tag:', { id, error })
    }
  }
}))