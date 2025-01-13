import { create } from 'zustand'
import type { FileItem } from '@/types/file-item'

interface FilesState {
  currentItems: FileItem[]
  displayedItems: FileItem[]
  selectedItem: FileItem | null
  selectedIds: string[]
  currentFolderId: string | null
  currentCollectionId: string | null
  currentTagId: string | null
  isLoading: boolean
  error: string | null
  collections: { id: string; name: string; count: number; color?: string; emoji?: string }[]
  folders: { id: string; name: string; count: number }[]
  tags: { id: string; name: string; count: number; color: string }[]
  isProcessingThumbnails: boolean
  initialize: () => Promise<void>
  loadAllImages: () => Promise<void>
  loadFavorites: () => Promise<void>
  selectItem: (item: FileItem) => void
  deselectItem: (id: string) => void
  handleSelectFolder: (id: string) => Promise<void>
  handleSelectCollection: (id: string) => Promise<void>
  handleSelectTag: (id: string) => Promise<void>
  loadMoreItems: () => void
}

const ITEMS_PER_BATCH = 50

export const useFilesStore = create<FilesState>((set, get) => ({
  currentItems: [],
  displayedItems: [],
  selectedItem: null,
  selectedIds: [],
  currentFolderId: null,
  currentCollectionId: null,
  currentTagId: null,
  isLoading: false,
  error: null,
  collections: [],
  folders: [],
  tags: [],
  isProcessingThumbnails: false,

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

  loadAllImages: async () => {
    try {
      set({ isLoading: true })
      const response = await fetch('/api/images/all')
      if (!response.ok) throw new Error('Error al cargar imágenes')
      const data = await response.json()
      const items = data.items || []
      set({
        currentItems: items,
        displayedItems: items.slice(0, ITEMS_PER_BATCH),
        isProcessingThumbnails: true
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false, isProcessingThumbnails: false })
    }
  },

  loadFavorites: async () => {
    try {
      set({ isLoading: true })
      const response = await fetch('/api/images/favorites/all')
      if (!response.ok) throw new Error('Error al cargar favoritos')
      const data = await response.json()
      const items = data.items || []
      set({
        currentItems: items,
        displayedItems: items.slice(0, ITEMS_PER_BATCH),
        isProcessingThumbnails: true
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false, isProcessingThumbnails: false })
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

  handleSelectFolder: async (id) => {
    try {
      set({ isLoading: true, currentFolderId: id })
      const response = await fetch(`/api/folders/${id}/images/all`)
      if (!response.ok) throw new Error('Error al cargar carpeta')
      const data = await response.json()
      const items = data.items || []
      set({
        currentItems: items,
        displayedItems: items.slice(0, ITEMS_PER_BATCH),
        isProcessingThumbnails: true
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false, isProcessingThumbnails: false })
    }
  },

  handleSelectCollection: async (id) => {
    try {
      set({ isLoading: true, currentCollectionId: id })
      const response = await fetch(`/api/collections/${id}/images/all`)
      if (!response.ok) throw new Error('Error al cargar colección')
      const data = await response.json()
      const items = data.items || []
      set({
        currentItems: items,
        displayedItems: items.slice(0, ITEMS_PER_BATCH),
        isProcessingThumbnails: true
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false, isProcessingThumbnails: false })
    }
  },

  handleSelectTag: async (id) => {
    try {
      set({ isLoading: true, currentTagId: id })
      const response = await fetch(`/api/tags/${id}/images/all`)
      if (!response.ok) throw new Error('Error al cargar etiqueta')
      const data = await response.json()
      const items = data.items || []
      set({
        currentItems: items,
        displayedItems: items.slice(0, ITEMS_PER_BATCH),
        isProcessingThumbnails: true
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      set({ isLoading: false, isProcessingThumbnails: false })
    }
  },

  loadMoreItems: () => {
    set((state) => {
      const currentLength = state.displayedItems.length
      const nextBatch = state.currentItems.slice(
        currentLength,
        currentLength + ITEMS_PER_BATCH
      )
      return {
        displayedItems: [...state.displayedItems, ...nextBatch]
      }
    })
  }
}))