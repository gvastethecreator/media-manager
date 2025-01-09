import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'
import { EventSourcePolyfill } from 'event-source-polyfill'

const eventsLogger = logger.withContext('EventService')

export enum EVENT_TYPES {
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
  PROGRESS = 'progress',
  COMPLETE = 'complete',
  STATS = 'stats',
  FOLDER_PROGRESS = 'folder:progress',
  FOLDER_ERROR = 'folder:error',
  FOLDER_COMPLETE = 'folder:complete'
}

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

export interface EventData<T = any> {
  type: EVENT_TYPES;
  data: T;
  timestamp: number;
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
  private isConnected: boolean = false

  constructor(endpoint?: string, EventSourceImpl?: typeof EventSourcePolyfill | typeof EventSource) {
    this.endpoint = endpoint || '/api/events'
    this.EventSourceImpl = EventSourceImpl || EventSourcePolyfill
    eventsLogger.info('🔌 Inicializando EventsService con endpoint:', this.endpoint)
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
      this.emit(EVENT_TYPES.ERROR, {
        type: EVENT_TYPES.ERROR,
        data: {
          message: 'No se pudo restablecer la conexión',
          details: `Máximo número de intentos (${this.maxReconnectAttempts}) alcanzado`
        },
        timestamp: Date.now()
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
    if (this.isConnected) {
      eventsLogger.warn('⚠️ Intento de conexión mientras ya está conectado')
      return
    }

    try {
      eventsLogger.info('🔄 Iniciando conexión SSE...')
      this.source = new this.EventSourceImpl(this.endpoint) as EventSourceWithPolyfill

      this.source.onopen = () => {
        this.isConnected = true
        eventsLogger.info('✅ Conexión SSE establecida')
        this.setupHeartbeat()
        this.emit(EVENT_TYPES.COMPLETE, {
          type: EVENT_TYPES.COMPLETE,
          data: { status: 'connected' },
          timestamp: Date.now()
        })
      }

      this.source.onerror = (error: Event) => {
        eventsLogger.error('❌ Error en conexión SSE:', error)
        this.emit(EVENT_TYPES.ERROR, {
          type: EVENT_TYPES.ERROR,
          data: {
            message: 'Error en la conexión SSE',
            error
          },
          timestamp: Date.now()
        })
        this.reconnect()
      }

      this.setupEventListeners()

    } catch (error) {
      eventsLogger.error('❌ Error estableciendo conexión:', error)
      this.emit(EVENT_TYPES.ERROR, {
        type: EVENT_TYPES.ERROR,
        data: {
          message: 'Error estableciendo conexión',
          error
        },
        timestamp: Date.now()
      })
    }
  }

  private setupEventListeners() {
    if (!this.source) return;

    const addListener = (event: string, handler: EventHandler) => {
      this.source?.addEventListener(event, handler)
      eventsLogger.debug(`📡 Listener agregado para evento: ${event}`)
    }

    // Eventos base
    Object.values(EVENT_TYPES).forEach(eventType => {
      addListener(eventType, (e) => {
        const data = this.parseEventData(e)
        if (data) {
          eventsLogger.debug(`📨 Evento recibido: ${eventType}`, data)
          this.emit(eventType, {
            type: eventType,
            data,
            timestamp: Date.now()
          })
        }
      })
    })

    // Manejo especial para heartbeat
    addListener(EVENT_TYPES.HEARTBEAT, () => {
      this.handleHeartbeat()
    })
  }

  private parseEventData(event: MessageEvent): any {
    try {
      if (!event.data) return null
      return typeof event.data === 'string' ? JSON.parse(event.data) : event.data
    } catch (error) {
      eventsLogger.error('❌ Error parseando datos del evento:', error)
      return null
    }
  }

  disconnect() {
    if (!this.isConnected) {
      eventsLogger.warn('⚠️ Intento de desconexión mientras no está conectado')
      return
    }

    this.clearTimers()
    if (this.source) {
      this.source.close()
      this.source = null
    }
    this.isConnected = false
    eventsLogger.info('🔌 Desconectado del servidor de eventos')
  }

  on(event: EVENT_TYPES, callback: (data: EventData) => void) {
    this.emitter.on(event, callback)
    eventsLogger.debug(`➕ Listener agregado para ${event}`)
  }

  off(event: EVENT_TYPES, callback: (data: EventData) => void) {
    this.emitter.off(event, callback)
    eventsLogger.debug(`➖ Listener removido para ${event}`)
  }

  private emit(event: EVENT_TYPES, data: EventData) {
    this.emitter.emit(event, data)
    eventsLogger.debug(`📢 Emitiendo evento ${event}:`, data)
  }
}