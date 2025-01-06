import exifr from 'exifr'
import { statSync } from 'fs'
import sharp from 'sharp'
import { metadataCache } from './cache'
import { metadataLogger as logger } from './utils'

// Configuración optimizada de exifr
const EXIFR_OPTIONS = {
  // Opciones básicas
  translateKeys: true,
  translateValues: true,
  reviveValues: true,
  // Segmentos a extraer (optimizados)
  tiff: true,
  xmp: true,
  icc: false,
  iptc: true,
  jfif: true,
  ihdr: true,
  // Tipos de archivos soportados
  multiSegment: true,
  skip: ['mkv', 'webm', 'mp4', 'mov'],
  // Opciones de rendimiento
  chunked: true,
  firstChunkSize: 256 * 1024, // Reducido para mejor rendimiento
  // Opciones de depuración
  silentErrors: true,
  sanitize: true,
} as const

export interface FileSystemMetadata {
  size: number
  created: string
  modified: string
  accessed: string
}

export interface ImageDimensions {
  width: number
  height: number
  aspectRatio: number
  orientation?: number
}

export interface GenerationMetadata {
  model?: string
  prompt?: string
  negativePrompt?: string
  steps?: number
  sampler?: string
  cfgScale?: number
  seed?: number
  size?: string
  modelHash?: string
  modelName?: string
  generationTool?: string
  // Campos específicos de diferentes herramientas
  [key: string]: unknown
}

export interface ImageMetadata {
  fileSystem?: FileSystemMetadata
  dimensions?: ImageDimensions
  format?: string
  colorSpace?: string
  hasAlpha?: boolean
  isAnimated?: boolean
  exif?: Record<string, unknown>
  generation?: GenerationMetadata
  error?: string // Campo para errores no fatales
}

// Patrones de generación mejorados y tipados
interface GenerationPattern {
  pattern: RegExp
  extract: (match: RegExpMatchArray) => GenerationMetadata
}

const GENERATION_PATTERNS: Record<string, GenerationPattern> = {
  // Automatic1111
  a1111: {
    pattern: /^(.*?)(?:\s+Steps: (\d+).*?Sampler: (.*?).*?CFG scale: ([\d.]+).*?Seed: (\d+).*?Size: (\d+x\d+).*?Model hash: (\w+).*?Model: (.*?)(?:\n|$))/s,
    extract: (match: RegExpMatchArray): GenerationMetadata => ({
      generationTool: 'Automatic1111',
      prompt: match[1]?.trim(),
      steps: Number(match[2]),
      sampler: match[3]?.trim(),
      cfgScale: Number(match[4]),
      seed: Number(match[5]),
      size: match[6]?.trim(),
      modelHash: match[7]?.trim(),
      modelName: match[8]?.trim(),
    })
  },
  // ComfyUI
  comfy: {
    pattern: /^(.*?)(?:\s+workflow: ComfyUI.*?seed: (\d+).*?steps: (\d+).*?cfg: ([\d.]+).*?sampler: (.*?)(?:\n|$))/s,
    extract: (match: RegExpMatchArray): GenerationMetadata => ({
      generationTool: 'ComfyUI',
      prompt: match[1]?.trim(),
      seed: Number(match[2]),
      steps: Number(match[3]),
      cfgScale: Number(match[4]),
      sampler: match[5]?.trim(),
    })
  },
  // InvokeAI
  invoke: {
    pattern: /^(.*?)(?:\s+\[.*?\].*?Steps: (\d+).*?Sampler: (.*?).*?CFG: ([\d.]+).*?Seed: (\d+)(?:\n|$))/s,
    extract: (match: RegExpMatchArray): GenerationMetadata => ({
      generationTool: 'InvokeAI',
      prompt: match[1]?.trim(),
      steps: Number(match[2]),
      sampler: match[3]?.trim(),
      cfgScale: Number(match[4]),
      seed: Number(match[5]),
    })
  },
  // NovelAI
  novelai: {
    pattern: /^(.*?)(?:\s+Steps: (\d+), Scale: ([\d.]+).*?Seed: (\d+).*?Model: (.*?)(?:\n|$))/s,
    extract: (match: RegExpMatchArray): GenerationMetadata => ({
      generationTool: 'NovelAI',
      prompt: match[1]?.trim(),
      steps: Number(match[2]),
      cfgScale: Number(match[3]),
      seed: Number(match[4]),
      modelName: match[5]?.trim(),
    })
  }
} as const

/**
 * Extrae información de generación de IA del texto proporcionado
 * @param text Texto que contiene la información de generación
 * @returns Objeto con la información extraída
 */
export async function extractGenerationInfo(text: string): Promise<GenerationMetadata> {
  if (!text) return {}

  try {
    for (const [tool, { pattern, extract }] of Object.entries(GENERATION_PATTERNS)) {
      const match = text.match(pattern)
      if (match) {
        const info = extract(match)
        // Filtrar valores nulos o undefined
        return Object.fromEntries(
          Object.entries(info).filter(([_, v]) => v != null)
        ) as GenerationMetadata
      }
    }
    return {}
  } catch (error) {
    logger.error('Error extracting generation info:', { error, text })
    return {}
  }
}

/**
 * Obtiene los metadatos del sistema de archivos
 * @param filePath Ruta del archivo
 * @returns Objeto con los metadatos del sistema de archivos
 */
async function getFileSystemMetadata(filePath: string): Promise<FileSystemMetadata> {
  try {
    const stats = statSync(filePath)
    return {
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
    }
  } catch (error) {
    logger.error('Error getting filesystem metadata:', { error, filePath })
    throw error
  }
}

/**
 * Obtiene las dimensiones y formato de la imagen usando sharp
 * @param filePath Ruta del archivo de imagen
 * @returns Objeto con dimensiones y formato
 */
async function getImageInfo(filePath: string): Promise<Pick<ImageMetadata, 'dimensions' | 'format' | 'colorSpace' | 'hasAlpha' | 'isAnimated'>> {
  try {
    const imageInfo = await sharp(filePath, { failOn: 'none' }).metadata()

    return {
      dimensions: imageInfo.width && imageInfo.height ? {
        width: imageInfo.width,
        height: imageInfo.height,
        aspectRatio: imageInfo.width / imageInfo.height,
        orientation: imageInfo.orientation,
      } : undefined,
      format: imageInfo.format,
      colorSpace: imageInfo.space,
      hasAlpha: imageInfo.hasAlpha,
      isAnimated: imageInfo.pages ? imageInfo.pages > 1 : false
    }
  } catch (error) {
    logger.error('Error getting image info:', { error, filePath })
    throw error
  }
}

/**
 * Obtiene los metadatos EXIF de la imagen
 * @param filePath Ruta del archivo de imagen
 * @returns Objeto con los metadatos EXIF y de generación
 */
async function getExifMetadata(filePath: string): Promise<Pick<ImageMetadata, 'exif' | 'generation'>> {
  try {
    const exifData = await exifr.parse(filePath, EXIFR_OPTIONS)
    if (!exifData) return {}

    const metadata: Pick<ImageMetadata, 'exif' | 'generation'> = {
      exif: exifData as Record<string, unknown>
    }

    // Extraer información de generación si está disponible
    const description = exifData.Description || exifData.Comment || exifData.UserComment
    if (typeof description === 'string') {
      const generationInfo = await extractGenerationInfo(description)
      if (Object.keys(generationInfo).length > 0) {
        metadata.generation = generationInfo
      }
    }

    return metadata
  } catch (error) {
    logger.error('Error extracting EXIF:', { error, filePath })
    return {}
  }
}

/**
 * Obtiene los metadatos completos de una imagen
 * @param filePath Ruta del archivo de imagen
 * @returns Objeto con todos los metadatos
 */
export async function getImageMetadata(filePath: string): Promise<ImageMetadata> {
  try {
    // Intentar obtener de caché primero
    const cached = await metadataCache.get(filePath)
    if (cached) {
      return cached
    }

    // Obtener metadatos en paralelo
    const [fileSystem, imageInfo, exifData] = await Promise.all([
      getFileSystemMetadata(filePath),
      getImageInfo(filePath),
      getExifMetadata(filePath)
    ])

    const metadata: ImageMetadata = {
      fileSystem,
      ...imageInfo,
      ...exifData
    }

    // Guardar en caché
    await metadataCache.set(filePath, metadata)

    return metadata
  } catch (error) {
    logger.error('Error getting image metadata:', { error, filePath })
    return {
      error: error instanceof Error ? error.message : 'Unknown error getting metadata'
    }
  }
}
