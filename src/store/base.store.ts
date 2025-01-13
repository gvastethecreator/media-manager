import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const baseLogger = logger.withContext('BaseStore')

// Tipo para los nombres de modelos de Prisma
type PrismaModelName = Lowercase<keyof {
  [K in keyof PrismaClient as PrismaClient[K] extends { findMany: any } ? K : never]: true
}>

// Tipo para las entidades base
export interface BaseEntity {
  id: string
  name: string
  [key: string]: any
}

// Estado base
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

// Acciones base
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

// Store base completo
export type BaseStore<T extends BaseEntity> = BaseState<T> & BaseActions<T>

// Tipos para las funciones de estado
interface SetState<T extends BaseEntity> {
  (partial: Partial<BaseState<T>> | ((state: BaseState<T> & BaseActions<T>) => Partial<BaseState<T>>)): void
}

interface GetState<T extends BaseEntity> {
  (): BaseState<T> & BaseActions<T>
}

// Opciones para la creación del store
interface StoreOptions {
  itemsPerPage?: number
  customLogger?: typeof logger
}

// Función principal para crear el store
export const createBaseStore = <T extends BaseEntity>(
  modelName: PrismaModelName,
  apiEndpoint: string,
  options: StoreOptions = {}
) => {
  const storeLogger = (options.customLogger || baseLogger).withContext(modelName)
  const ITEMS_PER_PAGE = options.itemsPerPage || 50

  return (set: SetState<T>, get: GetState<T>): BaseStore<T> => ({
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

        set((state) => ({
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
      await state.clearSelection()
      await state.loadItems()
    },

    // Acciones de selección
    selectItem: (item: T) => {
      set((state) => ({
        selectedItem: item,
        selectedItems: [...state.selectedItems, item],
        lastSelectedItem: item
      }))
    },

    deselectItem: (id: string) => {
      set((state) => ({
        selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
        selectedItems: state.selectedItems.filter((item: T) => item.id !== id),
        lastSelectedItem: state.lastSelectedItem?.id === id ? null : state.lastSelectedItem
      }))
    },

    toggleItemSelection: (item: T, isMultiSelect: boolean) => {
      const state = get()
      const isSelected = state.selectedItems.some((i: T) => i.id === item.id)

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
    createItem: async (data: Partial<T>) => {
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

        set((state) => ({
          items: [...state.items, newItem],
          loading: false
        }))
      } catch (error: any) {
        storeLogger.error('❌ Error al crear item:', error)
        set({ error, loading: false })
      }
    },

    updateItem: async (id: string, data: Partial<T>) => {
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

        set((state) => ({
          items: state.items.map((item: T) =>
            item.id === id ? updatedItem : item
          ),
          loading: false
        }))
      } catch (error: any) {
        storeLogger.error('❌ Error al actualizar item:', error)
        set({ error, loading: false })
      }
    },

    deleteItem: async (id: string) => {
      try {
        set({ loading: true, error: null })
        storeLogger.info('🗑️ Eliminando item:', id)

        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error(`Error al eliminar ${modelName}`)

        storeLogger.info('✅ Item eliminado:', id)

        set((state) => ({
          items: state.items.filter((item: T) => item.id !== id),
          loading: false
        }))
      } catch (error: any) {
        storeLogger.error('❌ Error al eliminar item:', error)
        set({ error, loading: false })
      }
    }
  })
}