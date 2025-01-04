import exifr from 'exifr'
import { statSync } from 'fs'
import sharp from 'sharp'
import { metadataCache } from './cache'

// Configuración optimizada de exifr
const exifrOptions = {
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
}

export interface ImageMetadata {
  fileSystem?: {
    size?: number
    created?: string
    modified?: string
    accessed?: string
  }
  dimensions?: {
    width?: number
    height?: number
    aspectRatio?: number
    orientation?: number
  }
  format?: string
  colorSpace?: string
  hasAlpha?: boolean
  isAnimated?: boolean
  exif?: Record<string, any>
  generation?: {
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
    [key: string]: any
  }
}

// Patrones de generación mejorados
const GENERATION_PATTERNS = {
  // Automatic1111
  a1111: {
    pattern: /^(.*?)(?:\s+Steps: (\d+).*?Sampler: (.*?).*?CFG scale: ([\d.]+).*?Seed: (\d+).*?Size: (\d+x\d+).*?Model hash: (\w+).*?Model: (.*?)(?:\n|$))/s,
    extract: (match: RegExpMatchArray) => ({
      generationTool: 'Automatic1111',
      prompt: match[1]?.trim(),
      steps: parseInt(match[2]),
      sampler: match[3]?.trim(),
      cfgScale: parseFloat(match[4]),
      seed: parseInt(match[5]),
      size: match[6]?.trim(),
      modelHash: match[7]?.trim(),
      modelName: match[8]?.trim(),
    })
  },
  // ComfyUI
  comfy: {
    pattern: /^(.*?)(?:\s+workflow: ComfyUI.*?seed: (\d+).*?steps: (\d+).*?cfg: ([\d.]+).*?sampler: (.*?)(?:\n|$))/s,
    extract: (match: RegExpMatchArray) => ({
      generationTool: 'ComfyUI',
      prompt: match[1]?.trim(),
      seed: parseInt(match[2]),
      steps: parseInt(match[3]),
      cfgScale: parseFloat(match[4]),
      sampler: match[5]?.trim(),
    })
  },
  // InvokeAI
  invoke: {
    pattern: /^(.*?)(?:\s+\[.*?\].*?Steps: (\d+).*?Sampler: (.*?).*?CFG: ([\d.]+).*?Seed: (\d+)(?:\n|$))/s,
    extract: (match: RegExpMatchArray) => ({
      generationTool: 'InvokeAI',
      prompt: match[1]?.trim(),
      steps: parseInt(match[2]),
      sampler: match[3]?.trim(),
      cfgScale: parseFloat(match[4]),
      seed: parseInt(match[5]),
    })
  },
  // NovelAI
  novelai: {
    pattern: /^(.*?)(?:\s+Steps: (\d+), Scale: ([\d.]+).*?Seed: (\d+).*?Model: (.*?)(?:\n|$))/s,
    extract: (match: RegExpMatchArray) => ({
      generationTool: 'NovelAI',
      prompt: match[1]?.trim(),
      steps: parseInt(match[2]),
      cfgScale: parseFloat(match[3]),
      seed: parseInt(match[4]),
      modelName: match[5]?.trim(),
    })
  }
}

export async function extractGenerationInfo(text: string): Promise<Record<string, any>> {
  try {
    for (const [tool, { pattern, extract }] of Object.entries(GENERATION_PATTERNS)) {
      const match = text.match(pattern)
      if (match) {
        const info = extract(match)
        return Object.fromEntries(
          Object.entries(info).filter(([_, v]) => v != null)
        )
      }
    }
    return {}
  } catch (error) {
    console.error('Error extracting generation info:', error)
    return {}
  }
}

export async function getImageMetadata(filePath: string): Promise<ImageMetadata> {
  try {
    // Intentar obtener de caché primero
    const cached = await metadataCache.get(filePath)
    if (cached) {
      return cached
    }

    const metadata: ImageMetadata = {}

    // Obtener información del sistema de archivos
    const stats = statSync(filePath)
    metadata.fileSystem = {
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
    }

    // Obtener dimensiones y formato con sharp
    const imageInfo = await sharp(filePath, { failOn: 'none' }).metadata()
    metadata.dimensions = {
      width: imageInfo.width,
      height: imageInfo.height,
      aspectRatio: imageInfo.width && imageInfo.height ? imageInfo.width / imageInfo.height : undefined,
      orientation: imageInfo.orientation,
    }
    metadata.format = imageInfo.format
    metadata.colorSpace = imageInfo.space
    metadata.hasAlpha = imageInfo.hasAlpha
    metadata.isAnimated = imageInfo.pages ? imageInfo.pages > 1 : false

    try {
      // Intentar extraer metadata EXIF
      const exifData = await exifr.parse(filePath, exifrOptions)
      if (exifData) {
        metadata.exif = exifData

        // Si hay un campo de descripción o comentario, intentar extraer info de generación
        const description = exifData.Description || exifData.Comment || exifData.UserComment
        if (description) {
          const generationInfo = await extractGenerationInfo(description)
          if (Object.keys(generationInfo).length > 0) {
            metadata.generation = generationInfo
          }
        }
      }
    } catch (error) {
      console.error('Error extracting EXIF:', error)
    }

    // Guardar en caché
    await metadataCache.set(filePath, metadata)

    return metadata
  } catch (error) {
    console.error('Error getting image metadata:', error)
    return {}
  }
}
