import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'

const eventsLogger = logger.withContext('EventService')

export class EventsService {
  private emitter = new EventEmitter()
  private source: EventSource | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000
  private heartbeatTimeout = 45000
  private heartbeatInterval = 30000
  private lastHeartbeat = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private endpoint: string

  constructor(endpoint?: string) {
    this.endpoint = endpoint || '/api/events'
  }

  private clearTimers() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private setupHeartbeat() {
    this.lastHeartbeat = Date.now()
    this.heartbeatTimer = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat
      if (timeSinceLastHeartbeat > this.heartbeatTimeout) {
        eventsLogger.warn(`⚠️ No se ha recibido heartbeat en ${Math.floor(timeSinceLastHeartbeat / 1000)}s`)
        this.reconnect()
      }
    }, this.heartbeatInterval)
  }

  private handleHeartbeat() {
    this.lastHeartbeat = Date.now()
    this.reconnectAttempts = 0 // Resetear intentos cuando hay heartbeat exitoso
  }

  private async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      eventsLogger.error('❌ Máximo número de intentos de reconexión alcanzado')
      this.emit('error', {
        type: 'MAX_RECONNECT_ATTEMPTS',
        message: 'No se pudo restablecer la conexión',
        details: `Máximo número de intentos (${this.maxReconnectAttempts}) alcanzado`
      })
      this.disconnect()
      return
    }

    this.reconnectAttempts++
    eventsLogger.info(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    this.disconnect()

    // Esperar antes de reconectar
    await new Promise(resolve => {
      this.reconnectTimer = setTimeout(resolve, this.reconnectDelay * this.reconnectAttempts)
    })

    this.connect()
  }

  connect() {
    if (this.source) {
      this.disconnect()
    }

    try {
      this.source = new EventSource(this.endpoint)

      this.source.onopen = () => {
        eventsLogger.info('✅ Conexión SSE establecida')
        this.setupHeartbeat()
      }

      this.source.onerror = (error) => {
        eventsLogger.error('❌ Error en conexión:', error)
        this.emit('error', {
          type: 'CONNECTION_ERROR',
          message: 'Error en la conexión',
          details: 'Error de conexión SSE',
          timestamp: Date.now()
        })
        this.reconnect()
      }

      this.source.addEventListener('heartbeat', (e: Event) => {
        if (e instanceof MessageEvent) {
          this.handleHeartbeat()
        }
      })

      this.source.addEventListener('error', (e: Event) => {
        if (e instanceof MessageEvent) {
          const error = this.parseEventData(e)
          this.emit('error', error)
        }
      })

      this.source.addEventListener('progress', (e: Event) => {
        if (e instanceof MessageEvent) {
          const data = this.parseEventData(e)
          this.emit('progress', data)
        }
      })

      this.source.addEventListener('complete', (e: Event) => {
        if (e instanceof MessageEvent) {
          const data = this.parseEventData(e)
          this.emit('complete', data)
        }
      })

      this.source.addEventListener('stats', (e: Event) => {
        if (e instanceof MessageEvent) {
          const data = this.parseEventData(e)
          this.emit('stats', data)
        }
      })

    } catch (error) {
      eventsLogger.error('❌ Error estableciendo conexión:', error)
      this.emit('error', {
        type: 'SETUP_ERROR',
        message: 'Error estableciendo conexión',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }

  private parseEventData(event: MessageEvent) {
    try {
      return typeof event.data === 'string' ? JSON.parse(event.data) : event.data
    } catch (error) {
      eventsLogger.error('❌ Error parseando datos del evento:', error)
      return null
    }
  }

  disconnect() {
    this.clearTimers()
    if (this.source) {
      this.source.close()
      this.source = null
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.emitter.on(event, callback)
  }

  off(event: string, callback: (data: any) => void) {
    this.emitter.off(event, callback)
  }

  private emit(event: string, data: any) {
    this.emitter.emit(event, data)
  }
}