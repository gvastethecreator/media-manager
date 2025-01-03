export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'es' | 'en'
export type ThumbnailQuality = 'low' | 'medium' | 'high'
export type SortMode = 'name' | 'date' | 'size' | 'type'
export type SortDirection = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list' | 'details'
export type ThumbnailSize = 'sm' | 'md' | 'lg'

export interface Profile {
  id: string
  name: string
  emoji: string
  color: string
  theme: ThemeMode
  language: Language
  isActive: boolean
}

export interface Collection {
  id: string
  name: string
  emoji: string
  color: string
  description?: string
  shortcut?: string
  sortBy: SortMode
  sortDirection: SortDirection
  filters: string[]
  count: number
}

export interface Tag {
  id: string
  name: string
  color: string
  count: number
}

export interface Folder {
  id: string
  name: string
  path: string
  isWatched: boolean
  isIndexed: boolean
  lastIndexed: string | null
  totalFiles: number
  totalSize: number
}

export interface ViewSettings {
  defaultView: ViewMode
  showHiddenFiles: boolean
  sortBy: SortMode
  sortDirection: SortDirection
  thumbnailSize: ThumbnailSize
}

export interface ThumbnailSettings {
  quality: ThumbnailQuality
  generateOnUpload: boolean
  maxSize: number
  cacheSize: number
  cachePath: string
}

export interface SystemSettings {
  theme: ThemeMode
  language: Language
  autoStart: boolean
  minimizeToTray: boolean
  checkUpdates: boolean
  telemetry: boolean
}

export interface ShortcutSettings {
  [key: string]: string
}

export interface AppSettings {
  profiles: Profile[]
  activeProfile: string | null
  collections: Collection[]
  tags: Tag[]
  folders: Folder[]

  view: ViewSettings
  thumbnails: ThumbnailSettings
  system: SystemSettings
  shortcuts: ShortcutSettings

  version: string
  lastUpdate: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  profiles: [],
  activeProfile: null,
  collections: [],
  tags: [],
  folders: [],

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
    maxSize: 500,
    cacheSize: 1000,
    cachePath: './cache/thumbnails'
  },

  system: {
    theme: 'system',
    language: 'es',
    autoStart: false,
    minimizeToTray: true,
    checkUpdates: true,
    telemetry: false
  },

  shortcuts: {},

  version: '1.0.0',
  lastUpdate: new Date().toISOString()
}