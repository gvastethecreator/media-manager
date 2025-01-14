import { useCallback } from 'react'
import { useSettingsStore } from '@/store/settings.store'
import type {
  AppSettings,
  Profile,
  Collection,
  Tag,
  Folder,
  ThumbnailSettings,
  SystemSettings,
  ThemeMode,
  Language,
  ViewMode,
  ThumbnailSize,
  SortMode,
  SortDirection
} from '@/types/settings'

export const useSettings = () => {
  const store = useSettingsStore()

  // Selectores generales
  const settings = store
  const version = store.version
  const lastUpdate = store.lastUpdate

  // Selectores de perfil
  const profiles = store.profiles
  const activeProfile = store.activeProfile
  const currentProfile = profiles.find((p) => p.id === activeProfile)

  // Selectores de colección
  const collections = store.collections
  const getCollection = useCallback(
    (id: string) => collections.find((c) => c.id === id),
    [collections]
  )

  // Selectores de etiquetas
  const tags = store.tags
  const getTag = useCallback(
    (id: string) => tags.find((t) => t.id === id),
    [tags]
  )

  // Selectores de carpetas
  const folders = store.folders
  const getFolder = useCallback(
    (id: string) => folders.find((f) => f.id === id),
    [folders]
  )

  // Selectores de vista
  const view = store.view
  const defaultView = view.defaultView
  const showHiddenFiles = view.showHiddenFiles
  const sortBy = view.sortBy
  const sortDirection = view.sortDirection
  const thumbnailSize = view.thumbnailSize

  // Selectores de miniaturas
  const thumbnails = store.thumbnails
  const thumbnailQuality = thumbnails.quality
  const generateThumbnailsOnUpload = thumbnails.generateOnUpload
  const maxThumbnailSize = thumbnails.maxSize
  const thumbnailCacheSize = thumbnails.cacheSize
  const thumbnailCachePath = thumbnails.cachePath

  // Selectores de sistema
  const system = store.system
  const theme = system.theme
  const language = system.language
  const autoStart = system.autoStart
  const minimizeToTray = system.minimizeToTray
  const checkUpdates = system.checkUpdates
  const telemetry = system.telemetry

  // Selectores de atajos
  const shortcuts = store.shortcuts
  const getShortcut = useCallback(
    (action: string) => shortcuts[action],
    [shortcuts]
  )

  // Acciones generales
  const updateSettings = store.updateSettings
  const resetSettings = store.resetSettings

  // Acciones de perfil
  const updateProfile = store.updateProfile
  const setActiveProfile = store.setActiveProfile
  const deleteProfile = store.deleteProfile

  // Acciones de colección
  const updateCollection = store.updateCollection
  const deleteCollection = store.deleteCollection

  // Acciones de etiquetas
  const updateTag = store.updateTag
  const deleteTag = store.deleteTag

  // Acciones de carpetas
  const updateFolder = store.updateFolder
  const deleteFolder = store.deleteFolder

  // Acciones de miniaturas
  const updateThumbnailSettings = store.updateThumbnailSettings

  // Acciones de sistema
  const updateSystemSettings = store.updateSystemSettings

  // Acciones de atajos
  const updateShortcuts = store.updateShortcuts

  // Acciones compuestas
  const createProfile = useCallback(
    (profile: Partial<Profile>) => {
      updateProfile(null, profile)
    },
    [updateProfile]
  )

  const createCollection = useCallback(
    (collection: Partial<Collection>) => {
      updateCollection(null, collection)
    },
    [updateCollection]
  )

  const createTag = useCallback(
    (tag: Partial<Tag>) => {
      updateTag(null, tag)
    },
    [updateTag]
  )

  const createFolder = useCallback(
    (folder: Partial<Folder>) => {
      updateFolder(null, folder)
    },
    [updateFolder]
  )

  const updateView = useCallback(
    (view: {
      defaultView?: ViewMode
      showHiddenFiles?: boolean
      sortBy?: SortMode
      sortDirection?: SortDirection
      thumbnailSize?: ThumbnailSize
    }) => {
      updateSettings({ view: { ...settings.view, ...view } })
    },
    [settings.view, updateSettings]
  )

  const updateSystem = useCallback(
    (system: {
      theme?: ThemeMode
      language?: Language
      autoStart?: boolean
      minimizeToTray?: boolean
      checkUpdates?: boolean
      telemetry?: boolean
    }) => {
      updateSystemSettings(system)
    },
    [updateSystemSettings]
  )

  return {
    // Estado general
    settings,
    version,
    lastUpdate,

    // Perfiles
    profiles,
    activeProfile,
    currentProfile,

    // Colecciones
    collections,
    getCollection,

    // Etiquetas
    tags,
    getTag,

    // Carpetas
    folders,
    getFolder,

    // Vista
    view,
    defaultView,
    showHiddenFiles,
    sortBy,
    sortDirection,
    thumbnailSize,

    // Miniaturas
    thumbnails,
    thumbnailQuality,
    generateThumbnailsOnUpload,
    maxThumbnailSize,
    thumbnailCacheSize,
    thumbnailCachePath,

    // Sistema
    system,
    theme,
    language,
    autoStart,
    minimizeToTray,
    checkUpdates,
    telemetry,

    // Atajos
    shortcuts,
    getShortcut,

    // Acciones generales
    updateSettings,
    resetSettings,

    // Acciones de perfil
    createProfile,
    updateProfile,
    setActiveProfile,
    deleteProfile,

    // Acciones de colección
    createCollection,
    updateCollection,
    deleteCollection,

    // Acciones de etiquetas
    createTag,
    updateTag,
    deleteTag,

    // Acciones de carpetas
    createFolder,
    updateFolder,
    deleteFolder,

    // Acciones de vista
    updateView,

    // Acciones de miniaturas
    updateThumbnailSettings,

    // Acciones de sistema
    updateSystem,

   
  }
}