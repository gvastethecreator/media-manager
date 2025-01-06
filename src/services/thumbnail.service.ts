import { formatBytes } from "@/lib/utils"
import { thumbnailCache } from "@/lib/cache"
import { PrismaClient } from '@prisma/client'
import { EventSourcePolyfill as EventSource } from 'event-source-polyfill'

const prisma = new PrismaClient()

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

export const THUMBNAIL_QUALITY_CONFIG: Record<ThumbnailQuality, { quality: number, width: number, height: number }> = {
  compressed: { quality: 60, width: 200, height: 200 },
  low: { quality: 70, width: 300, height: 300 },
  mid: { quality: 80, width: 400, height: 400 },
  high: { quality: 90, width: 500, height: 500 }
}

export type ThumbnailEventCallback = (event: { type: string, data: any }) => void;

class ThumbnailService {
  private static instance: ThumbnailService
  private eventSource: EventSource | null = null
  private readonly timeout = 300000; // 5 minutos
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;
  private preGenerationQueue: Set<string> = new Set();
  private isProcessingQueue = false;

  private constructor() {
    // Inicializar el servicio
    this.startQueueProcessor();
  }

  public static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService()
    }
    return ThumbnailService.instance
  }

  private async fetchWithTimeout(
    input: RequestInfo | URL,
    init?: RequestInit,
    timeout = this.timeout
  ): Promise<Response> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(input, {
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
      console.error('Error en getStats:', error)
      throw error
    }
  }

  async reprocessAll(callbacks?: ThumbnailCallbacks): Promise<void> {
    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      return new Promise((resolve, reject) => {
        this.eventSource = new EventSource(`/api/thumbnails/reprocess?_=${Date.now()}`, {
          withCredentials: true
        });

        // Timeout de seguridad
        const timeout = setTimeout(() => {
          this.eventSource?.close();
          reject(new Error('Timeout esperando respuesta'));
        }, this.timeout);

        this.eventSource.onopen = () => {
          console.log('Conexión SSE establecida');
        };

        this.eventSource.onmessage = (event) => {
          try {
            if (!event.data) return;
            const data = JSON.parse(event.data);
            console.log('Evento SSE recibido:', data);

            switch (data.type) {
              case 'start':
                callbacks?.onProgress?.({
                  ...data.data,
                  status: data.data.status || "Iniciando...",
                });
                break;
              case 'progress':
                callbacks?.onProgress?.({
                  ...data.data,
                  status: data.data.status || "Procesando...",
                });
                break;
              case 'error':
                const error = new Error(data.data.message || data.data.error);
                error.name = data.data.type;
                callbacks?.onError?.(error);
                this.eventSource?.close();
                clearTimeout(timeout);
                reject(error);
                break;
              case 'complete':
                callbacks?.onComplete?.(data.data);
                this.eventSource?.close();
                clearTimeout(timeout);
                resolve();
                break;
            }
          } catch (error) {
            console.error('Error parseando evento SSE:', error);
            callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
            this.eventSource?.close();
            clearTimeout(timeout);
            reject(error);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('Error en conexión SSE:', error);
          this.eventSource?.close();
          this.eventSource = null;
          callbacks?.onError?.(new Error('Error en la conexión SSE'));
          clearTimeout(timeout);
          reject(new Error('Error en la conexión SSE'));
        };
      });
    } catch (error) {
      console.error('Error en reprocessAll:', error);
      callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
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

  async optimizeThumbnails(callbacks?: ThumbnailCallbacks): Promise<void> {
    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      return new Promise((resolve, reject) => {
        this.eventSource = new EventSource(`/api/thumbnails/optimize?_=${Date.now()}`, {
          withCredentials: true
        });

        // Timeout de seguridad
        const timeout = setTimeout(() => {
          this.eventSource?.close();
          reject(new Error('Timeout esperando respuesta'));
        }, this.timeout);

        this.eventSource.onopen = () => {
          console.log('Conexión SSE establecida');
        };

        this.eventSource.onmessage = (event) => {
          try {
            if (!event.data) return;
            const data = JSON.parse(event.data);
            console.log('Evento SSE recibido:', data);

            switch (data.type) {
              case 'start':
                callbacks?.onProgress?.({
                  ...data.data,
                  status: data.data.status || "Iniciando...",
                });
                break;
              case 'progress':
                callbacks?.onProgress?.({
                  ...data.data,
                  status: data.data.status || "Optimizando...",
                });
                break;
              case 'error':
                const error = new Error(data.data.message || data.data.error);
                error.name = data.data.type;
                callbacks?.onError?.(error);
                this.eventSource?.close();
                clearTimeout(timeout);
                reject(error);
                break;
              case 'complete':
                callbacks?.onComplete?.(data.data);
                this.eventSource?.close();
                clearTimeout(timeout);
                resolve();
                break;
            }
          } catch (error) {
            console.error('Error parseando evento SSE:', error);
            callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
            this.eventSource?.close();
            clearTimeout(timeout);
            reject(error);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('Error en conexión SSE:', error);
          this.eventSource?.close();
          this.eventSource = null;
          callbacks?.onError?.(new Error('Error en la conexión SSE'));
          clearTimeout(timeout);
          reject(new Error('Error en la conexión SSE'));
        };
      });
    } catch (error) {
      console.error('Error en optimizeThumbnails:', error);
      callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async cleanThumbnails(callbacks?: ThumbnailCallbacks): Promise<void> {
    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      return new Promise((resolve, reject) => {
        this.eventSource = new EventSource(`/api/thumbnails/clean?_=${Date.now()}`, {
          withCredentials: true
        });

        // Timeout de seguridad
        const timeout = setTimeout(() => {
          this.eventSource?.close();
          reject(new Error('Timeout esperando respuesta'));
        }, this.timeout);

        this.eventSource.onopen = () => {
          console.log('Conexión SSE establecida');
        };

        this.eventSource.onmessage = (event) => {
          try {
            if (!event.data) return;
            const data = JSON.parse(event.data);
            console.log('Evento SSE recibido:', data);

            switch (data.type) {
              case 'start':
                callbacks?.onProgress?.({
                  ...data.data,
                  status: data.data.status || "Iniciando...",
                });
                break;
              case 'progress':
                callbacks?.onProgress?.({
                  ...data.data,
                  status: data.data.status || "Limpiando...",
                });
                break;
              case 'error':
                const error = new Error(data.data.message || data.data.error);
                error.name = data.data.type;
                callbacks?.onError?.(error);
                this.eventSource?.close();
                clearTimeout(timeout);
                reject(error);
                break;
              case 'complete':
                callbacks?.onComplete?.(data.data);
                this.eventSource?.close();
                clearTimeout(timeout);
                resolve();
                break;
            }
          } catch (error) {
            console.error('Error parseando evento SSE:', error);
            callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
            this.eventSource?.close();
            clearTimeout(timeout);
            reject(error);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('Error en conexión SSE:', error);
          this.eventSource?.close();
          this.eventSource = null;
          callbacks?.onError?.(new Error('Error en la conexión SSE'));
          clearTimeout(timeout);
          reject(new Error('Error en la conexión SSE'));
        };
      });
    } catch (error) {
      console.error('Error en cleanThumbnails:', error);
      callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  formatSize(bytes: number): string {
    return formatBytes(bytes)
  }

  getQualityConfig(quality: ThumbnailQuality) {
    return THUMBNAIL_QUALITY_CONFIG[quality]
  }

  cancelProcessing() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
}

export const thumbnailService = ThumbnailService.getInstance()
