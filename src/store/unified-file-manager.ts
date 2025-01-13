import { create } from 'zustand'
import type { FileItem } from '@/types/file-item'
import { debounce } from '@/lib/utils'

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

  // Cola de operaciones
  operationQueue: Promise<any>[]
  isProcessingQueue: boolean

  // Acciones
  initialize: () => Promise<void>
  loadItems: (url: string) => Promise<void>
  loadMoreItems: () => void
  selectItem: (item: FileItem) => void
  deselectItem: (id: string) => void
  toggleItemSelection: (item: FileItem, isMultiSelect: boolean) => void
  clearSelection: () => void
  setCurrentFolder: (id: string) => Promise<void>
  setCurrentCollection: (id: string) => Promise<void>
  setCurrentTag: (id: string) => Promise<void>
  setCurrentAlbum: (id: string) => Promise<void>
  setCurrentCharacter: (id: string) => Promise<void>
  setCurrentPlace: (id: string) => Promise<void>
  setCurrentObject: (id: string) => Promise<void>
}

const ITEMS_PER_BATCH = 50
const DEBOUNCE_DELAY = 300

class OperationQueue {
  private queue: Array<() => Promise<any>> = []
  private isProcessing = false

  async add<T>(operation: () => Promise<T>): Promise<T> {
    const promise = new Promise<T>((resolve, reject) => {
      this.queue.push(
        async () => {
          try {
            const result = await operation()
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }
      )
    })

    if (!this.isProcessing) {
      this.processQueue()
    }

    return promise
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true

    while (this.queue.length > 0) {
      const operation = this.queue.shift()
      if (operation) {
        try {
          await operation()
        } catch (error) {
          console.error('Error processing operation:', error)
        }
      }
    }

    this.isProcessing = false
  }
}

const operationQueue = new OperationQueue()

export const useUnifiedFileManager = create<FileManagerState>((set, get) => ({
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
  operationQueue: [],
  isProcessingQueue: false,

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

  // Carga de items con debounce
  loadItems: async (url: string) => {
    const state = get()
    if (state.isLoading) return

    try {
      console.log('🔄 Iniciando carga de items:', { url })
      set({ isLoading: true, error: null })
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error al cargar datos desde ${url}: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const items = Array.isArray(data) ? data : data.items || []

      if (!Array.isArray(items)) {
        throw new Error('El formato de respuesta es inválido')
      }

      const displayedItems = items.slice(0, ITEMS_PER_BATCH)

      console.log('✅ Items cargados:', {
        url,
        itemCount: items.length,
        displayedCount: displayedItems.length,
        firstItem: items[0]?.id,
        lastItem: items[items.length - 1]?.id
      })

      set({
        currentItems: items,
        displayedItems,
        isProcessingThumbnails: true,
        error: null
      })
    } catch (error) {
      console.error('❌ Error al cargar items:', {
        url,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      })
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        currentItems: [],
        displayedItems: [],
        isProcessingThumbnails: false
      })
    } finally {
      set({ isLoading: false, isProcessingThumbnails: false })
    }
  },

  loadMoreItems: () => {
    const state = get()
    const currentLength = state.displayedItems?.length || 0
    if (currentLength >= (state.currentItems?.length || 0)) {
      console.log('📂 No hay más items para cargar:', {
        displayedCount: currentLength,
        totalItems: state.currentItems?.length || 0
      })
      return
    }

    const nextBatch = state.currentItems.slice(
      currentLength,
      currentLength + ITEMS_PER_BATCH
    )

    console.log('🔄 Cargando más items:', {
      currentLength,
      batchSize: nextBatch.length,
      newTotal: currentLength + nextBatch.length,
      totalItems: state.currentItems.length
    })

    set((state) => ({
      ...state,
      displayedItems: [...(state.displayedItems || []), ...nextBatch]
    }))
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

  // Navegación con manejo de concurrencia mejorado
  setCurrentFolder: async (id: string) => {
    const state = get()
    if (state.currentFolderId === id && state.currentItems.length > 0) {
      console.log('📂 Carpeta ya cargada:', {
        id,
        itemCount: state.currentItems.length,
        displayedCount: state.displayedItems?.length || 0
      })
      return
    }

    console.log('🔄 Cambiando carpeta actual:', {
      id,
      previousId: state.currentFolderId,
      hasItems: state.currentItems.length > 0,
      displayedCount: state.displayedItems?.length || 0
    })

    try {
      // Primero establecemos el estado de carga
      set({
        isLoading: true,
        error: null,
        currentItems: [],
        displayedItems: []
      })

      // Buscar la carpeta en el estado actual
      const folder = state.folders.find(f => f.id === id) || null
      console.log('📁 Información de carpeta:', {
        id,
        name: folder?.name,
        found: !!folder
      })

      // Actualizar la información de la carpeta
      set({
        currentFolder: folder,
        currentFolderId: id,
        currentCollectionId: null,
        currentTagId: null,
        currentAlbumId: null,
        currentCharacterId: null,
        currentPlaceId: null,
        currentObjectId: null,
        currentCollection: null,
        currentTag: null,
        currentAlbum: null,
        currentCharacter: null,
        currentPlace: null,
        currentObject: null
      })

      state.clearSelection()

      // Cargar los items de la carpeta
      const response = await fetch(`/api/folders/${id}/images/all`)
      if (!response.ok) {
        throw new Error(`Error al cargar datos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const items = data.items || []

      if (!Array.isArray(items)) {
        throw new Error('El formato de respuesta es inválido')
      }

      const displayedItems = items.slice(0, ITEMS_PER_BATCH)

      console.log('✅ Items de carpeta cargados:', {
        id,
        name: folder?.name,
        itemCount: items.length,
        displayedCount: displayedItems.length,
        firstItem: items[0]?.id,
        lastItem: items[items.length - 1]?.id
      })

      // Actualizar el estado con los items cargados en una sola operación
      set({
        currentItems: items,
        displayedItems,
        isProcessingThumbnails: true,
        error: null,
        isLoading: false
      })
    } catch (error) {
      console.error('❌ Error al cambiar carpeta:', {
        id,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      })

      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        currentItems: [],
        displayedItems: [],
        isProcessingThumbnails: false,
        isLoading: false
      })
    } finally {
      set({ isProcessingThumbnails: false })
    }
  },

  setCurrentCollection: async (id: string) => {
    const state = get()
    state.clearSelection()

    await operationQueue.add(async () => {
      const collection = state.collections.find(c => c.id === id) || null
      set({
        currentFolderId: null,
        currentCollectionId: id,
        currentTagId: null,
        currentAlbumId: null,
        currentCharacterId: null,
        currentPlaceId: null,
        currentObjectId: null,
        currentFolder: null,
        currentCollection: collection,
        currentTag: null,
        currentAlbum: null,
        currentCharacter: null,
        currentPlace: null,
        currentObject: null
      })
      await state.loadItems(`/api/collections/${id}/images/all`)
    })
  },

  setCurrentTag: async (id: string) => {
    const state = get()
    state.clearSelection()

    await operationQueue.add(async () => {
      set({
        currentFolderId: null,
        currentCollectionId: null,
        currentTagId: id,
        currentAlbumId: null,
        currentCharacterId: null,
        currentPlaceId: null,
        currentObjectId: null,
        currentFolder: null,
        currentCollection: null,
        currentTag: id,
        currentAlbum: null,
        currentCharacter: null,
        currentPlace: null,
        currentObject: null
      })
      await state.loadItems(`/api/tags/${id}/images/all`)
    })
  },

  setCurrentAlbum: async (id: string) => {
    const state = get()
    state.clearSelection()

    await operationQueue.add(async () => {
      const album = state.albums.find(a => a.id === id) || null
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
    })
  },

  setCurrentCharacter: async (id: string) => {
    const state = get()
    state.clearSelection()

    await operationQueue.add(async () => {
      const character = state.characters.find(c => c.id === id) || null
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
    })
  },

  setCurrentPlace: async (id: string) => {
    const state = get()
    state.clearSelection()

    await operationQueue.add(async () => {
      const place = state.places.find(p => p.id === id) || null
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
    })
  },

  setCurrentObject: async (id: string) => {
    const state = get()
    state.clearSelection()

    await operationQueue.add(async () => {
      const object = state.objects.find(o => o.id === id) || null
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
    })
  }
}))