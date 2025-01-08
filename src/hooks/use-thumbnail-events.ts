import { useEffect } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { useThumbnailStore } from '@/store/thumbnails';
import { logger } from '@/lib/logger';
import { ProcessStatus, ThumbnailStats } from '@/services/thumbnail.service';

const RETRY_INTERVAL = 5000;
const HEARTBEAT_TIMEOUT = 30000;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface EventData {
  data: string;
  type: string;
}

interface ProgressEvent extends ProcessStatus {
  status: string;
  progress: number;
  current?: number;
  total?: number;
  currentFile?: string;
  lastProcessed?: {
    id: string;
    path: string;
    processedAt: string;
  };
}

interface ErrorEvent {
  message: string;
  details?: string;
  code?: string;
}

interface CompleteEvent {
  processed?: number;
  optimized?: number;
  cleaned?: number;
  totalSaved?: number;
  totalFreed?: number;
  errors?: number;
}

export function useThumbnailEvents() {
  const { setProcessing, setStats, setError, setProcessStatus } = useThumbnailStore();

  useEffect(() => {
    let eventSource: EventSourcePolyfill | null = null;
    let heartbeatTimeout: NodeJS.Timeout;
    let retryTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;

    const resetHeartbeatTimeout = () => {
      if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
      heartbeatTimeout = setTimeout(() => {
        logger.warn('⚠️ No se ha recibido heartbeat en', HEARTBEAT_TIMEOUT, 'ms');
        reconnect();
      }, HEARTBEAT_TIMEOUT);
    };

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      try {
        const url = new URL('/api/thumbnails/events', BASE_URL);
        eventSource = new EventSourcePolyfill(url.toString(), {
          heartbeatTimeout: HEARTBEAT_TIMEOUT,
          withCredentials: true,
          headers: {
            'Cache-Control': 'no-cache',
            'Accept': 'text/event-stream'
          }
        });

        eventSource.onopen = () => {
          logger.info('🔌 Conexión SSE establecida');
          reconnectAttempts = 0;
          resetHeartbeatTimeout();
        };

        eventSource.onerror = (error) => {
          logger.error('❌ Error en conexión SSE:', error);
          setError('Error en la conexión de eventos');
          reconnect();
        };

        eventSource.addEventListener('heartbeat', () => {
          resetHeartbeatTimeout();
        });

        eventSource.addEventListener('progress', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as ProgressEvent;
            setProcessStatus({
              status: data.status || 'Procesando...',
              progress: data.progress || 0,
              current: data.current,
              total: data.total,
              currentFile: data.currentFile,
              lastProcessed: data.lastProcessed
            });
            resetHeartbeatTimeout();
          } catch (error) {
            logger.error('❌ Error procesando evento de progreso:', error);
          }
        });

        eventSource.addEventListener('stats', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as ThumbnailStats;
            setStats(data);
            resetHeartbeatTimeout();
          } catch (error) {
            logger.error('❌ Error procesando evento de estadísticas:', error);
          }
        });

        eventSource.addEventListener('complete', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as CompleteEvent;
            setProcessing(false);
            setProcessStatus({
              status: 'Completado',
              progress: 100,
              ...data
            });
            resetHeartbeatTimeout();
          } catch (error) {
            logger.error('❌ Error procesando evento de completado:', error);
          }
        });

        eventSource.addEventListener('error', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as ErrorEvent;
            setError(data.message || 'Error desconocido');
            logger.error('❌ Error recibido:', data);
            resetHeartbeatTimeout();
          } catch (error) {
            logger.error('❌ Error procesando evento de error:', error);
            setError('Error desconocido en el proceso');
          }
        });
      } catch (error) {
        logger.error('❌ Error creando conexión SSE:', error);
        setError(error instanceof Error ? error.message : 'Error al establecer la conexión');
        reconnect();
      }
    };

    const reconnect = () => {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        logger.error('❌ Máximo número de intentos de reconexión alcanzado');
        setError('No se pudo restablecer la conexión después de varios intentos');
        return;
      }

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (retryTimeout) clearTimeout(retryTimeout);

      reconnectAttempts++;
      const delay = RETRY_INTERVAL * Math.pow(2, reconnectAttempts - 1);

      retryTimeout = setTimeout(() => {
        logger.info(`🔄 Intento de reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
        connect();
      }, delay);
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [setProcessing, setStats, setError, setProcessStatus]);
}