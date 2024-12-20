import exifr from 'exifr'
import { statSync } from 'fs'
import sharp from 'sharp'

// Configuración de exifr para extraer todos los datos relevantes
const exifrOptions = {
  // Opciones básicas
  translateKeys: true,
  translateValues: true,
  reviveValues: true,
  // Segmentos a extraer
  tiff: true,
  xmp: true,
  icc: false,
  iptc: true,
  jfif: true,
  ihdr: true,
  // Tipos de archivos soportados
  multiSegment: true,
  skip: [],
  // Opciones de rendimiento
  chunked: true,
  firstChunkSize: 512 * 1024,
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
  }
  format?: string
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

export async function extractGenerationInfo(text: string): Promise<Record<string, any>> {
  try {
    // Expresiones regulares para diferentes formatos
    const patterns = {
      // Automatic1111
      a1111: /^(.*?)(?:\s+Steps: (\d+).*?Sampler: (.*?).*?CFG scale: ([\d.]+).*?Seed: (\d+).*?Size: (\d+x\d+).*?Model hash: (\w+).*?Model: (.*?)(?:\n|$))/s,
      // ComfyUI
      comfy: /^(.*?)(?:\s+workflow: ComfyUI.*?seed: (\d+).*?steps: (\d+).*?cfg: ([\d.]+).*?sampler: (.*?)(?:\n|$))/s,
      // InvokeAI
      invoke: /^(.*?)(?:\s+\[.*?\].*?Steps: (\d+).*?Sampler: (.*?).*?CFG: ([\d.]+).*?Seed: (\d+)(?:\n|$))/s,
    }

    let info: Record<string, any> = {}

    // Probar cada patrón
    for (const [tool, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern)
      if (match) {
        switch (tool) {
          case 'a1111':
            info = {
              generationTool: 'Automatic1111',
              prompt: match[1]?.trim(),
              steps: parseInt(match[2]),
              sampler: match[3]?.trim(),
              cfgScale: parseFloat(match[4]),
              seed: parseInt(match[5]),
              size: match[6]?.trim(),
              modelHash: match[7]?.trim(),
              modelName: match[8]?.trim(),
            }
            break
          case 'comfy':
            info = {
              generationTool: 'ComfyUI',
              prompt: match[1]?.trim(),
              seed: parseInt(match[2]),
              steps: parseInt(match[3]),
              cfgScale: parseFloat(match[4]),
              sampler: match[5]?.trim(),
            }
            break
          case 'invoke':
            info = {
              generationTool: 'InvokeAI',
              prompt: match[1]?.trim(),
              steps: parseInt(match[2]),
              sampler: match[3]?.trim(),
              cfgScale: parseFloat(match[4]),
              seed: parseInt(match[5]),
            }
            break
        }
        break // Si encontramos un match, salimos del loop
      }
    }

    // Limpiar valores undefined o null
    return Object.fromEntries(
      Object.entries(info).filter(([_, v]) => v != null)
    )
  } catch (error) {
    console.error('Error extracting generation info:', error)
    return {}
  }
}

export async function getImageMetadata(filePath: string): Promise<ImageMetadata> {
  try {
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
    const imageInfo = await sharp(filePath).metadata()
    metadata.dimensions = {
      width: imageInfo.width,
      height: imageInfo.height,
    }
    metadata.format = imageInfo.format

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

    return metadata
  } catch (error) {
    console.error('Error getting image metadata:', error)
    return {}
  }
}
