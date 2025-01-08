import { create } from 'zustand'
import { formatBytes } from '@/lib/utils'
import { toast } from 'sonner'

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

  // Listas con conteos
  folders: FolderStat[]
  tags: TagStat[]
  collections: CollectionStat[]

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
  initialize: () => Promise<(() => void) | void>
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    const { fetchStats } = get()
    try {
      await fetchStats()

      // Configurar actualización periódica cada 30 segundos
      const interval = setInterval(async () => {
        try {
          await fetchStats()
        } catch (error) {
          console.error('Error en actualización automática:', error)
          clearInterval(interval)
          toast.error('Error en actualización automática de estadísticas')
        }
      }, 30000)

      // Limpiar intervalo cuando se desmonte
      return () => clearInterval(interval)
    } catch (error) {
      console.error('Error en inicialización:', error)
      toast.error('Error al inicializar estadísticas')
      throw error // Re-throw para que el componente pueda manejarlo
    }
  },

  fetchStats: async () => {
    try {
      set({ isLoading: true, error: null })

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

      // Validar que los campos requeridos estén presentes
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

      set({ stats: data, isLoading: false })
    } catch (error) {
      console.error('Error fetching stats:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(`Error al obtener estadísticas: ${errorMessage}`)
      throw error // Re-throw para que el caller pueda manejarlo
    }
  }
}))
