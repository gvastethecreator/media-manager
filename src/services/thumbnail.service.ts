import { logger } from '@/lib/logger'
import { optimizeThumbnail } from '@/lib/thumbnails'
import { ThumbnailQuality, THUMBNAIL_QUALITY_CONFIG } from '@/types/thumbnails'
import { EventEmitter } from 'events'
import { getThumbnail } from "@/app/actions/thumbnails.actions";
import { createHash, createHmac } from 'crypto'
import fs from 'fs/promises'

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
  private readonly SECRET_KEY = process.env.THUMBNAIL_SECRET_KEY || 'default-secret-key';

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
      thumbLogger.info('🔄 Obteniendo thumbnail:', { imageId, quality });

      // Validar calidad
      const validQualities = Object.values(ThumbnailQuality);
      if (!validQualities.includes(quality as ThumbnailQuality)) {
        thumbLogger.error('❌ Calidad de thumbnail inválida:', { quality, validQualities });
        throw new Error(`Calidad de thumbnail no válida. Debe ser una de: ${validQualities.join(', ')}`);
      }

      const config = THUMBNAIL_QUALITY_CONFIG[quality as ThumbnailQuality];
      if (!config) {
        throw new Error(`Configuración no encontrada para la calidad: ${quality}`);
      }

      const response = await getThumbnail(imageId, quality as ThumbnailQuality);
      if (!response) {
        throw new Error('No se pudo obtener el thumbnail');
      }

      thumbLogger.info('✅ Thumbnail obtenido:', {
        imageId,
        size: response.size,
        quality
      });

      return response.thumbnail;
    } catch (error) {
      thumbLogger.error('❌ Error en getThumbnail:', {
        imageId,
        quality,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  async verifySignedToken(token: string): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      thumbLogger.info('🔄 Verificando token firmado:', token)

      // Decodificar el token
      const [signature, payload] = token.split('.')
      if (!signature || !payload) {
        throw new Error('Token inválido')
      }

      // Decodificar el payload
      const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8')
      const data = JSON.parse(decodedPayload)

      // Verificar que el token no haya expirado
      if (data.exp && Date.now() > data.exp) {
        throw new Error('Token expirado')
      }

      // Generar firma para comparar
      const hmac = createHmac('sha256', this.SECRET_KEY)
      hmac.update(payload)
      const expectedSignature = hmac.digest('base64url')

      // Verificar firma
      if (signature !== expectedSignature) {
        throw new Error('Firma inválida')
      }

      // Obtener la imagen original
      const imageBuffer = await fs.readFile(data.path)
      const mimeType = data.mimeType || 'image/jpeg'

      thumbLogger.info('✅ Token verificado correctamente')
      return { buffer: imageBuffer, mimeType }

    } catch (error) {
      thumbLogger.error('❌ Error verificando token:', error)
      throw new Error('Token inválido o expirado')
    }
  }
}

export const thumbnailService = ThumbnailService.getInstance();
