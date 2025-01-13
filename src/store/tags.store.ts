import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { TagWithStats, TagCreate, TagUpdate } from '@/app/actions/tag.actions'
import { getTags, createTag, updateTag, deleteTag } from '@/app/actions/tag.actions'

interface TagsState {
  tags: TagWithStats[]
  loading: boolean
  error: string | null
  loadTags: () => Promise<void>
  createTag: (data: TagCreate) => Promise<void>
  updateTag: (id: string, data: TagUpdate) => Promise<void>
  deleteTag: (id: string) => Promise<void>
}

export const useTagsStore = create<TagsState>()(
  devtools(
    (set) => ({
      tags: [],
      loading: false,
      error: null,
      loadTags: async () => {
        try {
          set({ loading: true, error: null })
          const tags = await getTags()
          set({ tags, loading: false })
        } catch (error) {
          set({ error: 'Error al cargar las etiquetas', loading: false })
          console.error('Error loading tags:', error)
        }
      },
      createTag: async (data) => {
        try {
          set({ loading: true, error: null })
          await createTag(data)
          const tags = await getTags()
          set({ tags, loading: false })
        } catch (error) {
          set({ error: 'Error al crear la etiqueta', loading: false })
          console.error('Error creating tag:', error)
        }
      },
      updateTag: async (id, data) => {
        try {
          set({ loading: true, error: null })
          await updateTag(id, data)
          const tags = await getTags()
          set({ tags, loading: false })
        } catch (error) {
          set({ error: 'Error al actualizar la etiqueta', loading: false })
          console.error('Error updating tag:', error)
        }
      },
      deleteTag: async (id) => {
        try {
          set({ loading: true, error: null })
          await deleteTag(id)
          const tags = await getTags()
          set({ tags, loading: false })
        } catch (error) {
          set({ error: 'Error al eliminar la etiqueta', loading: false })
          console.error('Error deleting tag:', error)
        }
      }
    }),
    { name: 'tags-store' }
  )
)