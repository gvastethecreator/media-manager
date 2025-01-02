import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FileItem } from '@/types/files'
import { getFiles, getFilesByFolder, getCollectionFiles, getTaggedFiles } from '@/app/actions/files'
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
  currentFolderId: string | null
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
  handleSelectFolder: (id: string) => Promise<void>
  handleSelectTag: (name: string) => void
  selectedItem: FileItem | null
  currentCollectionId: string | null
  currentTagId: string | null
  loadAllImages: () => Promise<void>
  loadFavorites: () => Promise<void>
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      currentView: 'folders',
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
      currentFolderId: null,
      selectedItem: null,
      currentCollectionId: null,
      currentTagId: null,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          await Promise.all([
            get().loadCollections(),
            get().loadFolders(),
            get().loadTags()
          ]);
          set({
            currentView: 'folders',
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
          set({ isLoading: true, error: null });
          const folders = await folderService.getFolders();
          set({
            folders: folders.map(folder => ({
              id: folder.id,
              name: folder.name,
              path: folder.path,
              count: folder._count.images
            }))
          });
        } catch (error) {
          console.error('Error loading folders:', error);
          set({
            error: 'Error al cargar las carpetas',
            isLoading: false
          });
        } finally {
          set({ isLoading: false });
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
        console.log('Cambiando vista a:', currentView);
        try {
          set({ isLoading: true, error: null });
          let items: FileItem[] = [];

          switch (currentView) {
            case 'files':
              const currentPath = get().currentPath;
              const path = currentPath.length > 1 ? currentPath.join('/') : undefined;
              items = await getFiles(path);
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
                  totalFiles: folder._count.images
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
          set({ isLoading: true, error: null, currentCollectionId: id });
          const files = await getCollectionFiles(id);
          set({
            currentItems: files,
            currentView: 'collections',
            isLoading: false
          });
        } catch (error) {
          console.error('Error loading collection files:', error);
          set({
            error: 'Error al cargar archivos de la colección',
            isLoading: false
          });
        }
      },

      handleSelectFolder: async (id) => {
        try {
          console.log('Cargando archivos de la carpeta:', id);
          set({ isLoading: true, error: null, currentFolderId: id });
          const files = await getFilesByFolder(id);
          console.log('Archivos cargados:', files);
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
          set({ isLoading: true, error: null, currentTagId: name });
          const files = await getTaggedFiles(name);
          set({
            currentItems: files,
            currentView: 'tags',
            isLoading: false
          });
        } catch (error) {
          console.error('Error loading tagged files:', error);
          set({
            error: 'Error al cargar archivos etiquetados',
            isLoading: false
          });
        }
      },

      loadAllImages: async () => {
        try {
          set({ isLoading: true, error: null });
          const files = await getFiles();
          set({
            currentItems: files,
            currentView: 'all',
            isLoading: false
          });
        } catch (error) {
          console.error('Error loading all images:', error);
          set({
            error: 'Error al cargar todas las imágenes',
            isLoading: false
          });
        }
      },

      loadFavorites: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch('/api/favorites');
          if (!response.ok) throw new Error('Error al cargar favoritos');
          const files = await response.json();
          set({
            currentItems: files,
            currentView: 'favorites',
            isLoading: false
          });
        } catch (error) {
          console.error('Error loading favorites:', error);
          set({
            error: 'Error al cargar favoritos',
            isLoading: false
          });
        }
      },
    }),
    {
      name: 'files-storage',
      version: 1,
      partialize: (state) => ({
        currentView: state.currentView,
        currentPath: state.currentPath,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
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