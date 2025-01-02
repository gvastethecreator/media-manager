import { createThumbnail } from './image'
import { ThumbnailQuality, THUMBNAIL_QUALITY_CONFIG } from '@/services/thumbnail.service'

interface ThumbnailResult {
  buffer: Buffer
  width: number
  height: number
}

export async function generateThumbnail(
  imagePath: string,
  quality: ThumbnailQuality = 'mid'
): Promise<ThumbnailResult | null> {
  try {
    console.log('🎯 Generando thumbnail:', {
      path: imagePath,
      quality
    })

    const config = THUMBNAIL_QUALITY_CONFIG[quality]
    const result = await createThumbnail(imagePath, {
      width: config.width,
      height: config.height,
      quality: config.quality
    })

    if (!result || !result.buffer) {
      console.error('❌ Error: No se pudo generar el thumbnail', {
        path: imagePath,
        quality
      })
      return null
    }

    console.log('✅ Thumbnail generado:', {
      path: imagePath,
      size: result.buffer.length,
      quality
    })

    return {
      buffer: result.buffer,
      width: config.width,
      height: config.height
    }
  } catch (error) {
    console.error('❌ Error generando thumbnail:', {
      path: imagePath,
      quality,
      error: error instanceof Error ? error.message : error
    })
    return null
  }
}