import { create } from 'zustand'
import { formatBytes } from '@/lib/utils'
import { Image, FolderOpen, Tag, BookmarkIcon, Star, Eye, Download } from 'lucide-react'

interface FolderStat {
  name: string
  size: number
  percentage: number
}

interface TagStat {
  name: string
  color: string
  count: number
}

interface Activity {
  description: string
  timestamp: string
  iconName: string
}

interface Stats {
  // Estadísticas principales
  totalImages: number
  totalFolders: number
  totalTags: number
  totalCollections: number

  // Estadísticas adicionales
  totalFavorites: number
  totalViews: number
  totalDownloads: number
  totalSize: number

  // Estadísticas detalladas
  folderStats: FolderStat[]
  topTags: TagStat[]
  recentActivity: Activity[]
}

interface StatsState {
  stats: Stats | null
  isLoading: boolean
  error: string | null
  fetchStats: () => Promise<void>
  initialize: () => Promise<void>
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    const { fetchStats } = get()
    await fetchStats()

    // Configurar actualización periódica cada 30 segundos
    setInterval(() => {
      fetchStats()
    }, 30000)
  },

  fetchStats: async () => {
    try {
      set({ isLoading: true, error: null })

      const response = await fetch('/api/stats')
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas')
      }

      const stats = await response.json()
      set({ stats, isLoading: false })
    } catch (error) {
      console.error('Error fetching stats:', error)
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false
      })
    }
  }
}))
