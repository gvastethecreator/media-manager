import { create } from 'zustand'
import { mockCollections, mockFiles, mockFolders, mockTags, mockStats } from '@/lib/mock-data'

export type ViewType = 'collections' | 'folders' | 'tags' | 'files'

export interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  size: number
  modified: Date
  created: Date
  thumbnailUrl?: string
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
  selectedItem: FileItem | null
  collections: Collection[]
  folders: Folder[]
  tags: Tag[]
  currentPath: string[]
  isLoading: boolean
  error: string | null
  stats: typeof mockStats

  // Acciones
  setCurrentView: (view: ViewType) => void
  setSelectedItem: (item: FileItem | null) => void
  handleSelectCollection: (id: string) => void
  handleSelectFolder: (id: string) => void
  handleSelectTag: (name: string) => void
  setCurrentPath: (path: string[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useFilesStore = create<FilesState>()((set, get) => ({
  currentView: 'collections',
  currentItems: mockFiles,
  selectedItem: null,
  collections: mockCollections,
  folders: mockFolders,
  tags: mockTags,
  currentPath: [],
  isLoading: false,
  error: null,
  stats: mockStats,

  setCurrentView: (currentView) => set({ currentView }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
  handleSelectCollection: async (id) => {
    const collection = mockCollections.find(c => c.id === id)
    if (collection) {
      set({
        currentView: 'files',
        currentPath: ['Colecciones', collection.name],
        currentItems: mockFiles.filter(f =>
          collection.tags.some(tag => f.tags.includes(tag))
        )
      })
    }
  },
  handleSelectFolder: async (id) => {
    const folder = mockFolders.find(f => f.id === id)
    if (folder) {
      set({
        currentView: 'files',
        currentPath: ['Carpetas', folder.name],
        currentItems: mockFiles.filter(f =>
          f.path.startsWith(`/${folder.name}`)
        )
      })
    }
  },
  handleSelectTag: async (name) => {
    const tag = mockTags.find(t => t.name === name)
    if (tag) {
      set({
        currentView: 'files',
        currentPath: ['Etiquetas', tag.name],
        currentItems: mockFiles.filter(f =>
          f.tags.includes(tag.name)
        )
      })
    }
  },
  setCurrentPath: (currentPath) => set({ currentPath }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}))