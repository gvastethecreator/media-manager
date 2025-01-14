'use client'

import { useEffect } from 'react'
import { statsEventEmitter } from '@/services/stats.service'
import { logger } from '@/lib/logger'

const statsLogger = logger.withContext('StatsHook')

export function useStatsService() {
  useEffect(() => {
    try {
      statsLogger.info('🔄 Inicializando servicio de estadísticas')
      statsEventEmitter.emit('init')
    } catch (error) {
      statsLogger.error('❌ Error al inicializar servicio de estadísticas:', error)
    }
  }, [])
}