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
}

interface ProcessImageResult {
  data: string
  size: number
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

    const imageBuffer = await sharp(imagePath)
      .resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: options.quality })
      .toBuffer()

    return {
      data: imageBuffer.toString('base64'),
      size: imageBuffer.length,
      width: metadata.width,
      height: metadata.height
    }
  } catch (error) {
    console.error('Error procesando imagen:', error)
    throw new Error(error instanceof Error ? error.message : 'Error procesando imagen')
  }
}

export async function createThumbnail(
  imagePath: string,
  options: ProcessImageOptions
): Promise<ProcessImageResult> {
  return processImage(imagePath, options)
}

export async function generateThumbnail(
  imagePath: string,
  quality: ThumbnailQuality = 'mid'
): Promise<ProcessImageResult | null> {
  try {
    const config = THUMBNAIL_QUALITY_CONFIG[quality]
    return await processImage(imagePath, {
      width: config.width,
      height: config.height,
      quality: config.quality
    })
  } catch (error) {
    console.error('Error generando thumbnail:', error)
    return null
  }
}
