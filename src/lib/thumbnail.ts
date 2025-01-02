import { createThumbnail } from './image'
import { ThumbnailQuality } from '@/services/thumbnail.service'

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

    const options = getThumbnailOptions(quality)
    const result = await createThumbnail(imagePath, options)

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
      width: options.width || 0,
      height: options.height || 0
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

function getThumbnailOptions(quality: ThumbnailQuality) {
  switch (quality) {
    case 'low':
      return {
        width: 150,
        height: 150,
        quality: 60
      }
    case 'high':
      return {
        width: 400,
        height: 400,
        quality: 90
      }
    case 'mid':
    default:
      return {
        width: 250,
        height: 250,
        quality: 80
      }
  }
}