import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { produce } from 'immer'
import { mockCollections, mockFiles, mockFolders, mockTags, mockStats } from '@/lib/mock-data'

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
  selectedItems: Set<string>
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
      selectedItems: new Set(),
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

      setCurrentView: (currentView) => set({ currentView }),

      selectItem: (id, multiSelect = false) => set(produce((state: FilesState) => {
        if (!multiSelect) {
          state.selectedItems.clear()
        }
        state.selectedItems.add(id)
      })),

      deselectItem: (id) => set(produce((state: FilesState) => {
        state.selectedItems.delete(id)
      })),

      clearSelection: () => set(produce((state: FilesState) => {
        state.selectedItems.clear()
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
            selectedItems: new Set()
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
            selectedItems: new Set()
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
            selectedItems: new Set()
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

// Selectores memoizados
export const useFilteredAndSortedItems = () => {
  const { currentItems, sortBy, sortOrder, searchQuery } = useFilesStore()

  return useMemo(() => {
    let filtered = currentItems

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return [...filtered].sort((a, b) => sortFunctions[sortBy](a, b, sortOrder))
  }, [currentItems, sortBy, sortOrder, searchQuery])
}

export const useSelectedItem = () => {
  const { currentItems, selectedItems } = useFilesStore()

  return useMemo(() => {
    if (selectedItems.size !== 1) return null
    return currentItems.find(item => selectedItems.has(item.id)) || null
  }, [currentItems, selectedItems])
}