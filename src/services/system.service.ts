import { CacheManager } from '@/lib/cache'
import { logger } from '@/lib/logger'

const systemLogger = logger.withContext('SystemService')

export interface SystemStatus {
  status: 'active' | 'inactive' | 'error'
  message?: string
  database?: {
    status: 'connected' | 'disconnected' | 'error'
    message?: string
  }
  settings?: {
    status: 'active' | 'inactive' | 'error'
    message?: string
  }
  fileSystem?: {
    status: 'active' | 'inactive' | 'error'
    message?: string
  }
  thumbnails?: {
    status: 'active' | 'inactive' | 'error'
    message?: string
  }
  timestamp: number
}

// Cache específico para el estado del sistema
const systemCache = new CacheManager<SystemStatus>({
  name: 'system',
  maxSize: 1,
  ttl: 1000 * 30, // 30 segundos
  updateAgeOnGet: true,
  allowStale: true
})

class SystemService {
  private static instance: SystemService
  private lastStatus: SystemStatus | null = null
  private fetchPromise: Promise<SystemStatus> | null = null

  private constructor() { }

  static getInstance(): SystemService {
    if (!SystemService.instance) {
      SystemService.instance = new SystemService()
    }
    return SystemService.instance
  }

  async getStatus(force: boolean = false): Promise<SystemStatus> {
    try {
      // Si hay una petición en curso, esperar su resultado
      if (this.fetchPromise) {
        return await this.fetchPromise
      }

      // Intentar obtener del caché si no se fuerza la actualización
      if (!force) {
        const cached = await systemCache.get('status')
        if (cached) {
          systemLogger.debug('🟢 Usando estado del sistema en caché')
          return cached
        }
      }

      // Realizar nueva petición
      this.fetchPromise = this.fetchSystemStatus()
      const status = await this.fetchPromise
      this.fetchPromise = null

      // Actualizar caché
      await systemCache.set('status', status)
      this.lastStatus = status

      return status
    } catch (error) {
      systemLogger.error('🔴 Error al obtener estado del sistema:', error)
      throw error
    }
  }

  private async fetchSystemStatus(): Promise<SystemStatus> {
    try {
      const response = await fetch('/api/system/status')
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        timestamp: Date.now()
      }
    } catch (error) {
      systemLogger.error('🔴 Error en fetchSystemStatus:', error)
      throw error
    }
  }

  getLastStatus(): SystemStatus | null {
    return this.lastStatus
  }
}

export const systemService = SystemService.getInstance()