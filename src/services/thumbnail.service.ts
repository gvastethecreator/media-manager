import { formatBytes } from "@/lib/utils"
import { thumbnailCache } from "@/lib/cache"
import { PrismaClient } from '@prisma/client'
import { EventSourcePolyfill as EventSource } from 'event-source-polyfill'
import { logger } from '@/lib/logger'
import { eventService } from './events.service'
import { thumbnailEventService } from './thumbnail-events.service'

const prisma = new PrismaClient()

// Crear una instancia específica para el servicio de thumbnails
const thumbLogger = logger.withContext('ThumbnailService')

// Configuración base para las URLs
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface ThumbnailStats {
  total: number
  totalSize: number
  pending: number
  withThumbnail: number
  recentlyProcessed: {
    id: string
    path: string
    processedAt: Date
  }[]
  errors: ThumbnailError[]
}

export interface ThumbnailError {
  imageId: string
  imagePath: string
  error: string
  timestamp: Date
}

export type ThumbnailQuality = 'compressed' | 'low' | 'mid' | 'high'

export interface ThumbnailConfig {
  quality: ThumbnailQuality
  width: number
  height: number
  format: 'webp'
}

export interface ProcessStatus {
  status?: string
  current?: number
  total?: number
  progress?: number
  currentFile?: string
  lastProcessed?: {
    id: string
    path: string
    processedAt: string
  }
}

export interface ThumbnailCallbacks {
  onProgress?: (status: ProcessStatus) => void
  onError?: (error: Error) => void
  onComplete?: (data: any) => void
}

// Constantes para los nombres de eventos
const EVENTS = {
  PROGRESS: 'progress',
  ERROR: 'error',
  COMPLETE: 'complete',
  STATS: 'stats'
} as const;

export const THUMBNAIL_QUALITY_CONFIG: Record<ThumbnailQuality, { quality: number, width: number, height: number }> = {
  compressed: { quality: 60, width: 200, height: 200 },
  low: { quality: 70, width: 300, height: 300 },
  mid: { quality: 80, width: 400, height: 400 },
  high: { quality: 90, width: 500, height: 500 }
}

export type ThumbnailEventCallback = (event: { type: string, data: any }) => void;

export class ThumbnailService {
  private static instance: ThumbnailService
  private isProcessing = false
  private preGenerationQueue: Set<string> = new Set()
  private isProcessingQueue = false

  constructor() {
    thumbLogger.info('Initializing ThumbnailService')
    this.startQueueProcessor()
  }

  public static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService()
    }
    return ThumbnailService.instance
  }

  private getFullUrl(path: string): string {
    return `${BASE_URL}${path}`
  }

  private async fetchWithTimeout(
    input: string,
    init?: RequestInit,
    timeout = 45000
  ): Promise<Response> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    const url = this.getFullUrl(input)

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      })
      clearTimeout(id)
      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
  }

  private setupEventHandlers(callbacks?: ThumbnailCallbacks) {
    const handleProgress = (data: ProcessStatus) => {
      if (!data) return;
      const status = {
        status: data.status || "Procesando...",
        current: data.current || 0,
        total: data.total || 0,
        progress: data.progress || 0,
        currentFile: data.currentFile,
        lastProcessed: data.lastProcessed
      };

      callbacks?.onProgress?.(status);
      thumbnailEventService.emitProgress(status);
      thumbLogger.debug('📊 Progreso:', status);
    };

    const handleError = (error: any) => {
      const formattedError = error instanceof Error ? error : new Error(String(error));
      callbacks?.onError?.(formattedError);
      thumbnailEventService.emitError(formattedError);
      thumbLogger.error('❌ Error:', formattedError);
    };

    const handleComplete = (data: any) => {
      callbacks?.onComplete?.(data);
      thumbnailEventService.emitComplete(data);
      thumbLogger.info('✅ Proceso completado:', data);
    };

    const handleStats = (data: any) => {
      thumbnailEventService.emitStats(data);
      thumbLogger.debug('📈 Estadísticas actualizadas:', data);
    };

    return {
      [EVENTS.PROGRESS]: handleProgress,
      [EVENTS.ERROR]: handleError,
      [EVENTS.COMPLETE]: handleComplete,
      [EVENTS.STATS]: handleStats
    };
  }

  private async handleProcess(endpoint: string, callbacks?: ThumbnailCallbacks): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Ya hay un proceso en ejecución');
    }

    this.isProcessing = true;
    const handlers = this.setupEventHandlers(callbacks);

    try {
      await eventService.connect(endpoint, {
        withCredentials: true,
        heartbeatTimeout: 45000,
        reconnectInterval: 1000,
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'text/event-stream'
        }
      });

      // Registrar handlers
      Object.entries(handlers).forEach(([event, handler]) => {
        eventService.on(event, handler);
      });

      // Esperar a que se complete el proceso
      await new Promise<void>((resolve, reject) => {
        const completeHandler = (data: any) => {
          thumbLogger.info('✅ Proceso completado con éxito');
          resolve();
        };

        const errorHandler = (error: any) => {
          thumbLogger.error('❌ Proceso fallido:', error);
          reject(error);
        };

        eventService.on(EVENTS.COMPLETE, completeHandler);
        eventService.on(EVENTS.ERROR, errorHandler);

        // Limpiar handlers específicos de la promesa
        setTimeout(() => {
          eventService.off(EVENTS.COMPLETE, completeHandler);
          eventService.off(EVENTS.ERROR, errorHandler);
        }, 0);
      });
    } catch (error) {
      thumbLogger.error('Error en el proceso:', error);
      throw error;
    } finally {
      this.isProcessing = false;
      // Limpiar todos los handlers
      Object.entries(handlers).forEach(([event, handler]) => {
        eventService.off(event, handler);
      });
      eventService.disconnect();
    }
  }

  async optimizeThumbnails(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail optimization')
      await this.handleProcess('/api/thumbnails/optimize', options)
      thumbLogger.info('Thumbnail optimization completed')
    } catch (error) {
      thumbLogger.error('Error optimizing thumbnails:', error)
      throw error
    }
  }

  async cleanThumbnails(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail cleanup')
      await this.handleProcess('/api/thumbnails/clean', options)
      thumbLogger.info('Thumbnail cleanup completed')
    } catch (error) {
      thumbLogger.error('Error cleaning thumbnails:', error)
      throw error
    }
  }

  async reprocessAll(options: ProcessOptions = {}): Promise<void> {
    try {
      thumbLogger.info('Starting thumbnail reprocessing')
      await this.handleProcess('/api/thumbnails/reprocess', options)
      thumbLogger.info('Thumbnail reprocessing completed')
    } catch (error) {
      thumbLogger.error('Error reprocessing thumbnails:', error)
      throw error
    }
  }

  private async startQueueProcessor() {
    if (this.isProcessingQueue) return

    this.isProcessingQueue = true
    while (this.preGenerationQueue.size > 0) {
      const [nextId] = this.preGenerationQueue
      this.preGenerationQueue.delete(nextId)

      try {
        await this.generateThumbnail(nextId, 'mid')
      } catch (error) {
        console.error('Error pre-generando thumbnail:', error)
      }

      // Esperar un poco entre cada generación para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    this.isProcessingQueue = false
  }

  async getThumbnail(imageId: string, quality: ThumbnailQuality): Promise<string> {
    try {
      const cacheKey = `thumbnail:${imageId}:${quality}`

      // Intentar obtener del caché
      const cached = await thumbnailCache.get(cacheKey)
      if (cached) {
        return cached
      }

      // Si no está en caché, intentar obtener con reintentos
      let attempts = 0
      let lastError: Error | null = null

      while (attempts < this.maxRetries) {
        try {
          const response = await this.fetchWithTimeout(
            `/api/thumbnails/${imageId}?quality=${quality}`,
            {
              headers: {
                'Accept': 'image/webp',
                'Cache-Control': 'no-cache'
              }
            }
          )

          if (!response.ok) {
            const error = await response.text()
            throw new Error(error || 'Error obteniendo miniatura')
          }

          const blob = await response.blob()
          const base64 = await this.blobToBase64(blob)

          // Guardar en caché
          await thumbnailCache.set(cacheKey, base64)

          return base64
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Error desconocido')
          attempts++
          if (attempts < this.maxRetries) {
            await new Promise(resolve =>
              setTimeout(resolve, this.retryDelay * Math.pow(2, attempts - 1))
            )
          }
        }
      }

      // Si llegamos aquí, agregar a la cola de pre-generación
      this.preGenerationQueue.add(imageId)
      this.startQueueProcessor()

      throw lastError || new Error('Error al obtener la miniatura después de reintentos')
    } catch (error) {
      console.error('Error en getThumbnail:', error)
      throw error instanceof Error ? error : new Error('Error al obtener la miniatura')
    }
  }

  async generateThumbnail(imageId: string, quality: ThumbnailQuality): Promise<void> {
    let attempts = 0
    let lastError: Error | null = null

    while (attempts < this.maxRetries) {
      try {
        if (!imageId || !quality) {
          throw new Error('ID de imagen y calidad son requeridos')
        }

        const config = THUMBNAIL_QUALITY_CONFIG[quality]
        if (!config) {
          throw new Error('Calidad de thumbnail inválida')
        }

        // Obtener la imagen
        const image = await prisma.image.findUnique({
          where: { id: imageId }
        })

        if (!image) {
          throw new Error('Imagen no encontrada')
        }

        // Generar el thumbnail
        const response = await fetch(`/api/thumbnails/generate/${imageId}?quality=${quality}`, {
          method: 'POST'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error generando thumbnail');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Error generando thumbnail');
        }

        // Invalidar caché para esta imagen
        const cacheKey = `thumbnail:${imageId}:${quality}`
        await thumbnailCache.delete(cacheKey)

        return
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido')
        attempts++
        if (attempts < this.maxRetries) {
          await new Promise(resolve =>
            setTimeout(resolve, this.retryDelay * Math.pow(2, attempts - 1))
          )
        }
      }
    }

    throw lastError || new Error('Error al generar la miniatura después de reintentos')
  }

  async queueThumbnailGeneration(imageIds: string[]): Promise<void> {
    imageIds.forEach(id => this.preGenerationQueue.add(id))
    this.startQueueProcessor()
  }

  formatSize(bytes: number): string {
    return formatBytes(bytes)
  }

  getQualityConfig(quality: ThumbnailQuality) {
    return THUMBNAIL_QUALITY_CONFIG[quality]
  }

  cancelProcessing() {
    if (this.isProcessing) {
      eventService.disconnect()
      this.isProcessing = false
      thumbLogger.info('Processing cancelled')
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async getStats(): Promise<ThumbnailStats> {
    try {
      const response = await this.fetchWithTimeout('/api/thumbnails/stats', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Error obteniendo estadísticas')
      }

      return await response.json()
    } catch (error) {
      thumbLogger.error('Error en getStats:', error)
      throw error
    }
  }
}

export const thumbnailService = ThumbnailService.getInstance()
