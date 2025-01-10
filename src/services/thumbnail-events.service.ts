import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';
import { ProcessStatus } from './thumbnail.service';
import { ThumbnailStats } from '@/types/thumbnails';

type ThumbnailEventType = 'thumbnail:progress' | 'thumbnail:error' | 'thumbnail:complete' | 'thumbnail:stats';

interface ThumbnailEventData {
  'thumbnail:progress': ProcessStatus;
  'thumbnail:error': Error | unknown;
  'thumbnail:complete': {
    processed?: number;
    optimized?: number;
    cleaned?: number;
    totalSaved?: number;
    totalFreed?: number;
    errors?: number;
  };
  'thumbnail:stats': ThumbnailStats;
}

class ThumbnailEventService {
  private static instance: ThumbnailEventService;
  private emitter: EventEmitter;
  private readonly logger = logger.withContext('ThumbnailEvents');

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
  }

  static getInstance(): ThumbnailEventService {
    if (!ThumbnailEventService.instance) {
      ThumbnailEventService.instance = new ThumbnailEventService();
    }
    return ThumbnailEventService.instance;
  }

  private emit<T extends ThumbnailEventType>(event: T, data: ThumbnailEventData[T]) {
    this.emitter.emit(event, data);
  }

  // Métodos para emitir eventos
  emitProgress(status: ProcessStatus) {
    this.logger.debug('📊 Emitiendo progreso:', status);
    this.emit('thumbnail:progress', status);
  }

  emitError(error: Error | unknown) {
    this.logger.error('❌ Emitiendo error:', error);
    this.emit('thumbnail:error', error);
  }

  emitComplete(data: ThumbnailEventData['thumbnail:complete']) {
    this.logger.info('✅ Proceso completado:', data);
    this.emit('thumbnail:complete', data);
  }

  emitStats(stats: ThumbnailStats) {
    this.logger.debug('📈 Actualizando estadísticas:', stats);
    this.emit('thumbnail:stats', stats);
  }

  // Métodos para suscribirse a eventos
  onProgress(handler: (status: ProcessStatus) => void) {
    this.emitter.on('thumbnail:progress', handler);
  }

  onError(handler: (error: Error | unknown) => void) {
    this.emitter.on('thumbnail:error', handler);
  }

  onComplete(handler: (data: ThumbnailEventData['thumbnail:complete']) => void) {
    this.emitter.on('thumbnail:complete', handler);
  }

  onStats(handler: (stats: ThumbnailStats) => void) {
    this.emitter.on('thumbnail:stats', handler);
  }

  // Métodos para desuscribirse de eventos
  offProgress(handler: (status: ProcessStatus) => void) {
    this.emitter.off('thumbnail:progress', handler);
  }

  offError(handler: (error: Error | unknown) => void) {
    this.emitter.off('thumbnail:error', handler);
  }

  offComplete(handler: (data: ThumbnailEventData['thumbnail:complete']) => void) {
    this.emitter.off('thumbnail:complete', handler);
  }

  offStats(handler: (stats: ThumbnailStats) => void) {
    this.emitter.off('thumbnail:stats', handler);
  }

  // Método para remover todos los listeners
  removeAllListeners() {
    this.emitter.removeAllListeners();
    this.logger.debug('🧹 Todos los listeners removidos');
  }
}

export const thumbnailEventService = ThumbnailEventService.getInstance();