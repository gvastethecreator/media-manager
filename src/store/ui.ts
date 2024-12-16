import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { produce } from 'immer'

export type ViewMode = 'grid' | 'list' | 'details'
export type ThumbnailSize = 'small' | 'medium' | 'large'

interface UIState {
  view: ViewMode
  thumbnailSize: ThumbnailSize
  zoomLevel: number
  isSettingsOpen: boolean
  isRightPanelCollapsed: boolean
  searchQuery: string
  theme: 'light' | 'dark' | 'system'

  // Acciones
  setView: (view: ViewMode) => void
  setThumbnailSize: (size: ThumbnailSize) => void
  setZoomLevel: (level: number) => void
  toggleSettings: () => void
  toggleRightPanel: () => void
  setSearchQuery: (query: string) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

// Constantes
const MIN_ZOOM = 50
const MAX_ZOOM = 200
const DEFAULT_ZOOM = 100

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      view: 'grid',
      thumbnailSize: 'medium',
      zoomLevel: DEFAULT_ZOOM,
      isSettingsOpen: false,
      isRightPanelCollapsed: false,
      searchQuery: '',
      theme: 'system',

      setView: (view) => set({ view }),

      setThumbnailSize: (thumbnailSize) => set(
        produce((state: UIState) => {
          state.thumbnailSize = thumbnailSize
          // Ajustar zoom según el tamaño de miniatura
          if (thumbnailSize === 'small') state.zoomLevel = 75
          else if (thumbnailSize === 'large') state.zoomLevel = 150
          else state.zoomLevel = 100
        })
      ),

      setZoomLevel: (zoomLevel) => set(
        produce((state: UIState) => {
          const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel))
          state.zoomLevel = clampedZoom
          // Ajustar tamaño de miniatura según el zoom
          if (clampedZoom <= 75) state.thumbnailSize = 'small'
          else if (clampedZoom >= 150) state.thumbnailSize = 'large'
          else state.thumbnailSize = 'medium'
        })
      ),

      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      toggleRightPanel: () => set((state) => ({ isRightPanelCollapsed: !state.isRightPanelCollapsed })),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setTheme: (theme) => set({ theme })
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        view: state.view,
        thumbnailSize: state.thumbnailSize,
        isRightPanelCollapsed: state.isRightPanelCollapsed,
        theme: state.theme
      })
    }
  )
)

// Selectores memoizados
export const useViewSettings = () => {
  const { view, thumbnailSize, zoomLevel } = useUIStore()
  return { view, thumbnailSize, zoomLevel }
}

export const usePanelSettings = () => {
  const { isSettingsOpen, isRightPanelCollapsed } = useUIStore()
  return { isSettingsOpen, isRightPanelCollapsed }
}

export const useThemeSetting = () => {
  const { theme } = useUIStore()
  return theme
}