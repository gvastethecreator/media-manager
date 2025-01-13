import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  AppSettings,
  Profile,
  Collection,
  Tag,
  Folder,
  ThumbnailSettings,
  SystemSettings,
  ThemeMode,
  Language,
  ThumbnailQuality,
  SortMode,
  DEFAULT_SETTINGS
} from '@/types/settings'

interface SettingsState extends AppSettings {
  // Acciones generales
  updateSettings: (settings: Partial<AppSettings>) => void
  resetSettings: () => void

  // Acciones de perfil
  updateProfile: (id: string | null, profile: Partial<Profile>) => void
  setActiveProfile: (id: string) => void
  deleteProfile: (id: string) => void

  // Acciones de colección
  updateCollection: (id: string | null, collection: Partial<Collection>) => void
  deleteCollection: (id: string) => void

  // Acciones de etiquetas
  updateTag: (id: string | null, tag: Partial<Tag>) => void
  deleteTag: (id: string) => void

  // Acciones de carpetas
  updateFolder: (id: string | null, folder: Partial<Folder>) => void
  deleteFolder: (id: string) => void

  // Acciones de miniaturas
  updateThumbnailSettings: (settings: Partial<ThumbnailSettings>) => void

  // Acciones de sistema
  updateSystemSettings: (settings: Partial<SystemSettings>) => void

  // Acciones de atajos
  updateShortcut: (action: string, keys: string) => void
  deleteShortcut: (action: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      // Acciones generales
      updateSettings: (newSettings) =>
        set((state) => ({
          ...state,
          ...newSettings,
          lastUpdate: new Date().toISOString()
        })),

      resetSettings: () =>
        set(() => ({
          ...DEFAULT_SETTINGS,
          lastUpdate: new Date().toISOString()
        })),

      // Acciones de perfil
      updateProfile: (id, profile) =>
        set((state) => {
          if (id === null) {
            // Crear nuevo perfil
            const newProfile: Profile = {
              id: crypto.randomUUID(),
              name: profile.name || 'Nuevo Perfil',
              emoji: profile.emoji || '👤',
              color: profile.color || '#3b82f6',
              theme: profile.theme || 'system',
              language: profile.language || 'es',
              isActive: false,
              ...profile
            }
            return {
              ...state,
              profiles: [...state.profiles, newProfile],
              lastUpdate: new Date().toISOString()
            }
          }

          // Actualizar perfil existente
          return {
            ...state,
            profiles: state.profiles.map((p) =>
              p.id === id ? { ...p, ...profile } : p
            ),
            lastUpdate: new Date().toISOString()
          }
        }),

      setActiveProfile: (id) =>
        set((state) => ({
          ...state,
          activeProfile: id,
          profiles: state.profiles.map((p) => ({
            ...p,
            isActive: p.id === id
          })),
          lastUpdate: new Date().toISOString()
        })),

      deleteProfile: (id) =>
        set((state) => ({
          ...state,
          profiles: state.profiles.filter((p) => p.id !== id),
          lastUpdate: new Date().toISOString()
        })),

      // Acciones de colección
      updateCollection: (id, collection) =>
        set((state) => {
          if (id === null) {
            // Crear nueva colección
            const newCollection: Collection = {
              id: crypto.randomUUID(),
              name: collection.name || 'Nueva Colección',
              emoji: collection.emoji || '📁',
              color: collection.color || '#3b82f6',
              sortBy: 'name' as SortMode,
              sortDirection: 'asc',
              filters: [],
              count: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...collection
            }
            return {
              ...state,
              collections: [...state.collections, newCollection],
              lastUpdate: new Date().toISOString()
            }
          }

          // Actualizar colección existente
          return {
            ...state,
            collections: state.collections.map((c) =>
              c.id === id ? { ...c, ...collection } : c
            ),
            lastUpdate: new Date().toISOString()
          }
        }),

      deleteCollection: (id) =>
        set((state) => ({
          ...state,
          collections: state.collections.filter((c) => c.id !== id),
          lastUpdate: new Date().toISOString()
        })),

      // Acciones de etiquetas
      updateTag: (id, tag) =>
        set((state) => {
          if (id === null) {
            // Crear nueva etiqueta
            const newTag: Tag = {
              id: crypto.randomUUID(),
              name: tag.name || 'Nueva Etiqueta',
              color: tag.color || '#3b82f6',
              count: 0,
              ...tag
            }
            return {
              ...state,
              tags: [...state.tags, newTag],
              lastUpdate: new Date().toISOString()
            }
          }

          // Actualizar etiqueta existente
          return {
            ...state,
            tags: state.tags.map((t) =>
              t.id === id ? { ...t, ...tag } : t
            ),
            lastUpdate: new Date().toISOString()
          }
        }),

      deleteTag: (id) =>
        set((state) => ({
          ...state,
          tags: state.tags.filter((t) => t.id !== id),
          lastUpdate: new Date().toISOString()
        })),

      // Acciones de carpetas
      updateFolder: (id, folder) =>
        set((state) => {
          if (id === null) {
            // Crear nueva carpeta
            const newFolder: Folder = {
              id: crypto.randomUUID(),
              name: folder.name || 'Nueva Carpeta',
              path: folder.path || '',
              isIndexed: false,
              lastIndexed: null,
              totalFiles: 0,
              totalSize: 0,
              ...folder
            }
            return {
              ...state,
              folders: [...state.folders, newFolder],
              lastUpdate: new Date().toISOString()
            }
          }

          // Actualizar carpeta existente
          return {
            ...state,
            folders: state.folders.map((f) =>
              f.id === id ? { ...f, ...folder } : f
            ),
            lastUpdate: new Date().toISOString()
          }
        }),

      deleteFolder: (id) =>
        set((state) => ({
          ...state,
          folders: state.folders.filter((f) => f.id !== id),
          lastUpdate: new Date().toISOString()
        })),

      // Acciones de miniaturas
      updateThumbnailSettings: (settings) =>
        set((state) => ({
          ...state,
          thumbnails: {
            ...state.thumbnails,
            ...settings
          },
          lastUpdate: new Date().toISOString()
        })),

      // Acciones de sistema
      updateSystemSettings: (settings) =>
        set((state) => ({
          ...state,
          system: {
            ...state.system,
            ...settings
          },
          lastUpdate: new Date().toISOString()
        })),

      // Acciones de atajos
      updateShortcut: (action, keys) =>
        set((state) => ({
          ...state,
          shortcuts: {
            ...state.shortcuts,
            [action]: keys
          },
          lastUpdate: new Date().toISOString()
        })),

      deleteShortcut: (action) =>
        set((state) => {
          const { [action]: _, ...rest } = state.shortcuts
          return {
            ...state,
            shortcuts: rest,
            lastUpdate: new Date().toISOString()
          }
        })
    }),
    {
      name: 'app-settings',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrar desde versión anterior si es necesario
          return {
            ...DEFAULT_SETTINGS,
            ...persistedState
          }
        }
        return persistedState
      }
    }
  )
)