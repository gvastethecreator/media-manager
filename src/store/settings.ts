import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ViewSettings {
  defaultView: 'grid' | 'list' | 'details'
  showHiddenFiles: boolean
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortDirection: 'asc' | 'desc'
  thumbnailSize: 'sm' | 'md' | 'lg'
}

export interface ThumbnailSettings {
  quality: 'low' | 'medium' | 'high'
  generateOnUpload: boolean
  maxSize: number
}

interface SettingsState {
  view: ViewSettings
  thumbnails: ThumbnailSettings

  // Acciones
  updateView: (settings: Partial<ViewSettings>) => void
  updateThumbnails: (settings: Partial<ThumbnailSettings>) => void
  resetToDefaults: () => void
}

const defaultSettings: Omit<SettingsState, 'updateView' | 'updateThumbnails' | 'resetToDefaults'> = {
  view: {
    defaultView: 'grid',
    showHiddenFiles: false,
    sortBy: 'name',
    sortDirection: 'asc',
    thumbnailSize: 'md'
  },
  thumbnails: {
    quality: 'medium',
    generateOnUpload: true,
    maxSize: 500
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateView: (settings) =>
        set((state) => ({
          view: { ...state.view, ...settings }
        })),

      updateThumbnails: (settings) =>
        set((state) => ({
          thumbnails: { ...state.thumbnails, ...settings }
        })),

      resetToDefaults: () => set(defaultSettings)
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        view: state.view,
        thumbnails: state.thumbnails
      }),
      migrate: (persistedState: any) => {
        if (persistedState && typeof persistedState === 'object') {
          return {
            ...defaultSettings,
            ...persistedState,
            view: {
              ...defaultSettings.view,
              ...persistedState?.view,
              thumbnailSize: persistedState?.view?.thumbnailSize || 'md'
            }
          }
        }
        return defaultSettings
      }
    }
  )
)