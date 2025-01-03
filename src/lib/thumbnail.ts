import { createThumbnail } from './image'
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
  imagePath: string,
  quality: ThumbnailQuality = 'mid'
): Promise<ThumbnailResult | null> {
  try {
    // Validar path
    if (!imagePath) {
      throw new Error('Path de imagen requerido')
    }

    // Validar que el archivo existe
    if (!existsSync(imagePath)) {
      throw new Error(`Archivo no encontrado: ${imagePath}`)
    }

    // Validar formato
    const ext = extname(imagePath).toLowerCase()
    if (!SUPPORTED_FORMATS.includes(ext)) {
      throw new Error(`Formato no soportado: ${ext}`)
    }

    console.log('🎯 Generando thumbnail:', {
      path: imagePath,
      quality
    })

    // Validar configuración
    const config = THUMBNAIL_QUALITY_CONFIG[quality]
    if (!config) {
      throw new Error(`Calidad inválida: ${quality}`)
    }

    // Intentar generar el thumbnail con reintentos
    let attempts = 0
    const maxAttempts = 3
    let lastError: Error | null = null

    while (attempts < maxAttempts) {
      try {
        const result = await createThumbnail(imagePath, {
          width: config.width,
          height: config.height,
          quality: config.quality,
          format: 'webp' // Forzar formato WebP para mejor compresión
        })

        if (!result || !result.buffer) {
          throw new Error('No se pudo generar el thumbnail')
        }

        console.log('✅ Thumbnail generado:', {
          path: imagePath,
          size: result.buffer.length,
          quality,
          attempt: attempts + 1
        })

        return {
          buffer: result.buffer,
          width: config.width,
          height: config.height
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido')
        attempts++

        if (attempts < maxAttempts) {
          console.log(`Reintentando generación (${attempts}/${maxAttempts})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }
    }

    throw lastError || new Error('No se pudo generar el thumbnail después de varios intentos')
  } catch (error) {
    console.error('❌ Error generando thumbnail:', {
      path: imagePath,
      quality,
      error: error instanceof Error ? error.message : error
    })
    throw error
  }
}