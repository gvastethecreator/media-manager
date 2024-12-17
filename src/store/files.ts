import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { produce } from 'immer'
import { enableMapSet } from 'immer'
import { mockCollections, mockFiles, mockFolders, mockTags, mockStats } from '@/lib/mock-data'

// Habilitar el plugin MapSet
enableMapSet()

export type ViewType = 'collections' | 'folders' | 'tags' | 'files'
export type SortBy = 'name' | 'date' | 'size' | 'type'
export type SortOrder = 'asc' | 'desc'

// Funciones de utilidad para ordenamiento
const sortFunctions = {
  name: (a: FileItem, b: FileItem, order: SortOrder) =>
    order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  date: (a: FileItem, b: FileItem, order: SortOrder) =>
    order === 'asc' ? a.modified.getTime() - b.modified.getTime() : b.modified.getTime() - a.modified.getTime(),
  size: (a: FileItem, b: FileItem, order: SortOrder) =>
    order === 'asc' ? a.size - b.size : b.size - a.size,
  type: (a: FileItem, b: FileItem, order: SortOrder) =>
    order === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
}

export interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  size: number
  modified: Date
  created: Date
  url?: string
  thumbnailUrl?: string
  mimeType?: string
  width?: number
  height?: number
  duration?: number // Para videos
  fps?: number // Para videos y GIFs
  tags: string[]
  extension?: string
  prompt?: string
  model?: string
  loras?: string[]
  source?: string
  metadata?: {
    width?: number
    height?: number
    format?: string
    [key: string]: any
  }
}

export interface Collection {
  id: string
  name: string
  description: string
  thumbnails: string[]
  count: number
  totalSize: number
  tags: string[]
  color: string
  emoji?: string
}

export interface Folder {
  id: string
  name: string
  description: string
  thumbnails: string[]
  count: number
  totalSize: number
  color: string
}

export interface Tag {
  id: string
  name: string
  description: string
  thumbnails: string[]
  count: number
  totalSize: number
  color: string
}

interface FilesState {
  currentView: ViewType
  currentItems: FileItem[]
  selectedIds: string[]
  collections: Collection[]
  folders: Folder[]
  tags: Tag[]
  currentPath: string[]
  isLoading: boolean
  error: string | null
  stats: typeof mockStats
  sortBy: SortBy
  sortOrder: SortOrder
  searchQuery: string
  selectedItem: FileItem | null

  // Acciones
  setCurrentView: (view: ViewType) => void
  selectItem: (id: string, multiSelect?: boolean) => void
  deselectItem: (id: string) => void
  clearSelection: () => void
  handleSelectCollection: (id: string) => void
  handleSelectFolder: (id: string) => void
  handleSelectTag: (name: string) => void
  setCurrentPath: (path: string[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSorting: (by: SortBy, order: SortOrder) => void
  setSearchQuery: (query: string) => void
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      currentView: 'collections',
      currentItems: mockFiles,
      selectedIds: [],
      collections: mockCollections,
      folders: mockFolders,
      tags: mockTags,
      currentPath: [],
      isLoading: false,
      error: null,
      stats: mockStats,
      sortBy: 'name',
      sortOrder: 'asc',
      searchQuery: '',
      selectedItem: null,

      setCurrentView: (currentView) => set({ currentView }),

      selectItem: (id, multiSelect = false) => set(produce((state: FilesState) => {
        if (!multiSelect) {
          state.selectedIds = [id]
        } else if (!state.selectedIds.includes(id)) {
          state.selectedIds.push(id)
        }
        state.selectedItem = state.currentItems.find(item => item.id === id) || null
      })),

      deselectItem: (id) => set(produce((state: FilesState) => {
        state.selectedIds = state.selectedIds.filter(selectedId => selectedId !== id)
        state.selectedItem = null
      })),

      clearSelection: () => set(produce((state: FilesState) => {
        state.selectedIds = []
        state.selectedItem = null
      })),

      handleSelectCollection: async (id) => {
        const { collections, currentItems } = get()
        const collection = collections.find(c => c.id === id)
        if (collection) {
          set({
            currentView: 'files',
            currentPath: ['Colecciones', collection.name],
            currentItems: currentItems.filter(f =>
              collection.tags.some(tag => f.tags.includes(tag))
            ),
            selectedIds: [],
            selectedItem: null
          })
        }
      },

      handleSelectFolder: async (id) => {
        const { folders, currentItems } = get()
        const folder = folders.find(f => f.id === id)
        if (folder) {
          set({
            currentView: 'files',
            currentPath: ['Carpetas', folder.name],
            currentItems: currentItems.filter(f =>
              f.path.startsWith(`/${folder.name}`)
            ),
            selectedIds: [],
            selectedItem: null
          })
        }
      },

      handleSelectTag: async (name) => {
        const { tags, currentItems } = get()
        const tag = tags.find(t => t.name === name)
        if (tag) {
          set({
            currentView: 'files',
            currentPath: ['Etiquetas', tag.name],
            currentItems: currentItems.filter(f =>
              f.tags.includes(tag.name)
            ),
            selectedIds: [],
            selectedItem: null
          })
        }
      },

      setCurrentPath: (currentPath) => set({ currentPath }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
      setSearchQuery: (searchQuery) => set({ searchQuery })
    }),
    {
      name: 'files-storage',
      partialize: (state) => ({
        collections: state.collections,
        folders: state.folders,
        tags: state.tags,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
    }
  )
)

// Selectores
export const useFilteredItems = () => {
  const store = useFilesStore()
  const { currentItems, searchQuery } = store

  if (!searchQuery) return currentItems

  const query = searchQuery.toLowerCase()
  return currentItems.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.tags.some(tag => tag.toLowerCase().includes(query))
  )
}

export const useSortedItems = (items: FileItem[]) => {
  const { sortBy, sortOrder } = useFilesStore()
  return [...items].sort((a, b) => sortFunctions[sortBy](a, b, sortOrder))
}

export const useSelectedItem = () => useFilesStore(state => state.selectedItem)

export const useSelectedIds = () => useFilesStore(state => state.selectedIds)