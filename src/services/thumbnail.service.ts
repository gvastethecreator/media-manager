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

  formatSize(bytes: number): string {
    return formatBytes(bytes)
  }
}

export const thumbnailService = new ThumbnailService()
