import { EventSourcePolyfill as EventSource } from 'event-source-polyfill';
import { logger } from '@/lib/logger';

const eventLogger = logger.withContext('EventService');
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type EventType = 'connected' | 'message' | 'error' | 'heartbeat' | 'progress' | 'complete' | 'stats';
type EventCallback<T = any> = (data: T) => void;
type EventHandlers = Map<string, Set<EventCallback>>;

interface EventSourceOptions {
  withCredentials?: boolean;
  headers?: Record<string, string>;
  heartbeatTimeout?: number;
  reconnectInterval?: number;
}

interface EventError {
  message: string;
  details?: string;
  code?: string;
  timestamp?: number;
}

export class EventService {
  private handlers: EventHandlers = new Map();
  private eventSource: EventSource | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = Date.now();
  private currentEndpoint: string | null = null;

  private readonly HEARTBEAT_INTERVAL = 15000;
  private readonly HEARTBEAT_TIMEOUT = 45000;
  private readonly RECONNECT_DELAY = 5000;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private reconnectAttempts = 0;

  constructor() {
    this.setupHeartbeat();
  }

  private setupHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - this.lastHeartbeat;

      if (timeSinceLastHeartbeat > this.HEARTBEAT_TIMEOUT) {
        eventLogger.warn('⚠️ No se ha recibido heartbeat en', timeSinceLastHeartbeat, 'ms');
        this.emit('error', {
          message: 'Conexión perdida - No se han recibido heartbeats',
          details: `Último heartbeat hace ${Math.round(timeSinceLastHeartbeat / 1000)}s`,
          code: 'HEARTBEAT_TIMEOUT',
          timestamp: now
        } as EventError);
        this.reconnect();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  async connect(endpoint: string, options: EventSourceOptions = {}) {
    if (!endpoint) {
      throw new Error('Endpoint no proporcionado');
    }

    try {
      this.currentEndpoint = endpoint;

      if (this.eventSource) {
        this.eventSource.close();
      }

      const url = new URL(endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`);

      this.eventSource = new EventSource(url.toString(), {
        withCredentials: options.withCredentials ?? true,
        heartbeatTimeout: options.heartbeatTimeout ?? this.HEARTBEAT_TIMEOUT,
        reconnectInterval: options.reconnectInterval ?? this.RECONNECT_DELAY,
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'text/event-stream',
          ...(options.headers || {})
        }
      });

      this.eventSource.onopen = () => {
        eventLogger.info('✅ Conexión establecida con:', url.toString());
        this.emit('connected', { timestamp: Date.now() });
        this.lastHeartbeat = Date.now();
        this.reconnectAttempts = 0;
      };

      this.eventSource.onerror = (error) => {
        const errorData: EventError = {
          message: 'Error en la conexión',
          details: error instanceof Error ? error.message : 'Error de conexión SSE',
          code: 'CONNECTION_ERROR',
          timestamp: Date.now()
        };
        eventLogger.error('❌ Error en conexión:', errorData);
        this.emit('error', errorData);
        this.reconnect();
      };

      this.eventSource.onmessage = (event) => {
        try {
          if (!event.data) {
            eventLogger.warn('⚠️ Mensaje recibido sin datos');
            return;
          }

          const data = JSON.parse(event.data);
          this.lastHeartbeat = Date.now();
          this.emit('message', data);
        } catch (error) {
          eventLogger.error('❌ Error procesando mensaje:', error, 'Datos recibidos:', event.data);
          this.emit('error', {
            message: 'Error procesando mensaje',
            details: error instanceof Error ? error.message : 'Error al procesar JSON',
            code: 'MESSAGE_PARSE_ERROR',
            timestamp: Date.now()
          } as EventError);
        }
      };

      // Manejador específico para eventos de progreso
      this.eventSource.addEventListener('progress', (event: MessageEvent) => {
        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          this.emit('progress', data);
        } catch (error) {
          eventLogger.error('❌ Error procesando evento de progreso:', error);
        }
      });

      // Manejador específico para eventos de completado
      this.eventSource.addEventListener('complete', (event: MessageEvent) => {
        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          this.emit('complete', data);
        } catch (error) {
          eventLogger.error('❌ Error procesando evento de completado:', error);
        }
      });

      this.eventSource.addEventListener('heartbeat', () => {
        this.lastHeartbeat = Date.now();
      });

    } catch (error) {
      const errorData: EventError = {
        message: 'Error al crear conexión',
        details: error instanceof Error ? error.message : 'Error al inicializar EventSource',
        code: 'CONNECTION_CREATE_ERROR',
        timestamp: Date.now()
      };
      eventLogger.error('❌ Error al crear conexión:', errorData);
      this.emit('error', errorData);
      throw error;
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      const errorData: EventError = {
        message: 'No se pudo restablecer la conexión',
        details: `Máximo número de intentos (${this.MAX_RECONNECT_ATTEMPTS}) alcanzado`,
        code: 'MAX_RECONNECT_ATTEMPTS',
        timestamp: Date.now()
      };
      eventLogger.error('❌ Máximo número de intentos de reconexión alcanzado');
      this.emit('error', errorData);
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.reconnectAttempts++;
    const delay = this.RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimeout = setTimeout(() => {
      if (this.currentEndpoint) {
        eventLogger.info(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}...`);
        this.connect(this.currentEndpoint).catch(error => {
          eventLogger.error('❌ Error en reconexión:', error);
        });
      }
    }, delay);
  }

  on<T = any>(event: EventType, callback: EventCallback<T>) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
      eventLogger.debug('📝 Creando nuevo array de handlers para evento:', event);
    }

    this.handlers.get(event)?.add(callback as EventCallback);
    eventLogger.debug('📝 Handler registrado para evento:', event);
  }

  off<T = any>(event: EventType, callback: EventCallback<T>) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(callback as EventCallback);
      eventLogger.debug('🗑️ Eliminados', handlers.size, 'handlers para evento:', event);
    }
  }

  emit(event: EventType, data?: any) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          eventLogger.error('❌ Error en handler de evento:', event, error);
        }
      });
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.currentEndpoint = null;
    this.reconnectAttempts = 0;
    this.handlers.clear();
    eventLogger.info('🔌 Conexión cerrada');
  }
}

export const eventService = new EventService();