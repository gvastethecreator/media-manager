import sharp from 'sharp'
import { ThumbnailQuality, THUMBNAIL_QUALITY_CONFIG } from '@/types/thumbnails'
import { existsSync } from 'fs'
import { extname, join } from 'path'
import { logger } from '@/lib/logger'
import { formatFileSize } from './format'
import type { ImageFormat } from './image'
import { promises as fs } from 'fs'
import { createHash } from 'crypto'

const thumbLogger = logger.withContext('Thumbnail')

// Configuración de caché
const CACHE_DIR = '.thumbnail-cache'

export interface ThumbnailOptions {
  quality: ThumbnailQuality
  format?: ImageFormat
  preserveMetadata?: boolean
  background?: string
  progressive?: boolean
}

export interface ThumbnailResult {
  buffer: Buffer
  width: number
  height: number
  format: ImageFormat
  size: number
  originalSize?: number
}

const SUPPORTED_FORMATS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'])

const DEFAULT_OPTIONS: Partial<ThumbnailOptions> = {
  quality: ThumbnailQuality.MEDIUM,
  format: 'webp',
  preserveMetadata: false,
  progressive: true
}

const MAX_DIMENSION = 2048 // Máxima dimensión permitida
const MIN_DIMENSION = 16 // Mínima dimensión permitida

// Funciones de caché
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (error) {
    thumbLogger.error('Error creando directorio de caché:', error)
  }
}

function getCacheKey(filePath: string, options: any): string {
  const hash = createHash('md5')
  hash.update(filePath + JSON.stringify(options))
  return hash.digest('hex')
}

function getCachePath(cacheKey: string): string {
  return join(CACHE_DIR, `${cacheKey}.webp`)
}

async function getFromCache(cacheKey: string): Promise<ThumbnailResult | null> {
  const cachePath = getCachePath(cacheKey)
  try {
    const stats = await fs.stat(cachePath)
    if (stats.isFile()) {
      const buffer = await fs.readFile(cachePath)
      const { info } = await sharp(buffer).toBuffer({ resolveWithObject: true })
      return {
        buffer,
        width: info.width!,
        height: info.height!,
        format: 'webp',
        size: buffer.length
      }
    }
  } catch (error) {
    return null
  }
  return null
}

async function saveToCache(cacheKey: string, buffer: Buffer): Promise<void> {
  const cachePath = getCachePath(cacheKey)
  try {
    await fs.writeFile(cachePath, buffer)
  } catch (error) {
    thumbLogger.error('Error guardando en caché:', error)
  }
}

/**
 * Valida y ajusta las dimensiones para el thumbnail
 */
function validateDimensions(width: number, height: number): { width: number; height: number } {
  const aspectRatio = width / height

  if (width > MAX_DIMENSION) {
    width = MAX_DIMENSION
    height = Math.round(width / aspectRatio)
  }

  if (height > MAX_DIMENSION) {
    height = MAX_DIMENSION
    width = Math.round(height * aspectRatio)
  }

  if (width < MIN_DIMENSION) width = MIN_DIMENSION
  if (height < MIN_DIMENSION) height = MIN_DIMENSION

  return { width, height }
}

/**
 * Genera un thumbnail optimizado de una imagen
 * @param filePath Ruta del archivo de imagen
 * @param options Opciones de generación
 * @returns Resultado con el buffer y dimensiones
 */
export async function generateThumbnail(
  filePath: string,
  options: Partial<ThumbnailOptions> = {}
): Promise<ThumbnailResult> {
  try {
    // Validar archivo
    if (!existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`)
    }

    const ext = extname(filePath).toLowerCase()
    if (!SUPPORTED_FORMATS.has(ext)) {
      throw new Error(`Formato no soportado: ${ext}`)
    }

    // Combinar opciones
    const finalOptions = { ...DEFAULT_OPTIONS, ...options }
    const config = THUMBNAIL_QUALITY_CONFIG[finalOptions.quality as ThumbnailQuality]
    if (!config) {
      throw new Error(`Calidad inválida: ${finalOptions.quality}`)
    }

    // Verificar caché
    await ensureCacheDir()
    const cacheKey = getCacheKey(filePath, finalOptions)
    const cached = await getFromCache(cacheKey)
    if (cached) {
      thumbLogger.debug('Thumbnail recuperado de caché:', {
        path: filePath,
        dimensions: `${cached.width}x${cached.height}`,
        size: formatFileSize(cached.size)
      })
      return cached
    }

    thumbLogger.debug('Generando thumbnail:', {
      path: filePath,
      options: finalOptions,
      config
    })

    // Inicializar sharp
    const image = sharp(filePath, {
      failOn: 'none',
      animated: true, // Preservar animaciones
      limitInputPixels: Math.pow(MAX_DIMENSION, 2) // Limitar tamaño máximo
    })

    // Obtener metadata
    const metadata = await image.metadata()
    if (!metadata.width || !metadata.height) {
      throw new Error('No se pudieron obtener las dimensiones de la imagen')
    }

    // Calcular dimensiones
    const aspectRatio = metadata.width / metadata.height
    let width = config.width
    let height = config.height

    if (aspectRatio > 1) {
      // Imagen horizontal
      height = Math.round(width / aspectRatio)
    } else {
      // Imagen vertical o cuadrada
      width = Math.round(height * aspectRatio)
    }

    // Validar dimensiones finales
    const validDimensions = validateDimensions(width, height)

    // Configurar el pipeline de procesamiento
    let processor = image.resize(validDimensions.width, validDimensions.height, {
      fit: 'inside',
      withoutEnlargement: true,
      background: finalOptions.background
    })

    if (finalOptions.preserveMetadata) {
      processor = processor.withMetadata()
    }

    // Aplicar formato y optimizaciones
    const format = finalOptions.format || 'webp'
    switch (format) {
      case 'webp':
        processor = processor.webp({
          quality: config.quality,
          effort: 4,
          nearLossless: config.quality >= 90,
          smartSubsample: true
        })
        break
      case 'jpeg':
        processor = processor.jpeg({
          quality: config.quality,
          progressive: finalOptions.progressive,
          optimizeCoding: true,
          trellisQuantisation: true
        })
        break
      case 'png':
        processor = processor.png({
          quality: config.quality,
          progressive: finalOptions.progressive,
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        break
      default:
        processor = processor.webp({
          quality: config.quality,
          effort: 4
        })
    }

    // Generar buffer
    const buffer = await processor.toBuffer()
    if (!buffer || buffer.length === 0) {
      throw new Error('Error generando buffer del thumbnail')
    }

    const result: ThumbnailResult = {
      buffer,
      width: validDimensions.width,
      height: validDimensions.height,
      format,
      size: buffer.length,
      originalSize: metadata.size
    }

    // Guardar en caché
    await saveToCache(cacheKey, buffer)

    thumbLogger.debug('Thumbnail generado:', {
      path: filePath,
      dimensions: `${result.width}x${result.height}`,
      originalSize: formatFileSize(metadata.size || 0),
      newSize: formatFileSize(result.size),
      reduction: metadata.size ? `${((1 - result.size / metadata.size) * 100).toFixed(1)}%` : 'N/A'
    })

    return result
  } catch (error) {
    thumbLogger.error('Error generando thumbnail:', {
      path: filePath,
      error: error instanceof Error ? error.message : error
    })
    throw error instanceof Error ? error : new Error('Error generando thumbnail')
  }
}

// Función para limpiar la caché
export async function clearThumbnailCache(): Promise<void> {
  try {
    const files = await fs.readdir(CACHE_DIR)
    await Promise.all(
      files.map(file => fs.unlink(join(CACHE_DIR, file)))
    )
    thumbLogger.info('Caché de thumbnails limpiada')
  } catch (error) {
    thumbLogger.error('Error limpiando caché:', error)
    throw error
  }
}