import { formatBytes } from "@/lib/utils"
import { thumbnailCache } from "@/lib/cache"

export interface ThumbnailStats {
  total: number
  totalSize: number
  pending: number
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
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(id)
      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
  }

  async getStats(): Promise<ThumbnailStats> {
    try {
      // Intentar obtener del caché primero
      const cached = await thumbnailCache.get('thumbnail_stats')
      if (cached) {
        return cached
      }

      const response = await this.fetchWithTimeout('/api/images/thumbnail-stats')
      if (!response.ok) {
        throw new Error('Error obteniendo estadísticas de miniaturas')
      }
      const stats = await response.json()
      
      // Guardar en caché por 5 minutos
      await thumbnailCache.set('thumbnail_stats', stats, 1000 * 60 * 5)
      return stats
    } catch (error) {
      console.error('Error en getStats:', error)
      return {
        total: 0,
        totalSize: 0,
        pending: 0,
        errors: []
      }
    }
  }

  async reprocessAll(onProgress?: (progress: number) => void): Promise<void> {
    try {
      const response = await this.fetchWithTimeout('/api/images/reprocess-thumbnails', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Error reprocesando miniaturas')
      }

      // Limpiar caché al reprocesar
      await thumbnailCache.clear()

      // Actualizar progreso mientras se procesan
      const reader = response.body?.getReader()
      if (reader && onProgress) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const progress = new TextDecoder().decode(value)
          onProgress(parseInt(progress))
        }
      }
    } catch (error) {
      console.error('Error en reprocessAll:', error)
      throw new Error('Error al reprocesar las miniaturas. Por favor, inténtalo de nuevo.')
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

      // Si no está en caché, generarlo
      const response = await this.fetchWithTimeout(`/api/images/${imageId}/thumbnail`, {
        headers: {
          'Accept': 'image/webp'
        }
      })

      if (!response.ok) {
        throw new Error('Error obteniendo miniatura')
      }

      const blob = await response.blob()
      const base64 = await this.blobToBase64(blob)
      
      // Guardar en caché
      await thumbnailCache.set(cacheKey, base64)
      
      return base64
    } catch (error) {
      console.error('Error en getThumbnail:', error)
      throw new Error('Error al obtener la miniatura. Por favor, inténtalo de nuevo.')
    }
  }

  async generateThumbnail(imageId: string, quality: ThumbnailQuality): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(`/api/images/${imageId}/thumbnail/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quality })
      })
      
      if (!response.ok) {
        throw new Error('Error generando miniatura')
      }

      // Invalidar caché para esta imagen
      const cacheKey = `thumbnail:${imageId}:${quality}`
      await thumbnailCache.delete(cacheKey)
    } catch (error) {
      console.error('Error en generateThumbnail:', error)
      throw new Error('Error al generar la miniatura. Por favor, inténtalo de nuevo.')
    }
  }

  getQualityConfig(quality: ThumbnailQuality) {
    return THUMBNAIL_QUALITY_CONFIG[quality]
  }

  formatSize(bytes: number): string {
    return formatBytes(bytes)
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
}

export const thumbnailService = new ThumbnailService()
