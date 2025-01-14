import { create } from 'zustand'
import type { FileItem } from '@/types/file-item'
import { getFolderImages } from '@/app/actions/folder.actions'
import { getCollectionImages } from '@/app/actions/collection.actions'
import { logger } from '@/lib/logger'

const fileManagerLogger = logger.withContext('FileManagerStore')

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
  currentAlbumId: string | null
  currentCharacterId: string | null
  currentPlaceId: string | null
  currentObjectId: string | null

  // Objetos actuales
  currentCollection: { id: string; name: string; count: number; color?: string; emoji?: string } | null
  currentFolder: { id: string; name: string; count: number } | null
  currentTag: string | null
  currentAlbum: { id: string; name: string; count: number; emoji: string } | null
  currentCharacter: { id: string; name: string; count: number; emoji: string } | null
  currentPlace: { id: string; name: string; count: number; emoji: string } | null
  currentObject: { id: string; name: string; count: number; emoji: string } | null

  // Metadatos
  collections: { id: string; name: string; count: number; color?: string; emoji?: string }[]
  folders: { id: string; name: string; count: number }[]
  tags: { id: string; name: string; count: number; color: string }[]
  albums: { id: string; name: string; count: number; emoji: string }[]
  characters: { id: string; name: string; count: number; emoji: string }[]
  places: { id: string; name: string; count: number; emoji: string }[]
  objects: { id: string; name: string; count: number; emoji: string }[]

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
  setCurrentAlbum: (id: string) => Promise<void>
  setCurrentCharacter: (id: string) => Promise<void>
  setCurrentPlace: (id: string) => Promise<void>
  setCurrentObject: (id: string) => Promise<void>

  // Acciones de estado
  setItems: (items: FileItem[]) => void
  setIsLoading: (loading: boolean) => void
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
  currentAlbumId: null,
  currentCharacterId: null,
  currentPlaceId: null,
  currentObjectId: null,
  currentCollection: null,
  currentFolder: null,
  currentTag: null,
  currentAlbum: null,
  currentCharacter: null,
  currentPlace: null,
  currentObject: null,
  isLoading: false,
  error: null,
  collections: [],
  folders: [],
  tags: [],
  albums: [],
  characters: [],
  places: [],
  objects: [],
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
        tags: stats.tags || [],
        albums: stats.albums || [],
        characters: stats.characters || [],
        places: stats.places || [],
        objects: stats.objects || []
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
    try {
      const state = get()
      const folder = state.folders.find(f => f.id === id) || null
      state.clearSelection()
      set({
        currentFolderId: id,
        currentCollectionId: null,
        currentTagId: null,
        currentFolder: folder,
        currentCollection: null,
        currentTag: null,
        isLoading: true
      })

      const images = await getFolderImages(id)
      set({
        currentItems: images,
        displayedItems: images.slice(0, ITEMS_PER_BATCH),
        isLoading: false
      })
    } catch (error) {
      fileManagerLogger.error('Error al cargar carpeta:', error)
      set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false })
    }
  },

  setCurrentCollection: async (id: string) => {
    try {
      const state = get()
      const collection = state.collections.find(c => c.id === id) || null
      state.clearSelection()
      set({
        currentFolderId: null,
        currentCollectionId: id,
        currentTagId: null,
        currentFolder: null,
        currentCollection: collection,
        currentTag: null,
        isLoading: true
      })

      const images = await getCollectionImages(id)
      set({
        currentItems: images,
        displayedItems: images.slice(0, ITEMS_PER_BATCH),
        isLoading: false
      })
    } catch (error) {
      fileManagerLogger.error('Error al cargar colección:', error)
      set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false })
    }
  },

  setCurrentTag: async (id: string) => {
    const state = get()
    state.clearSelection()
    set({
      currentFolderId: null,
      currentCollectionId: null,
      currentTagId: id,
      currentFolder: null,
      currentCollection: null,
      currentTag: id
    })
    await state.loadItems(`/api/tags/${id}/images/all`)
  },

  setCurrentAlbum: async (id: string) => {
    const state = get()
    const album = state.albums.find(a => a.id === id) || null
    state.clearSelection()
    set({
      currentFolderId: null,
      currentCollectionId: null,
      currentTagId: null,
      currentAlbumId: id,
      currentCharacterId: null,
      currentPlaceId: null,
      currentObjectId: null,
      currentFolder: null,
      currentCollection: null,
      currentTag: null,
      currentAlbum: album,
      currentCharacter: null,
      currentPlace: null,
      currentObject: null
    })
    await state.loadItems(`/api/albums/${id}/images/all`)
  },

  setCurrentCharacter: async (id: string) => {
    const state = get()
    const character = state.characters.find(c => c.id === id) || null
    state.clearSelection()
    set({
      currentFolderId: null,
      currentCollectionId: null,
      currentTagId: null,
      currentAlbumId: null,
      currentCharacterId: id,
      currentPlaceId: null,
      currentObjectId: null,
      currentFolder: null,
      currentCollection: null,
      currentTag: null,
      currentAlbum: null,
      currentCharacter: character,
      currentPlace: null,
      currentObject: null
    })
    await state.loadItems(`/api/characters/${id}/images/all`)
  },

  setCurrentPlace: async (id: string) => {
    const state = get()
    const place = state.places.find(p => p.id === id) || null
    state.clearSelection()
    set({
      currentFolderId: null,
      currentCollectionId: null,
      currentTagId: null,
      currentAlbumId: null,
      currentCharacterId: null,
      currentPlaceId: id,
      currentObjectId: null,
      currentFolder: null,
      currentCollection: null,
      currentTag: null,
      currentAlbum: null,
      currentCharacter: null,
      currentPlace: place,
      currentObject: null
    })
    await state.loadItems(`/api/places/${id}/images/all`)
  },

  setCurrentObject: async (id: string) => {
    const state = get()
    const object = state.objects.find(o => o.id === id) || null
    state.clearSelection()
    set({
      currentFolderId: null,
      currentCollectionId: null,
      currentTagId: null,
      currentAlbumId: null,
      currentCharacterId: null,
      currentPlaceId: null,
      currentObjectId: id,
      currentFolder: null,
      currentCollection: null,
      currentTag: null,
      currentAlbum: null,
      currentCharacter: null,
      currentPlace: null,
      currentObject: object
    })
    await state.loadItems(`/api/objects/${id}/images/all`)
  },

  // Acciones de estado
  setItems: (items) => {
    set({
      currentItems: items,
      displayedItems: items.slice(0, ITEMS_PER_BATCH)
    })
  },

  setIsLoading: (loading) => {
    set({ isLoading: loading })
  }
}))