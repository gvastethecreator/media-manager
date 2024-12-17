export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'es' | 'en' | 'pt' | 'fr' | 'de'
export type SortBy = 'name' | 'date' | 'size' | 'type'
export type StartPage = 'dashboard' | 'all-images' | 'library' | 'collections' | 'folders' | 'last-view'
export type LogLevel = 'error' | 'warn' | 'info' | 'debug'
export type BackupFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly'
export type ThumbnailSize = 'XS' | 'S' | 'M' | 'L' | 'XL'
export type FileProperty = 'name' | 'path' | 'size' | 'type' | 'date'
export type FilterCondition = 'contains' | 'exact' | 'starts' | 'ends' | 'regex' | 'greater' | 'less'

export interface AppearanceSettings {
  darkMode: boolean
  compactMode: boolean
  potatoMode: boolean
  thumbnailSize: number
  sortBy: SortBy
  collectionPagination: {
    enabled: boolean
    itemsPerPage: number
  }
  folderPagination: {
    enabled: boolean
    itemsPerPage: number
  }
  startPage: StartPage
  autoUpdate: boolean
}

export interface FolderSettings {
  path: string
  fileCount: number
  size: string
  autoIndex: boolean
  excludePatterns: string[]
  includePatterns: string[]
}

export interface CollectionSettings {
  id: string
  name: string
  emoji: string
  description: string
  shortcut: string
  color: string
  count: number
  size: string
  sortBy: SortBy
  filters: FilterRule[]
}

export interface TagSettings {
  id: string
  name: string
  color: string
  property: FileProperty
  condition: FilterCondition
  value: string
  count: number
}

export interface ShortcutSettings {
  id: string
  action: string
  keys: string
  category: 'navigation' | 'files' | 'collections' | 'view'
}

export interface ProfileSettings {
  id: string
  name: string
  emoji: string
  color: string
  theme: ThemeMode
  language: Language
  syncSettings: boolean
  notifications: boolean
  customSettings: {
    appearance: Partial<AppearanceSettings>
    folders: Partial<FolderSettings>[]
    collections: Partial<CollectionSettings>[]
    tags: Partial<TagSettings>[]
    shortcuts: Partial<ShortcutSettings>[]
  }
}

export interface SystemSettings {
  info: {
    os: string
    version: string
    lastUpdate: string
    database: string
    memory: {
      used: number
      total: number
      percentage: number
    }
    storage: {
      used: number
      total: number
      percentage: number
    }
  }
  backup: {
    autoBackup: boolean
    frequency: BackupFrequency
    location: string
    maxBackups: number
    compressBackups: boolean
  }
  maintenance: {
    autoClean: boolean
    cleanupRules: {
      tempFiles: boolean
      emptyFolders: boolean
      unusedThumbnails: boolean
      oldBackups: boolean
    }
    optimizationSchedule: BackupFrequency
  }
  logging: {
    debugMode: boolean
    logLevel: LogLevel
    maxLogSize: number
    rotateLogsAfterDays: number
    exportFormat: 'json' | 'txt' | 'csv'
  }
}

export interface FilterRule {
  id: string
  property: FileProperty
  condition: FilterCondition
  value: string
  enabled: boolean
}

export interface AppSettings {
  version: string
  lastUpdate: string
  appearance: AppearanceSettings
  folders: FolderSettings[]
  collections: CollectionSettings[]
  tags: TagSettings[]
  shortcuts: ShortcutSettings[]
  profiles: ProfileSettings[]
  system: SystemSettings
  activeProfile: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: "1.0.0",
  lastUpdate: new Date().toISOString(),
  appearance: {
    darkMode: false,
    compactMode: false,
    potatoMode: false,
    thumbnailSize: 2,
    sortBy: "name",
    collectionPagination: {
      enabled: false,
      itemsPerPage: 50
    },
    folderPagination: {
      enabled: false,
      itemsPerPage: 50
    },
    startPage: "dashboard",
    autoUpdate: true
  },
  folders: [],
  collections: [],
  tags: [],
  shortcuts: [
    {
      id: "1",
      action: "Abrir configuración",
      keys: "Ctrl + ,",
      category: "navigation"
    },
    {
      id: "2",
      action: "Alternar panel derecho",
      keys: "Ctrl + B",
      category: "navigation"
    }
  ],
  profiles: [
    {
      id: "default",
      name: "Usuario Principal",
      emoji: "👤",
      color: "blue",
      theme: "system",
      language: "es",
      syncSettings: true,
      notifications: false,
      customSettings: {
        appearance: {},
        folders: [],
        collections: [],
        tags: [],
        shortcuts: []
      }
    }
  ],
  system: {
    info: {
      os: "",
      version: "1.0.0",
      lastUpdate: new Date().toISOString(),
      database: "SQLite",
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      },
      storage: {
        used: 0,
        total: 0,
        percentage: 0
      }
    },
    backup: {
      autoBackup: true,
      frequency: "daily",
      location: "./backups",
      maxBackups: 10,
      compressBackups: true
    },
    maintenance: {
      autoClean: false,
      cleanupRules: {
        tempFiles: true,
        emptyFolders: true,
        unusedThumbnails: true,
        oldBackups: true
      },
      optimizationSchedule: "weekly"
    },
    logging: {
      debugMode: false,
      logLevel: "info",
      maxLogSize: 10,
      rotateLogsAfterDays: 7,
      exportFormat: "json"
    }
  },
  activeProfile: "default"
}