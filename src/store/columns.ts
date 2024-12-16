'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Column } from '@/config/columns'
import { defaultColumns } from '@/config/columns'

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
      ...defaultColumn,
      ...stored,
    }
  })
}

export const useColumns = create<ColumnsState>()(
  persist(
    (set) => ({
      columns: defaultColumns,
      setColumns: (columns) => set({ columns: reconstructColumns(columns) }),
      toggleColumn: (columnId) =>
        set((state) => {
          const newColumns = state.columns.map((col) =>
            col.id === columnId && col.isHideable
              ? { ...col, isVisible: !col.isVisible }
              : col
          )
          return { columns: newColumns }
        }),
      resetColumns: () => set({ columns: defaultColumns })
    }),
    {
      name: 'columns-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        columns: state.columns.map(col => ({
          id: col.id,
          label: col.label,
          width: col.width,
          minWidth: col.minWidth,
          isResizable: col.isResizable,
          isHideable: col.isHideable,
          isVisible: col.isVisible
        }))
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.columns = reconstructColumns(state.columns)
        }
      }
    }
  )
)