import { create } from 'zustand'
import type { FileItem } from '@/types/file-item'

interface FileManagerState {
  // Estado de items
  currentItems: FileItem[]
  displayedItems: FileItem[]
  isLoading: boolean
  error: string | null

  // Estado de selección
  selectedItem: FileItem | null
  selectedItems: FileItem[]
  lastSelectedItem: FileItem | null

  // Estado de contexto actual
  currentFolderId: string | null
  currentCollectionId: string | null
  currentTagId: string | null

  // Metadatos
  collections: { id: string; name: string; count: number; color?: string; emoji?: string }[]
  folders: { id: string; name: string; count: number }[]
  tags: { id: string; name: string; count: number; color: string }[]

  // Estado de procesamiento
  isProcessingThumbnails: boolean

  // Acciones de inicialización
  initialize: () => Promise<void>

  // Acciones de carga
  loadItems: (url: string) => Promise<void>
  loadMoreItems: () => void

  // Acciones de selección
  selectItem: (item: FileItem) => void
  deselectItem: (id: string) => void
  toggleItemSelection: (item: FileItem, isMultiSelect: boolean) => void
  clearSelection: () => void

  // Acciones de navegación
  setCurrentFolder: (id: string) => Promise<void>
  setCurrentCollection: (id: string) => Promise<void>
  setCurrentTag: (id: string) => Promise<void>
}

const ITEMS_PER_BATCH = 50

const fetchItems = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Error al cargar datos desde ${url}`)
  const data = await response.json()
  return data.items || []
}

export const useFileManager = create<FileManagerState>((set, get) => ({
  // Estado inicial
  currentItems: [],
  displayedItems: [],
  selectedItem: null,
  selectedItems: [],
  lastSelectedItem: null,
  currentFolderId: null,
  currentCollectionId: null,
  currentTagId: null,
  isLoading: false,
  error: null,
  collections: [],
  folders: [],
  tags: [],
  isProcessingThumbnails: false,

  // Inicialización
  initialize: async () => {
    try {
      set({ isLoading: true, error: null })
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

  // Carga de items
  loadItems: async (url: string) => {
    try {
      set({ isLoading: true, error: null })
      const items = await fetchItems(url)
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
  },

  // Selección de items
  selectItem: (item) => {
    set((state) => ({
      selectedItem: item,
      selectedItems: [...state.selectedItems, item],
      lastSelectedItem: item
    }))
  },

  deselectItem: (id) => {
    set((state) => ({
      selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
      selectedItems: state.selectedItems.filter(item => item.id !== id),
      lastSelectedItem: state.lastSelectedItem?.id === id ? null : state.lastSelectedItem
    }))
  },

  toggleItemSelection: (item, isMultiSelect) => {
    const state = get()
    const isSelected = state.selectedItems.some(i => i.id === item.id)

    if (!isMultiSelect) {
      set({
        selectedItem: item,
        selectedItems: [item],
        lastSelectedItem: item
      })
      return
    }

    if (isSelected) {
      state.deselectItem(item.id)
    } else {
      state.selectItem(item)
    }
  },

  clearSelection: () => {
    set({
      selectedItem: null,
      selectedItems: [],
      lastSelectedItem: null
    })
  },

  // Navegación
  setCurrentFolder: async (id: string) => {
    const state = get()
    state.clearSelection()
    set({ currentFolderId: id, currentCollectionId: null, currentTagId: null })
    await state.loadItems(`/api/folders/${id}/images/all`)
  },

  setCurrentCollection: async (id: string) => {
    const state = get()
    state.clearSelection()
    set({ currentFolderId: null, currentCollectionId: id, currentTagId: null })
    await state.loadItems(`/api/collections/${id}/images/all`)
  },

  setCurrentTag: async (id: string) => {
    const state = get()
    state.clearSelection()
    set({ currentFolderId: null, currentCollectionId: null, currentTagId: id })
    await state.loadItems(`/api/tags/${id}/images/all`)
  }
}))