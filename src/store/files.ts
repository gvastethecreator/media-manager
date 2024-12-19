import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FileItem } from '@/types/files'
import { getFiles, getFilesByFolder, getCollectionFiles, getTaggedFiles } from '@/services/files.service'
import { folderService } from '@/services/folder.service'

interface FilesState {
  currentView: string
  currentPath: string[]
  currentItems: FileItem[]
  selectedIds: string[]
  collections: Array<{ id: string; name: string; count: number; color?: string }>
  folders: Array<{ id: string; name: string; count: number; path: string }>
  tags: Array<{ id: string; name: string; count: number; color?: string }>
  sortBy: string
  sortOrder: 'asc' | 'desc'
  isLoading: boolean
  error: string | null
  initialize: () => Promise<void>
  loadCollections: () => Promise<void>
  loadFolders: () => Promise<void>
  loadTags: () => Promise<void>
  setCurrentView: (view: string) => void
  setCurrentPath: (path: string[]) => void
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  selectItem: (id: string, clearSelection?: boolean) => void
  deselectItem: (id: string) => void
  clearSelection: () => void
  handleSelectCollection: (id: string) => void
  handleSelectFolder: (id: string) => void
  handleSelectTag: (name: string) => void
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      currentView: 'files',
      currentPath: ['Home'],
      currentItems: [],
      selectedIds: [],
      collections: [],
      folders: [],
      tags: [],
      sortBy: 'name',
      sortOrder: 'asc',
      isLoading: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          await Promise.all([
            get().loadCollections(),
            get().loadFolders(),
            get().loadTags()
          ]);
          const files = await getFiles();
          set({ 
            currentView: 'files',
            currentPath: ['Home'],
            currentItems: files,
            selectedIds: [],
            isLoading: false 
          });
        } catch (error) {
          console.error('Error initializing files store:', error);
          set({ 
            error: 'Error al cargar los archivos',
            isLoading: false 
          });
        }
      },

      loadCollections: async () => {
        try {
          const response = await fetch('/api/collections');
          if (!response.ok) throw new Error('Error al cargar colecciones');
          const collections = await response.json();
          set({ collections });
        } catch (error) {
          console.error('Error loading collections:', error);
        }
      },

      loadFolders: async () => {
        try {
          const folders = await folderService.getFolders();
          set({ folders: folders.map(folder => ({
            id: folder.id,
            name: folder.name,
            path: folder.path,
            count: folder.totalFiles || 0
          })) });
        } catch (error) {
          console.error('Error loading folders:', error);
        }
      },

      loadTags: async () => {
        try {
          const response = await fetch('/api/tags');
          if (!response.ok) throw new Error('Error al cargar etiquetas');
          const tags = await response.json();
          set({ tags });
        } catch (error) {
          console.error('Error loading tags:', error);
        }
      },

      setCurrentView: async (currentView) => {
        try {
          set({ isLoading: true, error: null });
          let items: FileItem[] = [];

          switch (currentView) {
            case 'files':
              items = await getFiles();
              break;
            case 'folders':
              const folders = await folderService.getFolders();
              items = folders.map(folder => ({
                id: folder.id,
                name: folder.name,
                path: folder.path,
                type: 'folder',
                isDirectory: true,
                size: folder.totalSize || 0,
                lastModified: folder.updatedAt,
                metadata: {
                  totalFiles: folder.totalFiles || 0
                }
              }));
              break;
            case 'collections':
            case 'tags':
              // Por ahora dejamos estas vistas vacías
              items = [];
              break;
          }
          
          set({
            currentView,
            currentItems: items,
            isLoading: false,
            selectedIds: []
          });
        } catch (error) {
          console.error('Error setting current view:', error);
          set({ 
            error: 'Error al cambiar de vista',
            isLoading: false 
          });
        }
      },

      setCurrentPath: (currentPath) => set({ currentPath }),
      setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
      
      selectItem: (id, clearSelection = false) => 
        set((state) => ({
          selectedIds: clearSelection ? [id] : [...state.selectedIds, id]
        })),
        
      deselectItem: (id) => 
        set((state) => ({
          selectedIds: state.selectedIds.filter(selectedId => selectedId !== id)
        })),

      clearSelection: () => set({ selectedIds: [] }),

      handleSelectCollection: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const files = await getCollectionFiles(id);
          set({
            currentItems: files,
            selectedIds: [],
            isLoading: false
          });
        } catch (error) {
          console.error('Error loading collection files:', error);
          set({ 
            error: 'Error al cargar la colección',
            isLoading: false 
          });
        }
      },

      handleSelectFolder: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const files = await getFilesByFolder(id);
          set({
            currentItems: files,
            selectedIds: [],
            isLoading: false
          });
        } catch (error) {
          console.error('Error loading folder files:', error);
          set({ 
            error: 'Error al cargar la carpeta',
            isLoading: false 
          });
        }
      },

      handleSelectTag: async (name) => {
        try {
          set({ isLoading: true, error: null });
          const files = await getTaggedFiles(name);
          set({
            currentItems: files,
            selectedIds: [],
            isLoading: false
          });
        } catch (error) {
          console.error('Error loading tagged files:', error);
          set({ 
            error: 'Error al cargar los archivos etiquetados',
            isLoading: false 
          });
        }
      }
    }),
    {
      name: 'files-storage',
      version: 1,
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
  return [...items].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) {
      return sortOrder === 'asc' ? -1 : 1
    }
    if (a[sortBy] > b[sortBy]) {
      return sortOrder === 'asc' ? 1 : -1
    }
    return 0
  })
}

export const useSelectedItem = () => useFilesStore(state => state.selectedItem)

export const useSelectedIds = () => useFilesStore(state => state.selectedIds)