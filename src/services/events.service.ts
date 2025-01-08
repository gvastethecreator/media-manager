import { EventSourcePolyfill as EventSource } from 'event-source-polyfill';
import { logger } from '@/lib/logger';

export type EventCallback = (data: any) => void;
export type ErrorCallback = (error: any) => void;

interface EventSourceConfig {
  withCredentials?: boolean;
  headers?: Record<string, string>;
  heartbeatTimeout?: number;
  reconnectInterval?: number;
}

interface EventHandlers {
  [key: string]: EventCallback[];
}

export class EventService {
  private static instance: EventService;
  private eventSource: EventSource | null = null;
  private eventHandlers: EventHandlers = {};
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = Date.now();
  private baseUrl: string = '';

  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly RECONNECT_DELAY = 2000;
  private readonly DEFAULT_HEARTBEAT_TIMEOUT = 30000;
  private readonly DEFAULT_RECONNECT_INTERVAL = 1000;
  private readonly logger = logger.withContext('EventService');

  private constructor() {
    // Intentar obtener la URL base del entorno
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  private getFullUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.baseUrl}${endpoint}`;
  }

  connect(endpoint: string, config: EventSourceConfig = {}): void {
    if (this.eventSource) {
      this.disconnect();
    }

    const heartbeatTimeout = config.heartbeatTimeout || this.DEFAULT_HEARTBEAT_TIMEOUT;
    const reconnectInterval = config.reconnectInterval || this.DEFAULT_RECONNECT_INTERVAL;

    try {
      const fullUrl = this.getFullUrl(endpoint);

      this.eventSource = new EventSource(fullUrl, {
        withCredentials: config.withCredentials ?? true,
        headers: {
          ...config.headers,
          'Cache-Control': 'no-cache',
          'Client-Id': `client-${Date.now()}`,
          'Accept': 'text/event-stream'
        },
        heartbeatTimeout: heartbeatTimeout
      });

      this.setupHeartbeat(heartbeatTimeout);

      this.eventSource.onopen = () => {
        this.logger.info('🔌 Conexión establecida con', endpoint);
        this.reconnectAttempts = 0;
        this.lastHeartbeat = Date.now();
      };

      this.eventSource.onmessage = (event) => {
        try {
          if (event.data === 'heartbeat') {
            this.handleHeartbeat();
            return;
          }

          const data = JSON.parse(event.data);
          this.logger.debug('📨 Evento recibido:', data);
          this.handleEvent(data);
          this.lastHeartbeat = Date.now();
        } catch (error) {
          this.logger.error('❌ Error procesando evento:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        this.handleError(error, endpoint, config);
      };

      // Configurar reconexión automática
      this.eventSource.addEventListener('error', () => {
        if (this.shouldReconnect()) {
          setTimeout(() => {
            this.logger.info('🔄 Intentando reconexión...');
            this.connect(endpoint, config);
          }, reconnectInterval * Math.pow(2, this.reconnectAttempts));
        }
      });

    } catch (error) {
      this.logger.error('❌ Error al establecer conexión:', error);
      this.handleError(error, endpoint, config);
    }
  }

  private setupHeartbeat(timeout: number): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
      if (timeSinceLastHeartbeat > timeout) {
        this.logger.warn(`⚠️ No se ha recibido heartbeat en ${timeSinceLastHeartbeat}ms`);
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
          this.emit('error', {
            message: 'Conexión perdida - No se han recibido heartbeats',
            timeSinceLastHeartbeat
          });
        }
      }
    }, Math.floor(timeout / 2));
  }

  private handleHeartbeat(): void {
    this.lastHeartbeat = Date.now();
    this.logger.debug('💓 Heartbeat recibido');
  }

  private shouldReconnect(): boolean {
    return this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS;
  }

  private handleError(error: any, endpoint: string, config: EventSourceConfig): void {
    this.logger.error('❌ Error en la conexión:', error);
    this.disconnect();

    if (this.shouldReconnect()) {
      this.reconnectAttempts++;
      const delay = this.RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1);
      this.logger.info(`🔄 Reintentando conexión (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}) en ${delay}ms...`);

      setTimeout(() => {
        if (this.eventSource?.readyState !== 1) {
          this.connect(endpoint, {
            ...config,
            heartbeatTimeout: Math.min(config.heartbeatTimeout || this.DEFAULT_HEARTBEAT_TIMEOUT, 15000)
          });
        }
      }, delay);
    } else {
      this.logger.error('❌ Máximo número de intentos de reconexión alcanzado');
      this.emit('error', {
        message: 'Error de conexión después de varios intentos',
        originalError: error
      });
    }
  }

  private handleEvent(data: any): void {
    const { type, payload } = data;
    if (!type) {
      this.logger.warn('⚠️ Evento recibido sin tipo:', data);
      return;
    }

    this.logger.debug(`📨 Procesando evento ${type}:`, payload);

    if (this.eventHandlers[type]) {
      this.eventHandlers[type].forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          this.logger.error(`❌ Error en callback para evento ${type}:`, error);
        }
      });
    } else {
      this.logger.warn(`⚠️ No hay handlers registrados para el evento: ${type}`);
    }
  }

  on(eventType: string, callback: EventCallback): void {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = [];
      this.logger.debug(`📝 Creando nuevo array de handlers para evento: ${eventType}`);
    }
    this.eventHandlers[eventType].push(callback);
    this.logger.debug(`📝 Handler registrado para evento: ${eventType}`);
  }

  off(eventType: string, callback: EventCallback): void {
    if (this.eventHandlers[eventType]) {
      const initialLength = this.eventHandlers[eventType].length;
      this.eventHandlers[eventType] = this.eventHandlers[eventType].filter(
        cb => cb !== callback
      );
      const removedCount = initialLength - this.eventHandlers[eventType].length;
      this.logger.debug(`🗑️ Eliminados ${removedCount} handlers para evento: ${eventType}`);
    }
  }

  private emit(eventType: string, data: any): void {
    if (this.eventHandlers[eventType]) {
      this.logger.debug(`📤 Emitiendo evento ${eventType}:`, data);
      this.eventHandlers[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.logger.error(`❌ Error en callback al emitir ${eventType}:`, error);
        }
      });
    } else {
      this.logger.warn(`⚠️ Intento de emitir evento ${eventType} sin handlers registrados`);
    }
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.logger.info('🔌 Conexión cerrada');
    }
  }

  clearHandlers(): void {
    this.eventHandlers = {};
    this.logger.debug('🧹 Handlers limpiados');
  }
}

export const eventService = EventService.getInstance();