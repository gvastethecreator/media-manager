import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ViewMode = 'grid' | 'list' | 'details'
type ThumbnailSize = 'small' | 'medium' | 'large'
type SortBy = 'name' | 'date' | 'size' | 'type'
type SortOrder = 'asc' | 'desc'

interface UIState {
  view: ViewMode
  thumbnailSize: ThumbnailSize
  zoomLevel: number
  isSettingsOpen: boolean
  isRightPanelCollapsed: boolean
  searchQuery: string
  navigationHistory: string[]
  currentHistoryIndex: number
  sortBy: SortBy
  sortOrder: SortOrder

  // Acciones
  setView: (view: ViewMode) => void
  setThumbnailSize: (size: ThumbnailSize) => void
  setZoomLevel: (level: number) => void
  toggleSettings: () => void
  toggleRightPanel: () => void
  setSearchQuery: (query: string) => void
  navigateBack: () => void
  navigateForward: () => void
  addToHistory: (path: string) => void
  setSorting: (by: SortBy, order: SortOrder) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      view: 'grid',
      thumbnailSize: 'medium',
      zoomLevel: 100,
      isSettingsOpen: false,
      isRightPanelCollapsed: false,
      searchQuery: '',
      navigationHistory: ['/'],
      currentHistoryIndex: 0,
      sortBy: 'name',
      sortOrder: 'asc',

      setView: (view) => set({ view }),
      setThumbnailSize: (thumbnailSize) => set({ thumbnailSize }),
      setZoomLevel: (zoomLevel) => {
        const size = zoomLevel >= 150 ? 'large' : zoomLevel >= 75 ? 'medium' : 'small'
        set({ zoomLevel, thumbnailSize: size as ThumbnailSize })
      },
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      toggleRightPanel: () => set((state) => ({ isRightPanelCollapsed: !state.isRightPanelCollapsed })),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      navigateBack: () => {
        const { currentHistoryIndex } = get()
        if (currentHistoryIndex > 0) {
          set({ currentHistoryIndex: currentHistoryIndex - 1 })
        }
      },
      navigateForward: () => {
        const { currentHistoryIndex, navigationHistory } = get()
        if (currentHistoryIndex < navigationHistory.length - 1) {
          set({ currentHistoryIndex: currentHistoryIndex + 1 })
        }
      },
      addToHistory: (path) => {
        const { navigationHistory, currentHistoryIndex } = get()
        const newHistory = [...navigationHistory.slice(0, currentHistoryIndex + 1), path]
        set({
          navigationHistory: newHistory,
          currentHistoryIndex: newHistory.length - 1
        })
      },
      setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder })
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        view: state.view,
        thumbnailSize: state.thumbnailSize,
        zoomLevel: state.zoomLevel,
        isRightPanelCollapsed: state.isRightPanelCollapsed,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
    }
  )
)