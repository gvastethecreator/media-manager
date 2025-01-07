import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

class ThumbnailEventService {
  private static instance: ThumbnailEventService;
  private emitter: EventEmitter;
  private readonly logger = logger.withContext('ThumbnailEvents');

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50); // Aumentamos el límite de listeners
  }

  static getInstance(): ThumbnailEventService {
    if (!ThumbnailEventService.instance) {
      ThumbnailEventService.instance = new ThumbnailEventService();
    }
    return ThumbnailEventService.instance;
  }

  // Métodos para emitir eventos
  emitProgress(status: any) {
    this.logger.debug('📊 Emitiendo progreso:', status);
    this.emitter.emit('thumbnail:progress', status);
  }

  emitError(error: any) {
    this.logger.error('❌ Emitiendo error:', error);
    this.emitter.emit('thumbnail:error', error);
  }

  emitComplete(data: any) {
    this.logger.info('✅ Proceso completado:', data);
    this.emitter.emit('thumbnail:complete', data);
  }

  emitStats(stats: any) {
    this.logger.debug('📈 Actualizando estadísticas:', stats);
    this.emitter.emit('thumbnail:stats', stats);
  }

  // Métodos para suscribirse a eventos
  onProgress(handler: (status: any) => void) {
    this.emitter.on('thumbnail:progress', handler);
  }

  onError(handler: (error: any) => void) {
    this.emitter.on('thumbnail:error', handler);
  }

  onComplete(handler: (data: any) => void) {
    this.emitter.on('thumbnail:complete', handler);
  }

  onStats(handler: (stats: any) => void) {
    this.emitter.on('thumbnail:stats', handler);
  }

  // Métodos para desuscribirse de eventos
  offProgress(handler: (status: any) => void) {
    this.emitter.off('thumbnail:progress', handler);
  }

  offError(handler: (error: any) => void) {
    this.emitter.off('thumbnail:error', handler);
  }

  offComplete(handler: (data: any) => void) {
    this.emitter.off('thumbnail:complete', handler);
  }

  offStats(handler: (stats: any) => void) {
    this.emitter.off('thumbnail:stats', handler);
  }

  // Método para remover todos los listeners
  removeAllListeners() {
    this.emitter.removeAllListeners();
    this.logger.debug('🧹 Todos los listeners removidos');
  }
}

export const thumbnailEventService = ThumbnailEventService.getInstance();