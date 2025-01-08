import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'
import { EventSourcePolyfill } from 'event-source-polyfill'

const eventsLogger = logger.withContext('EventService')

type EventSourceType = EventSourcePolyfill | EventSource;
type EventHandler = (event: MessageEvent<any>) => void;

interface EventSourceWithPolyfill {
  addEventListener(type: string, listener: EventHandler, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventHandler, options?: boolean | EventListenerOptions): void;
  close(): void;
  onopen: ((this: EventSource, ev: Event) => any) | null;
  onerror: ((this: EventSource, ev: Event) => any) | null;
  readonly CLOSED: number;
  readonly CONNECTING: number;
  readonly OPEN: number;
  readonly readyState: number;
  readonly url: string;
}

export class EventsService {
  private emitter = new EventEmitter()
  private source: EventSourceWithPolyfill | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000
  private heartbeatTimeout = 45000
  private heartbeatInterval = 30000
  private lastHeartbeat = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private endpoint: string
  private EventSourceImpl: typeof EventSourcePolyfill | typeof EventSource

  constructor(endpoint?: string, EventSourceImpl?: typeof EventSourcePolyfill | typeof EventSource) {
    this.endpoint = endpoint || '/api/events'
    this.EventSourceImpl = EventSourceImpl || EventSourcePolyfill
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
      this.source = new this.EventSourceImpl(this.endpoint) as EventSourceWithPolyfill

      this.source.onopen = () => {
        eventsLogger.info('✅ Conexión SSE establecida')
        this.setupHeartbeat()
      }

      this.source.onerror = (error: Event) => {
        eventsLogger.error('❌ Error en conexión:', error)
        this.emit('error', {
          type: 'CONNECTION_ERROR',
          message: 'Error en la conexión',
          details: 'Error de conexión SSE',
          timestamp: Date.now()
        })
        this.reconnect()
      }

      this.setupEventListeners()

    } catch (error) {
      eventsLogger.error('❌ Error estableciendo conexión:', error)
      this.emit('error', {
        type: 'SETUP_ERROR',
        message: 'Error estableciendo conexión',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }

  private setupEventListeners() {
    if (!this.source) return;

    const addListener = (event: string, handler: EventHandler) => {
      this.source?.addEventListener(event, handler)
    }

    addListener('heartbeat', () => {
      this.handleHeartbeat()
    })

    addListener('error', (e) => {
      const error = this.parseEventData(e)
      this.emit('error', error)
    })

    addListener('progress', (e) => {
      const data = this.parseEventData(e)
      this.emit('progress', data)
    })

    addListener('complete', (e) => {
      const data = this.parseEventData(e)
      this.emit('complete', data)
    })

    addListener('stats', (e) => {
      const data = this.parseEventData(e)
      this.emit('stats', data)
    })
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