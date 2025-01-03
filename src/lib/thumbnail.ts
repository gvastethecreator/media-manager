import sharp from 'sharp'
import { ThumbnailQuality, THUMBNAIL_QUALITY_CONFIG } from '@/services/thumbnail.service'
import { existsSync } from 'fs'
import { extname } from 'path'

interface ThumbnailResult {
  buffer: Buffer
  width: number
  height: number
}

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

export async function generateThumbnail(
  filePath: string,
  quality: ThumbnailQuality = 'mid'
): Promise<ThumbnailResult> {
  try {
    if (!existsSync(filePath)) {
      throw new Error('Archivo no encontrado')
    }

    const ext = extname(filePath).toLowerCase()
    if (!SUPPORTED_FORMATS.includes(ext)) {
      throw new Error('Formato de archivo no soportado')
    }

    const config = THUMBNAIL_QUALITY_CONFIG[quality]
    if (!config) {
      throw new Error('Calidad de thumbnail inválida')
    }

    // Procesar la imagen con sharp
    const image = sharp(filePath)
    const metadata = await image.metadata()

    // Calcular dimensiones manteniendo el aspect ratio
    const aspectRatio = metadata.width! / metadata.height!
    let width = config.width
    let height = config.height

    if (aspectRatio > 1) {
      // Imagen horizontal
      height = Math.round(width / aspectRatio)
    } else {
      // Imagen vertical o cuadrada
      width = Math.round(height * aspectRatio)
    }

    // Generar el thumbnail
    const buffer = await image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: config.quality,
        effort: 4, // Balance entre velocidad y calidad
        nearLossless: true
      })
      .toBuffer()

    return {
      buffer,
      width,
      height
    }
  } catch (error) {
    console.error('Error generando thumbnail:', error)
    throw error
  }
}