import { formatBytes } from "@/lib/utils"

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
  async getStats(): Promise<ThumbnailStats> {
    const response = await fetch('/api/images/thumbnail-stats')
    if (!response.ok) {
      throw new Error('Error obteniendo estadísticas de miniaturas')
    }
    return response.json()
  }

  async reprocessAll(onProgress?: (progress: number) => void): Promise<void> {
    const response = await fetch('/api/images/reprocess-thumbnails', {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error('Error reprocesando miniaturas')
    }

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
  }

  async generateThumbnail(imageId: string, quality: ThumbnailQuality): Promise<void> {
    const response = await fetch(`/api/images/${imageId}/thumbnail/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quality })
    })
    
    if (!response.ok) {
      throw new Error('Error generando miniatura')
    }
  }

  getQualityConfig(quality: ThumbnailQuality) {
    return THUMBNAIL_QUALITY_CONFIG[quality]
  }

  formatSize(bytes: number): string {
    return formatBytes(bytes)
  }
}

export const thumbnailService = new ThumbnailService()
