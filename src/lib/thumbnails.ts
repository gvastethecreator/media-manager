const sharp = require('sharp')
import { logger } from './logger'

const thumbLogger = logger.withContext('Thumbnails')

interface OptimizeResult {
  data: Buffer
  size: number
  width: number
  height: number
}

/**
 * Optimiza una miniatura existente
 * @param buffer Buffer de la miniatura a optimizar
 * @returns Resultado de la optimización con el nuevo buffer y metadatos
 */
export async function optimizeThumbnail(buffer: Buffer): Promise<OptimizeResult> {
  try {
    // Procesar con sharp
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Optimizar manteniendo calidad pero reduciendo tamaño
    const optimized = await image
      .jpeg({
        quality: 80,
        progressive: true,
        optimizeScans: true,
        mozjpeg: true
      })
      .toBuffer({ resolveWithObject: true })

    return {
      data: optimized.data,
      size: optimized.info.size,
      width: metadata.width || 0,
      height: metadata.height || 0
    }
  } catch (error) {
    thumbLogger.error('Error optimizing thumbnail:', error)
    throw error
  }
}