import sharp from 'sharp'
import { existsSync } from 'fs'
import { ThumbnailQuality, THUMBNAIL_QUALITY_CONFIG } from '@/services/thumbnail.service'

export interface ImageMetadata {
  width: number
  height: number
  format: string | null
  size: number | null
}

export async function getImageMetadata(imagePath: string): Promise<ImageMetadata> {
  try {
    if (!existsSync(imagePath)) {
      throw new Error('Archivo no encontrado')
    }

    const metadata = await sharp(imagePath).metadata()

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || null,
      size: metadata.size || null
    }
  } catch (error) {
    console.error('Error obteniendo metadata:', error)
    throw new Error('Error al obtener metadata de la imagen')
  }
}

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

    const metadata = await getImageMetadata(imagePath)
    let processor = sharp(imagePath)

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
      width: metadata.width,
      height: metadata.height
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
    return await processImage(imagePath, {
      ...options,
      format: 'webp' // Forzar WebP para thumbnails
    })
  } catch (error) {
    console.error('Error creando thumbnail:', error)
    throw error instanceof Error ? error : new Error('Error creando thumbnail')
  }
}

export async function generateThumbnail(
  imagePath: string,
  quality: ThumbnailQuality = 'mid'
): Promise<ProcessImageResult> {
  try {
    if (!imagePath) {
      throw new Error('Path de imagen requerido')
    }

    const config = THUMBNAIL_QUALITY_CONFIG[quality]
    if (!config) {
      throw new Error(`Calidad inválida: ${quality}`)
    }

    const result = await processImage(imagePath, {
      width: config.width,
      height: config.height,
      quality: config.quality,
      format: 'webp'
    })

    if (!result || !result.buffer) {
      throw new Error('Error generando thumbnail')
    }

    return result
  } catch (error) {
    console.error('Error generando thumbnail:', {
      path: imagePath,
      quality,
      error: error instanceof Error ? error.message : error
    })
    throw error instanceof Error ? error : new Error('Error generando thumbnail')
  }
}
