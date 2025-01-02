import { formatBytes } from "@/lib/utils"
import { thumbnailCache } from "@/lib/cache"

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

export const THUMBNAIL_QUALITY_CONFIG: Record<ThumbnailQuality, { quality: number, width: number, height: number }> = {
  compressed: { quality: 60, width: 200, height: 200 },
  low: { quality: 70, width: 300, height: 300 },
  mid: { quality: 80, width: 400, height: 400 },
  high: { quality: 90, width: 500, height: 500 }
}

class ThumbnailService {
  private static instance: ThumbnailService;

  private constructor() { }

  public static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService();
    }
    return ThumbnailService.instance;
  }

  private async fetchWithTimeout(
    input: RequestInfo | URL,
    init?: RequestInit,
    timeout = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async getStats(): Promise<ThumbnailStats> {
    try {
      const response = await this.fetchWithTimeout('/api/thumbnails/stats', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Error obteniendo estadísticas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getStats:', error);
      throw new Error('Error al obtener estadísticas. Por favor, inténtalo de nuevo.');
    }
  }

  async reprocessAll(onProgress?: (data: any) => void): Promise<void> {
    try {
      const response = await fetch('/api/thumbnails/reprocess', {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok || !response.body) {
        const errorText = await response.text()
        console.error('Error en respuesta del servidor:', errorText)
        throw new Error('Error iniciando el reprocesamiento de miniaturas')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('Stream completado')
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = line.slice(6)
                console.log('Evento SSE recibido:', eventData)
                const event = JSON.parse(eventData)

                if (onProgress) {
                  onProgress(event)
                }

                // Si es un evento de error, lanzar excepción
                if (event.type === 'error' && event.data?.error) {
                  throw new Error(event.data.error)
                }
              } catch (parseError) {
                console.error('Error parseando evento SSE:', parseError)
                console.log('Línea con error:', line)
              }
            }
          }
        }

        // Procesar buffer restante
        if (buffer && buffer.startsWith('data: ')) {
          try {
            const eventData = buffer.slice(6)
            console.log('Evento SSE final recibido:', eventData)
            const event = JSON.parse(eventData)

            if (onProgress) {
              onProgress(event)
            }
          } catch (parseError) {
            console.error('Error parseando evento SSE final:', parseError)
            console.log('Buffer con error:', buffer)
          }
        }
      } catch (streamError) {
        console.error('Error procesando stream:', streamError)
        throw streamError
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('Error en reprocessAll:', error)
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Error al reprocesar las miniaturas. Por favor, inténtalo de nuevo.'
      )
    }
  }

  async getThumbnail(imageId: string, quality: ThumbnailQuality): Promise<string> {
    try {
      const cacheKey = `thumbnail:${imageId}:${quality}`

      // Intentar obtener del caché
      const cached = await thumbnailCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.fetchWithTimeout(`/api/thumbnails/${imageId}?quality=${quality}`, {
        headers: {
          'Accept': 'image/webp',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Error obteniendo miniatura:', error)
        throw new Error('Error al obtener la miniatura')
      }

      const blob = await response.blob()
      const base64 = await this.blobToBase64(blob)

      // Guardar en caché
      await thumbnailCache.set(cacheKey, base64)

      return base64
    } catch (error) {
      console.error('Error en getThumbnail:', error)
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Error al obtener la miniatura. Por favor, inténtalo de nuevo.'
      )
    }
  }

  async generateThumbnail(imageId: string, quality: ThumbnailQuality): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(`/api/thumbnails/${imageId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ quality })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Error generando miniatura');
      }

      // Invalidar caché para esta imagen
      const cacheKey = `thumbnail:${imageId}:${quality}`;
      await thumbnailCache.delete(cacheKey);
    } catch (error) {
      console.error('Error en generateThumbnail:', error);
      throw new Error('Error al generar la miniatura. Por favor, inténtalo de nuevo.');
    }
  }

  async optimizeThumbnails(onProgress?: (data: any) => void): Promise<void> {
    try {
      const response = await fetch('/api/thumbnails/optimize', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Error optimizando miniaturas');
      }

      // Limpiar caché al optimizar
      await thumbnailCache.clear();

      // Procesar eventos SSE
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader && onProgress) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const event = JSON.parse(line);
              onProgress(event);
            } catch (error) {
              console.error('Error parsing event:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error en optimizeThumbnails:', error);
      throw new Error('Error al optimizar las miniaturas. Por favor, inténtalo de nuevo.');
    }
  }

  formatSize(bytes: number): string {
    return formatBytes(bytes)
  }

  getQualityConfig(quality: ThumbnailQuality) {
    return THUMBNAIL_QUALITY_CONFIG[quality];
  }
}

export const thumbnailService = ThumbnailService.getInstance();
