import { create } from 'zustand'
import { logger } from '@/lib/logger'

const statsLogger = logger.withContext('StatsStore')

interface FolderStat {
  id: string
  name: string
  count: number
}

interface CollectionStat {
  id: string
  name: string
  emoji: string
  count: number
}

interface TagStat {
  id: string
  name: string
  color: string
  count: number
}

interface AlbumStat {
  id: string
  name: string
  emoji: string
  count: number
}

interface CharacterStat {
  id: string
  name: string
  emoji: string
  count: number
}

interface PlaceStat {
  id: string
  name: string
  emoji: string
  count: number
}

interface ObjectStat {
  id: string
  name: string
  emoji: string
  count: number
}

interface Activity {
  description: string
  timestamp: string
  imageId: string
  imageName: string
}

interface Stats {
  // Conteos básicos
  totalImages: number
  totalFolders: number
  totalTags: number
  totalCollections: number
  totalFavorites: number
  totalViews: number
  totalDownloads: number
  totalSize: number
  totalAlbums: number
  totalCharacters: number
  totalPlaces: number
  totalObjects: number
  totalActivities: number

  // Listas detalladas
  folders: FolderStat[]
  collections: CollectionStat[]
  tags: TagStat[]
  albums: AlbumStat[]
  characters: CharacterStat[]
  places: PlaceStat[]
  objects: ObjectStat[]
  topTags: TagStat[]
  recentActivity: Activity[]

  // Metadata
  timestamp: number
}

interface StatsState {
  stats: Stats | null
  isLoading: boolean
  error: string | null
  initialize: (data?: Stats) => void
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,
  isLoading: false,
  error: null,
  initialize: (data?: Stats) => {
    if (data) {
      set({ stats: data, isLoading: false, error: null })
      statsLogger.debug('📊 Estadísticas actualizadas:', data)
    } else {
      set({ isLoading: true, error: null })
    }
  }
}))
