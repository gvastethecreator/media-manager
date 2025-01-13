import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const baseLogger = logger.withContext('BaseStore')

type PrismaModels = {
  [K in keyof PrismaClient]: PrismaClient[K] extends { findMany: any } ? K : never
}[keyof PrismaClient]

export interface BaseEntity {
  id: string
  name: string
  [key: string]: any
}

export interface BaseState<T extends BaseEntity> {
  items: T[]
  loading: boolean
  error: Error | null
  currentPage: number
  totalPages: number
  itemsPerPage: number
  selectedItem: T | null
  selectedItems: T[]
  lastSelectedItem: T | null
}

export interface BaseActions<T extends BaseEntity> {
  loadItems: () => Promise<void>
  loadMoreItems: () => Promise<void>
  refreshItems: () => Promise<void>
  selectItem: (item: T) => void
  deselectItem: (id: string) => void
  toggleItemSelection: (item: T, isMultiSelect: boolean) => void
  clearSelection: () => void
  createItem: (data: Partial<T>) => Promise<void>
  updateItem: (id: string, data: Partial<T>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

export type BaseStore<T extends BaseEntity> = BaseState<T> & BaseActions<T>

export const createBaseStore = <T extends BaseEntity>(
  modelName: PrismaModels,
  apiEndpoint: string,
  options: {
    itemsPerPage?: number
    customLogger?: typeof logger
  } = {}
) => {
  const storeLogger = (options.customLogger || baseLogger).withContext(modelName)
  const ITEMS_PER_PAGE = options.itemsPerPage || 50

  return (set: any, get: any) => ({
    // Estado inicial
    items: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: ITEMS_PER_PAGE,
    selectedItem: null,
    selectedItems: [],
    lastSelectedItem: null,

    // Acciones de carga
    loadItems: async () => {
      try {
        set({ loading: true, error: null })
        storeLogger.info('🔄 Cargando items...')

        const response = await fetch(`${apiEndpoint}?page=1&limit=${ITEMS_PER_PAGE}`)
        if (!response.ok) throw new Error(`Error al cargar ${modelName}`)

        const data = await response.json()
        storeLogger.info(`✅ ${data.items.length} items cargados`)

        set({
          items: data.items,
          currentPage: data.page,
          totalPages: data.totalPages,
          loading: false
        })
      } catch (error: any) {
        storeLogger.error('❌ Error al cargar items:', error)
        set({ error, loading: false })
      }
    },

    loadMoreItems: async () => {
      const state = get()
      if (state.loading || state.currentPage >= state.totalPages) return

      try {
        set({ loading: true })
        const nextPage = state.currentPage + 1
        const response = await fetch(`${apiEndpoint}?page=${nextPage}&limit=${ITEMS_PER_PAGE}`)

        if (!response.ok) throw new Error(`Error al cargar más ${modelName}`)

        const data = await response.json()
        storeLogger.info(`✅ ${data.items.length} items adicionales cargados`)

        set(state => ({
          items: [...state.items, ...data.items],
          currentPage: data.page,
          loading: false
        }))
      } catch (error: any) {
        storeLogger.error('❌ Error al cargar más items:', error)
        set({ error, loading: false })
      }
    },

    refreshItems: async () => {
      const state = get()
      state.clearSelection()
      await state.loadItems()
    },

    // Acciones de selección
    selectItem: (item) => {
      set(state => ({
        selectedItem: item,
        selectedItems: [...state.selectedItems, item],
        lastSelectedItem: item
      }))
    },

    deselectItem: (id) => {
      set(state => ({
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
          selectedItem: isSelected ? null : item,
          selectedItems: isSelected ? [] : [item],
          lastSelectedItem: isSelected ? null : item
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

    // Acciones CRUD
    createItem: async (data) => {
      try {
        set({ loading: true, error: null })
        storeLogger.info('📤 Creando item:', data)

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        if (!response.ok) throw new Error(`Error al crear ${modelName}`)

        const newItem = await response.json()
        storeLogger.info('✅ Item creado:', newItem)

        set(state => ({
          items: [...state.items, newItem],
          loading: false
        }))
      } catch (error: any) {
        storeLogger.error('❌ Error al crear item:', error)
        set({ error, loading: false })
      }
    },

    updateItem: async (id, data) => {
      try {
        set({ loading: true, error: null })
        storeLogger.info('📤 Actualizando item:', { id, data })

        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        if (!response.ok) throw new Error(`Error al actualizar ${modelName}`)

        const updatedItem = await response.json()
        storeLogger.info('✅ Item actualizado:', updatedItem)

        set(state => ({
          items: state.items.map(item =>
            item.id === id ? updatedItem : item
          ),
          loading: false
        }))
      } catch (error: any) {
        storeLogger.error('❌ Error al actualizar item:', error)
        set({ error, loading: false })
      }
    },

    deleteItem: async (id) => {
      try {
        set({ loading: true, error: null })
        storeLogger.info('🗑️ Eliminando item:', id)

        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error(`Error al eliminar ${modelName}`)

        storeLogger.info('✅ Item eliminado:', id)

        set(state => ({
          items: state.items.filter(item => item.id !== id),
          loading: false
        }))
      } catch (error: any) {
        storeLogger.error('❌ Error al eliminar item:', error)
        set({ error, loading: false })
      }
    }
  })
}