import { create } from 'zustand'

export interface SelectionState {
  // IDs de los elementos seleccionados
  selectedIds: string[]

  // ID del elemento activo (último seleccionado o sobre el que se está actuando)
  activeId: string | null

  // Métodos para manipular la selección
  setSelectedIds: (ids: string[]) => void
  addSelectedId: (id: string) => void
  removeSelectedId: (id: string) => void
  toggleSelectedId: (id: string) => void
  clearSelection: () => void
  selectAll: (allIds: string[]) => void
  invertSelection: (allIds: string[]) => void

  // Métodos para el elemento activo
  setActiveId: (id: string | null) => void

  // Helpers
  isSelected: (id: string) => boolean
  isActive: (id: string) => boolean
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  selectedIds: [],
  activeId: null,

  setSelectedIds: (ids) => set({ selectedIds: [...ids] }),

  addSelectedId: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds
      : [...state.selectedIds, id],
    activeId: id
  })),

  removeSelectedId: (id) => set((state) => ({
    selectedIds: state.selectedIds.filter(selectedId => selectedId !== id),
    activeId: state.activeId === id ? null : state.activeId
  })),

  toggleSelectedId: (id) => {
    const { selectedIds, addSelectedId, removeSelectedId } = get()
    if (selectedIds.includes(id)) {
      removeSelectedId(id)
    } else {
      addSelectedId(id)
    }
  },

  clearSelection: () => set({ selectedIds: [], activeId: null }),

  selectAll: (allIds) => set({
    selectedIds: [...allIds],
    activeId: allIds.length > 0 ? allIds[0] : null
  }),

  invertSelection: (allIds) => set((state) => {
    const newSelectedIds = allIds.filter(id => !state.selectedIds.includes(id))
    return {
      selectedIds: newSelectedIds,
      activeId: newSelectedIds.length > 0 ? newSelectedIds[0] : null
    }
  }),

  setActiveId: (id) => set({ activeId: id }),

  isSelected: (id) => get().selectedIds.includes(id),

  isActive: (id) => get().activeId === id
}))