import { create } from 'zustand'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { CacheManager } from '@/lib/cache'
import { eventsService, CacheInvalidationEvent } from '@/services/events.service'

const statsLogger = logger.withContext('StatsStore')

interface FolderStat {
  id: string
  name: string
  size: number
  count: number
  percentage: number
}

interface TagStat {
  id: string
  name: string
  color: string
  count: number
}

interface CollectionStat {
  id: string
  name: string
  emoji: string
  color?: string
  count: number
}

interface Activity {
  description: string
  timestamp: string
  imageId: string
  imageName: string
}

interface Stats {
  totalImages: number
  totalFolders: number
  totalTags: number
  totalCollections: number
  totalFavorites: number
  totalViews: number
  totalDownloads: number
  totalSize: number
  folders: FolderStat[]
  tags: TagStat[]
  collections: CollectionStat[]
  folderStats: FolderStat[]
  topTags: TagStat[]
  recentActivity: Activity[]
}

interface StatsState {
  stats: Stats | null
  isLoading: boolean
  error: string | null
  fetchStats: () => Promise<void>
  initialize: () => Promise<(() => void) | void>
}

// Cache específico para estadísticas
const statsCache = new CacheManager<Stats>({
  name: 'stats',
  max: 1,
  ttl: 1000 * 60 * 5, // 5 minutos
  updateAgeOnGet: true,
  allowStale: true
})

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    const { fetchStats } = get()
    try {
      await fetchStats()

      // Suscribirse a eventos que requieren actualización de stats
      const unsubscribe = eventsService.subscribe((event: CacheInvalidationEvent) => {
        // Solo actualizar stats para eventos relevantes
        const relevantEvents: CacheInvalidationEvent[] = [
          'files:added',
          'files:deleted',
          'files:modified',
          'folders:added',
          'folders:deleted',
          'folders:modified',
          'collections:modified',
          'favorites:modified',
          'tags:modified'
        ]

        if (relevantEvents.includes(event)) {
          statsLogger.info(`🔄 Actualizando stats por evento: ${event}`)
          fetchStats().catch(error => {
            statsLogger.error('❌ Error actualizando stats:', error)
          })
        }
      })

      return unsubscribe
    } catch (error) {
      statsLogger.error('❌ Error en inicialización:', error)
      toast.error('Error al inicializar estadísticas')
      throw error
    }
  },

  fetchStats: async () => {
    try {
      set({ isLoading: true, error: null })

      // Intentar obtener del caché primero
      const cached = await statsCache.get('stats')
      if (cached) {
        statsLogger.debug('✅ Usando stats en caché')
        set({ stats: cached, isLoading: false })
        return
      }

      const response = await fetch('/api/stats', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data || typeof data !== 'object') {
        throw new Error('Formato de respuesta inválido')
      }

      // Validar campos requeridos
      const requiredFields = [
        'totalImages',
        'totalFolders',
        'totalTags',
        'totalCollections',
        'folders',
        'tags',
        'collections'
      ]

      for (const field of requiredFields) {
        if (!(field in data)) {
          throw new Error(`Campo requerido faltante en la respuesta: ${field}`)
        }
      }

      // Actualizar caché y estado
      await statsCache.set('stats', data)
      statsLogger.debug('💾 Stats actualizados y guardados en caché')
      set({ stats: data, isLoading: false })
    } catch (error) {
      statsLogger.error('❌ Error fetching stats:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(`Error al obtener estadísticas: ${errorMessage}`)
      throw error
    }
  }
}))
