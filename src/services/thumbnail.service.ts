import { logger } from '@/lib/logger'
import { optimizeThumbnail } from '@/lib/thumbnails'
import { ThumbnailQuality, THUMBNAIL_QUALITY_CONFIG } from '@/types/thumbnails'
import { EventEmitter } from 'events'

const thumbLogger = logger.withContext('ThumbnailService')

export { ThumbnailQuality, THUMBNAIL_QUALITY_CONFIG }

export enum EVENTS {
  PROGRESS = 'progress',
  ERROR = 'error',
  COMPLETE = 'complete',
  STATS = 'stats'
}

export interface ThumbnailError {
  imageId: string
  imagePath: string
  error: string
  timestamp: Date | string
}

export type ThumbnailErrorType = {
  imageId: string
  imagePath: string
  error: string
  timestamp: Date | string
}

export interface ProcessOptions {
  onProgress?: (status: ProcessStatus) => void
  onError?: (error: any) => void
  onComplete?: (data: any) => void
  onStats?: (stats: any) => void
}

export interface ProcessStatus {
  status?: string
  currentFile?: string
  current?: number
  total?: number
  progress?: number
  lastProcessed?: {
    id: string
    path: string
    processedAt: string
    saved?: number
  }
}

class ThumbnailService extends EventEmitter {
  private static instance: ThumbnailService;
  private isProcessing: boolean = false;

  private constructor() {
    super()
    thumbLogger.info('🚀 Inicializando ThumbnailService')
    this.setMaxListeners(50)
  }

  static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService()
    }
    return ThumbnailService.instance
  }

  // Métodos de eventos
  onProgress(callback: (status: ProcessStatus) => void): void {
    this.on(EVENTS.PROGRESS, callback)
  }

  offProgress(callback: (status: ProcessStatus) => void): void {
    this.off(EVENTS.PROGRESS, callback)
  }

  onError(callback: (error: any) => void): void {
    this.on(EVENTS.ERROR, callback)
  }

  offError(callback: (error: any) => void): void {
    this.off(EVENTS.ERROR, callback)
  }

  onComplete(callback: (data: any) => void): void {
    this.on(EVENTS.COMPLETE, callback)
  }

  offComplete(callback: (data: any) => void): void {
    this.off(EVENTS.COMPLETE, callback)
  }

  onStats(callback: (stats: any) => void): void {
    this.on(EVENTS.STATS, callback)
  }

  offStats(callback: (stats: any) => void): void {
    this.off(EVENTS.STATS, callback)
  }

  private setupEventHandlers(callbacks?: ProcessOptions) {
    return {
      [EVENTS.PROGRESS]: (data: any) => {
        this.emit(EVENTS.PROGRESS, data)
        callbacks?.onProgress?.(data)
      },
      [EVENTS.ERROR]: (error: any) => {
        this.emit(EVENTS.ERROR, error)
        callbacks?.onError?.(error)
      },
      [EVENTS.COMPLETE]: (data: any) => {
        this.emit(EVENTS.COMPLETE, data)
        callbacks?.onComplete?.(data)
      },
      [EVENTS.STATS]: (stats: any) => {
        this.emit(EVENTS.STATS, stats)
        callbacks?.onStats?.(stats)
      }
    }
  }

  private getFullUrl(path: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return new URL(normalizedPath, baseUrl).toString()
  }

  private async fetchWithTimeout(
    input: string,
    init?: RequestInit & { timeout?: number }
  ): Promise<Response> {
    const { timeout = 45000, ...restInit } = init || {}
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const url = this.getFullUrl(input)
      const response = await fetch(url, {
        ...restInit,
        signal: controller.signal
      })
      clearTimeout(id)
      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
  }

  private async handleProcess(endpoint: string, callbacks?: ProcessOptions): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Ya hay un proceso en ejecución')
    }

    this.isProcessing = true;
    const handlers = this.setupEventHandlers(callbacks);
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      const response = await this.fetchWithTimeout(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Error iniciando el proceso: ${response.statusText}`);
      }

      const bodyReader = response.body?.getReader();
      if (!bodyReader) {
        throw new Error('No se pudo iniciar la lectura del stream');
      }
      reader = bodyReader;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const [eventType, ...dataLines] = line.split('\n');
            const event = eventType.replace('event: ', '');
            const data = dataLines.join('\n').replace('data: ', '');
            const parsedData = JSON.parse(data);

            switch (event) {
              case EVENTS.PROGRESS:
                handlers[EVENTS.PROGRESS](parsedData);
                break;
              case EVENTS.ERROR:
                handlers[EVENTS.ERROR](parsedData);
                break;
              case EVENTS.COMPLETE:
                handlers[EVENTS.COMPLETE](parsedData);
                break;
              case EVENTS.STATS:
                handlers[EVENTS.STATS](parsedData);
                break;
            }
          } catch (error) {
            thumbLogger.error('Error procesando evento:', error);
          }
        }
      }
    } catch (error) {
      // Verificar si el error es por cancelación
      if (error instanceof Error && error.name === 'AbortError') {
        thumbLogger.warn('Conexión cancelada por el cliente');
        return;
      }

      const formattedError = {
        message: 'Error en la conexión',
        details: error instanceof Error ? error.message : 'Error desconocido',
        originalError: error
      };
      thumbLogger.error('Error en el proceso:', formattedError);
      throw formattedError;
    } finally {
      if (reader) {
        try {
          await reader.cancel();
        } catch (error) {
          thumbLogger.warn('Error al cerrar el reader:', error);
        }
      }
      this.isProcessing = false;
    }
  }

  async optimizeThumbnails(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail optimization')
      await this.handleProcess('api/thumbnails/optimize', options)
      thumbLogger.info('Thumbnail optimization completed')
    } catch (error) {
      thumbLogger.error('Error optimizing thumbnails:', error)
      throw error
    }
  }

  async cleanThumbnails(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail cleanup')
      await this.handleProcess('api/thumbnails/clean', options)
      thumbLogger.info('Thumbnail cleanup completed')
    } catch (error) {
      thumbLogger.error('Error cleaning thumbnails:', error)
      throw error
    }
  }

  async reprocessAll(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail reprocessing')
      await this.handleProcess('api/thumbnails/reprocess', options)
      thumbLogger.info('Thumbnail reprocessing completed')
    } catch (error) {
      thumbLogger.error('Error reprocessing thumbnails:', error)
      throw error
    }
  }

  async getThumbnail(imageId: string, quality: ThumbnailQuality): Promise<string> {
    try {
      thumbLogger.info(`🖼️ Obteniendo miniatura para imagen ${imageId} con calidad ${quality}`);

      // Construir la URL correctamente
      const url = `api/thumbnails/${encodeURIComponent(imageId)}`;
      const params = new URLSearchParams({ quality });

      const response = await this.fetchWithTimeout(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error obteniendo miniatura (${response.status}): ${errorText}`);
      }

      // Obtener el blob de la imagen
      const blob = await response.blob();

      // Verificar que el blob es una imagen
      if (!blob.type.startsWith('image/')) {
        throw new Error(`Tipo de respuesta inválido: ${blob.type}`);
      }

      // Convertir el blob a base64 de manera segura
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            if (typeof reader.result === 'string') {
              // Extraer solo la parte base64 del data URL
              const base64Data = reader.result.split(',')[1];
              if (!base64Data) {
                reject(new Error('Error al procesar la imagen'));
                return;
              }
              resolve(base64Data);
            } else {
              reject(new Error('Resultado inválido al leer la imagen'));
            }
          } catch (error) {
            reject(new Error(`Error procesando la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`));
          }
        };
        reader.onerror = () => reject(new Error('Error leyendo la imagen'));
        reader.readAsDataURL(blob);
      });

    } catch (error) {
      thumbLogger.error(`❌ Error obteniendo miniatura para imagen ${imageId}:`, error);
      throw error;
    }
  }
}

export const thumbnailService = ThumbnailService.getInstance();
