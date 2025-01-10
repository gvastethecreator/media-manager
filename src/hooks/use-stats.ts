import { useQuery, useQueryClient } from '@tanstack/react-query'
import { statsService } from '@/services/stats.service'
import { logger } from '@/lib/logger'
import type { GeneralStats } from '@/app/actions/stats.actions'
import type { ImageStats } from '@prisma/client'

const statsLogger = logger.withContext('StatsHook')

export const STATS_QUERY_KEYS = {
  all: ['stats'] as const,
  general: () => [...STATS_QUERY_KEYS.all, 'general'] as const,
  image: (imageId: string) => [...STATS_QUERY_KEYS.all, 'image', imageId] as const,
}

export function useStats() {
  const queryClient = useQueryClient()

  const {
    data: stats,
    error,
    isLoading,
    isError,
  } = useQuery<GeneralStats>({
    queryKey: STATS_QUERY_KEYS.general(),
    queryFn: async () => {
      try {
        return await statsService.getGeneralStats()
      } catch (error) {
        statsLogger.error('Error al obtener estadísticas', { error })
        throw error
      }
    },
  })

  const refreshStats = () => {
    queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEYS.general() })
  }

  return {
    stats,
    error,
    isLoading,
    isError,
    refreshStats,
  }
}

export function useImageStats(imageId: string) {
  const queryClient = useQueryClient()

  const {
    data: stats,
    error,
    isLoading,
    isError,
  } = useQuery<ImageStats>({
    queryKey: STATS_QUERY_KEYS.image(imageId),
    queryFn: async () => {
      try {
        return await statsService.getOrCreateImageStats(imageId)
      } catch (error) {
        statsLogger.error('Error al obtener estadísticas de imagen', {
          error,
          imageId,
        })
        throw error
      }
    },
  })

  const incrementView = async () => {
    try {
      const updatedStats = await statsService.incrementViewCount(imageId)
      queryClient.setQueryData(STATS_QUERY_KEYS.image(imageId), updatedStats)
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEYS.general() })
    } catch (error) {
      statsLogger.error('Error al incrementar vistas', { error, imageId })
      throw error
    }
  }

  const incrementDownload = async () => {
    try {
      const updatedStats = await statsService.incrementDownloadCount(imageId)
      queryClient.setQueryData(STATS_QUERY_KEYS.image(imageId), updatedStats)
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEYS.general() })
    } catch (error) {
      statsLogger.error('Error al incrementar descargas', { error, imageId })
      throw error
    }
  }

  return {
    stats,
    error,
    isLoading,
    isError,
    incrementView,
    incrementDownload,
  }
}
