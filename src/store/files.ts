import { create } from 'zustand'
import type { FileItem } from '@/types/file-item'

interface FilesState {
  currentItems: FileItem[]
  selectedItem: FileItem | null
  selectedIds: string[]
  currentFolderId: string | null
  currentCollectionId: string | null
  currentTagId: string | null
  isLoading: boolean
  error: string | null
  page: number
  totalPages: number
  hasMore: boolean
  collections: { id: string; name: string; count: number; color?: string; emoji?: string }[]
  folders: { id: string; name: string; count: number }[]
  tags: { id: string; name: string; count: number; color: string }[]
  initialize: () => Promise<void>
  loadAllImages: (page?: number) => Promise<void>
  loadFavorites: (page?: number) => Promise<void>
  selectItem: (item: FileItem) => void
  deselectItem: (id: string) => void
  handleSelectFolder: (id: string, page?: number) => Promise<void>
  handleSelectCollection: (id: string, page?: number) => Promise<void>
  handleSelectTag: (id: string, page?: number) => Promise<void>
  loadNextPage: () => Promise<void>
  loadPreviousPage: () => Promise<void>
}

export const useFilesStore = create<FilesState>((set, get) => ({
  currentItems: [],
  selectedItem: null,
  selectedIds: [],
  currentFolderId: null,
  currentCollectionId: null,
  currentTagId: null,
  isLoading: false,
  error: null,
  page: 1,
  totalPages: 1,
  hasMore: false,
  collections: [],
  folders: [],
  tags: [],

  initialize: async () => {
    try {
      set({ isLoading: true })
      const response = await fetch('/api/stats')
      if (!response.ok) throw new Error('Error al obtener estadísticas')
      const stats = await response.json()
      set({
        collections: stats.collections || [],
        folders: stats.folders || [],
        tags: stats.tags || []
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadAllImages: async (page = 1) => {
    try {
      set({ isLoading: true })
      const response = await fetch(`/api/images?page=${page}`)
      if (!response.ok) throw new Error('Error al cargar imágenes')
      const data = await response.json()
      set({
        currentItems: data.items || [],
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        hasMore: data.page < data.totalPages
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadFavorites: async (page = 1) => {
    try {
      set({ isLoading: true })
      const response = await fetch(`/api/images/favorites?page=${page}`)
      if (!response.ok) throw new Error('Error al cargar favoritos')
      const data = await response.json()
      set({
        currentItems: data.items || [],
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        hasMore: data.page < data.totalPages
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false })
    }
  },

  selectItem: (item) => {
    set((state) => ({
      selectedItem: item,
      selectedIds: [...state.selectedIds, item.id]
    }))
  },

  deselectItem: (id) => {
    set((state) => ({
      selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
      selectedIds: state.selectedIds.filter(selectedId => selectedId !== id)
    }))
  },

  handleSelectFolder: async (id, page = 1) => {
    try {
      set({ isLoading: true, currentFolderId: id })
      const response = await fetch(`/api/folders/${id}/images?page=${page}`)
      if (!response.ok) throw new Error('Error al cargar carpeta')
      const data = await response.json()
      set({
        currentItems: data.items || [],
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        hasMore: data.page < data.totalPages
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false })
    }
  },

  handleSelectCollection: async (id, page = 1) => {
    try {
      set({ isLoading: true, currentCollectionId: id })
      const response = await fetch(`/api/collections/${id}/images?page=${page}`)
      if (!response.ok) throw new Error('Error al cargar colección')
      const data = await response.json()
      set({
        currentItems: data.items || [],
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        hasMore: data.page < data.totalPages
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false })
    }
  },

  handleSelectTag: async (id, page = 1) => {
    try {
      set({ isLoading: true, currentTagId: id })
      const response = await fetch(`/api/tags/${id}/images?page=${page}`)
      if (!response.ok) throw new Error('Error al cargar etiqueta')
      const data = await response.json()
      set({
        currentItems: data.items || [],
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        hasMore: data.page < data.totalPages
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadNextPage: async () => {
    const state = get()
    if (state.isLoading || !state.hasMore) return

    const nextPage = state.page + 1
    if (state.currentFolderId) {
      await get().handleSelectFolder(state.currentFolderId, nextPage)
    } else if (state.currentCollectionId) {
      await get().handleSelectCollection(state.currentCollectionId, nextPage)
    } else if (state.currentTagId) {
      await get().handleSelectTag(state.currentTagId, nextPage)
    } else {
      await get().loadAllImages(nextPage)
    }
  },

  loadPreviousPage: async () => {
    const state = get()
    if (state.isLoading || state.page <= 1) return

    const prevPage = state.page - 1
    if (state.currentFolderId) {
      await get().handleSelectFolder(state.currentFolderId, prevPage)
    } else if (state.currentCollectionId) {
      await get().handleSelectCollection(state.currentCollectionId, prevPage)
    } else if (state.currentTagId) {
      await get().handleSelectTag(state.currentTagId, prevPage)
    } else {
      await get().loadAllImages(prevPage)
    }
  }
}))