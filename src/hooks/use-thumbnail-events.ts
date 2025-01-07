import { useEffect } from 'react';
import { useThumbnailStore } from '@/store/thumbnails';
import { eventService } from '@/services/events.service';
import { logger } from '@/lib/logger';

const THUMBNAIL_EVENTS_ENDPOINT = '/api/thumbnails/events';
const eventLogger = logger.withContext('ThumbnailEvents');

export function useThumbnailEvents() {
  const { updateProcessStatus, setProcessing, updateStats, setError } = useThumbnailStore();

  useEffect(() => {
    eventLogger.info('🎯 Iniciando monitoreo de eventos de thumbnails');

    // Configurar handlers de eventos
    const setupEventHandlers = () => {
      eventService.on('connected', () => {
        eventLogger.info('✅ Conexión confirmada para eventos de thumbnails');
      });

      eventService.on('progress', (data) => {
        eventLogger.debug('📊 Progreso actualizado:', data);
        updateProcessStatus(data);
      });

      eventService.on('complete', (data) => {
        eventLogger.info('✨ Proceso completado:', data);
        setProcessing(false);
        updateStats(data);
      });

      eventService.on('error', (error) => {
        eventLogger.error('❌ Error en proceso:', error);
        setError(error.message || 'Error desconocido');
        setProcessing(false);
      });

      eventService.on('stats', (data) => {
        eventLogger.debug('📈 Estadísticas actualizadas:', data);
        updateStats(data);
      });
    };

    // Iniciar conexión
    setupEventHandlers();
    eventService.connect(THUMBNAIL_EVENTS_ENDPOINT);

    // Cleanup
    return () => {
      eventLogger.info('🧹 Limpiando conexión de eventos');
      eventService.disconnect();
      eventService.clearHandlers();
    };
  }, [updateProcessStatus, setProcessing, updateStats, setError]);
}