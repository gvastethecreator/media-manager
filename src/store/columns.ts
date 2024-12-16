import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Column } from '@/components/file-view/file-view'
import { defaultColumns } from '@/components/file-view/file-view'

interface ColumnsState {
  columns: Column[]
  setColumns: (columns: Column[]) => void
  toggleColumn: (columnId: string) => void
  resetColumns: () => void
}

interface StoredColumn {
  id: string
  label: string
  width: number
  minWidth?: number
  isResizable?: boolean
  isHideable?: boolean
  isVisible: boolean
}

const reconstructColumns = (storedColumns: StoredColumn[]): Column[] => {
  return storedColumns.map(stored => {
    const defaultColumn = defaultColumns.find(d => d.id === stored.id)
    if (!defaultColumn) {
      console.warn(`No default column found for id: ${stored.id}`)
      return defaultColumns[0] // Fallback a la primera columna por defecto
    }
    return {
      ...stored,
      accessor: defaultColumn.accessor
    }
  })
}

export const useColumns = create<ColumnsState>()(
  persist(
    (set) => ({
      columns: defaultColumns,
      setColumns: (columns) => {
        console.log('Setting columns:', columns)
        set({ columns: reconstructColumns(columns) })
      },
      toggleColumn: (columnId) =>
        set((state) => {
          const newColumns = state.columns.map((col) =>
            col.id === columnId && col.isHideable
              ? { ...col, isVisible: !col.isVisible }
              : col
          )
          console.log('Toggling column:', columnId, newColumns)
          return { columns: reconstructColumns(newColumns) }
        }),
      resetColumns: () => {
        console.log('Resetting columns to default')
        set({ columns: defaultColumns })
      },
    }),
    {
      name: 'columns-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        columns: state.columns.map(({ accessor, ...rest }) => rest)
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Rehydrated state:', state)
          state.columns = reconstructColumns(state.columns)
        }
      }
    }
  )
)