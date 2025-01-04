import sharp from 'sharp'
import { existsSync } from 'fs'
import { ThumbnailQuality, THUMBNAIL_QUALITY_CONFIG } from '@/services/thumbnail.service'
import type { ImageMetadata } from './metadata'

interface ProcessImageOptions {
  width: number
  height: number
  quality: number
  format?: 'webp' | 'jpeg' | 'png'
}

interface ProcessImageResult {
  buffer: Buffer
  width: number
  height: number
}

export async function processImage(
  imagePath: string,
  options: ProcessImageOptions
): Promise<ProcessImageResult> {
  try {
    if (!existsSync(imagePath)) {
      throw new Error('Archivo no encontrado')
    }

    const metadata = await sharp(imagePath, { failOn: 'none' }).metadata()
    let processor = sharp(imagePath, { failOn: 'none' })

    // Aplicar redimensionamiento
    processor = processor.resize(options.width, options.height, {
      fit: 'inside',
      withoutEnlargement: true
    })

    // Aplicar formato y calidad
    if (options.format === 'webp') {
      processor = processor.webp({ quality: options.quality })
    } else if (options.format === 'jpeg') {
      processor = processor.jpeg({ quality: options.quality })
    } else if (options.format === 'png') {
      processor = processor.png({ quality: options.quality })
    } else {
      // Por defecto usar WebP
      processor = processor.webp({ quality: options.quality })
    }

    const buffer = await processor.toBuffer()

    if (!buffer || buffer.length === 0) {
      throw new Error('Error generando buffer de imagen')
    }

    return {
      buffer,
      width: metadata.width || 0,
      height: metadata.height || 0
    }
  } catch (error) {
    console.error('Error procesando imagen:', error)
    throw error instanceof Error ? error : new Error('Error procesando imagen')
  }
}

export async function createThumbnail(
  imagePath: string,
  options: ProcessImageOptions
): Promise<ProcessImageResult> {
  try {
    if (!imagePath) {
      throw new Error('Path de imagen requerido')
    }

    if (!existsSync(imagePath)) {
      throw new Error('Archivo no encontrado')
    }

    const result = await processImage(imagePath, {
      ...options,
      format: 'webp' // Forzar WebP para thumbnails
    })

    // Validar tamaño máximo (2MB)
    const MAX_SIZE = 2 * 1024 * 1024
    if (result.buffer.length > MAX_SIZE) {
      console.warn('Thumbnail demasiado grande, reintentando con menor calidad:', {
        path: imagePath,
        size: result.buffer.length,
        maxSize: MAX_SIZE
      })

      // Reintentar con menor calidad
      const lowerQualityResult = await processImage(imagePath, {
        ...options,
        quality: Math.max(options.quality - 20, 40), // Reducir calidad pero no menos de 40
        format: 'webp'
      })

      if (lowerQualityResult.buffer.length > MAX_SIZE) {
        throw new Error('No se pudo generar un thumbnail de tamaño aceptable')
      }

      return lowerQualityResult
    }

    return result
  } catch (error) {
    console.error('Error creando thumbnail:', {
      path: imagePath,
      error: error instanceof Error ? error.message : error
    })
    throw error instanceof Error ? error : new Error('Error creando thumbnail')
  }
}
