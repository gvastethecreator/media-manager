import exifr from 'exifr'
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

// Configurar exifr para extraer toda la metadata
const defaultOptions = {
  ifd0: true,
  ifd1: false,
  exif: true,
  gps: true,
  interop: false,
  jfif: true,
  ihdr: true,
  xmp: true,
  iptc: true,
  icc: false,
  makerNote: false,
  userComment: false,
  multiSegment: false,
  skip: [],
  pick: [],
  translateKeys: true,
  translateValues: true,
  reviveValues: true,
  sanitize: true,
  mergeOutput: true,
  silentErrors: true,
  chunked: true,
  firstChunkSize: 65536,
  firstChunkSizeNode: 65536,
  firstChunkSizeBrowser: 65536,
  chunkSize: 65536,
  chunkLimit: 5
}

export function configureExifr() {
  try {
    // En lugar de modificar el objeto options directamente,
    // creamos un nuevo objeto con las opciones por defecto
    const options = { ...defaultOptions }

    // Asignamos las opciones al exifr de manera segura
    Object.assign(exifr, { options })
  } catch (error) {
    console.error('Error configurando exifr:', error)
  }
}

configureExifr()

export interface ImageMetadata {
  // Dimensiones de la imagen
  dimensions?: {
    width: number
    height: number
  }
  // Metadata EXIF básica
  exif?: {
    Make?: string
    Model?: string
    Software?: string
    DateTime?: string
    DateTimeOriginal?: string
    CreateDate?: string
    ModifyDate?: string
    Artist?: string
    Copyright?: string
    ExposureTime?: number
    FNumber?: number
    ISO?: number
    FocalLength?: number
    LensModel?: string
    // Campos adicionales
    Description?: string
    UserComment?: string
    ImageDescription?: string
    Orientation?: number
    XResolution?: number
    YResolution?: number
    ResolutionUnit?: number
    ColorSpace?: number
    ExifVersion?: string
    ComponentsConfiguration?: string
    CompressedBitsPerPixel?: number
    MakerNote?: string
    FlashpixVersion?: string
    PixelXDimension?: number
    PixelYDimension?: number
    FileSource?: string
    SceneType?: string
    CustomRendered?: number
    ExposureMode?: number
    WhiteBalance?: number
    DigitalZoomRatio?: number
    FocalLengthIn35mmFilm?: number
    SceneCaptureType?: number
    GainControl?: number
    Contrast?: number
    Saturation?: number
    Sharpness?: number
    SubjectDistanceRange?: number
    GPSLatitude?: number
    GPSLongitude?: number
    GPSAltitude?: number
    [key: string]: any  // Para otros campos EXIF que podamos encontrar
  }
  // Metadata de generación AI
  generation?: {
    prompt?: string
    negative_prompt?: string
    steps?: number
    sampler?: string
    cfg_scale?: number
    seed?: number
    model?: string
    model_hash?: string
    denoising_strength?: number
    version?: string
    modules?: string[]
    lora_hashes?: string[]
  }
  // Metadata del sistema de archivos
  fileSystem: {
    size: number
    created: string
    modified: string
    accessed: string
  }
}

/**
 * Extrae la metadata de generación AI del texto
 * @param text Texto donde buscar la metadata
 */
function extractGenerationMetadata(text: string) {
  const metadata: ImageMetadata['generation'] = {}

  // Patrones comunes en archivos generados por AI
  const patterns = {
    prompt: /prompt: (.*?)(?=\n|$)/i,
    negative_prompt: /negative prompt: (.*?)(?=\n|$)/i,
    steps: /steps: (\d+)/i,
    sampler: /sampler: (.*?)(?=\n|$)/i,
    cfg_scale: /cfg scale: ([\d.]+)/i,
    seed: /seed: (\d+)/i,
    model: /model: (.*?)(?=\n|$)/i,
    model_hash: /model hash: (.*?)(?=\n|$)/i,
    denoising_strength: /denoising strength: ([\d.]+)/i,
    version: /version: (.*?)(?=\n|$)/i
  }

  // Extraer valores usando los patrones
  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern)
    if (match && match[1]) {
      metadata[key as keyof typeof metadata] = match[1]
    }
  })

  // Extraer módulos y hashes de LoRA si existen
  const modulesMatch = text.match(/modules: (.*?)(?=\n|$)/i)
  if (modulesMatch && modulesMatch[1]) {
    metadata.modules = modulesMatch[1].split(',').map(m => m.trim())
  }

  const loraMatch = text.match(/lora hashes: (.*?)(?=\n|$)/i)
  if (loraMatch && loraMatch[1]) {
    metadata.lora_hashes = loraMatch[1].split(',').map(h => h.trim())
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined
}

/**
 * Extrae toda la metadata disponible de una imagen
 * @param filePath Ruta al archivo de imagen
 */
export async function extractImageMetadata(filePath: string): Promise<ImageMetadata> {
  // Obtener stats del archivo
  const stats = await fs.stat(filePath)
  
  // Metadata básica del sistema de archivos
  const metadata: ImageMetadata = {
    fileSystem: {
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString()
    }
  }

  try {
    // Obtener dimensiones usando sharp
    const imageInfo = await sharp(filePath).metadata()
    if (imageInfo.width && imageInfo.height) {
      metadata.dimensions = {
        width: imageInfo.width,
        height: imageInfo.height
      }
    }

    // Extraer metadata EXIF con todas las opciones habilitadas
    console.log('🔍 Intentando extraer EXIF de:', filePath)
    try {
      // Primero intentamos obtener la metadata con sharp
      const sharpMetadata = await sharp(filePath).metadata()
      console.log('📊 Sharp metadata:', sharpMetadata)

      // Luego intentamos con exifr
      const exifData = await exifr.parse(filePath, {
        // Habilitar todos los segmentos
        tiff: true,
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        ihdr: true,
        // Incluir thumbnails
        mergeOutput: false,
        // Obtener toda la metadata
        pick: ['*'],
        // No sanitizar los valores
        sanitize: false,
        // Mantener los valores originales
        reviveValues: true,
        translateValues: true,
        translateKeys: true
      })

      console.log('📝 EXIF Data raw:', JSON.stringify(exifData, null, 2))

      if (exifData) {
        // Convertir la metadata EXIF a un objeto plano
        const exifObj: Record<string, any> = {}
        
        // Procesar todos los campos encontrados
        const processValue = (key: string, value: any) => {
          if (value === null || value === undefined || typeof value === 'function') {
            return false
          }

          // Convertir Buffers a string
          if (Buffer.isBuffer(value)) {
            const decoded = decodeBuffer(value)
            if (decoded.trim()) {
              exifObj[key] = decoded
              return true
            }
          }
          // Convertir fechas a ISO string
          else if (value instanceof Date) {
            exifObj[key] = value.toISOString()
            return true
          }
          // Para arrays de números (como coordenadas GPS), mantener el array
          else if (Array.isArray(value) && value.every(v => typeof v === 'number')) {
            exifObj[key] = value
            return true
          }
          // Para otros tipos de arrays, convertir a string
          else if (Array.isArray(value)) {
            const str = value.join(', ')
            if (str.trim()) {
              exifObj[key] = str
              return true
            }
          }
          // Para objetos, procesarlos recursivamente
          else if (typeof value === 'object') {
            const subObj: Record<string, any> = {}
            let hasValues = false
            for (const [subKey, subValue] of Object.entries(value)) {
              if (processValue(subKey, subValue)) {
                subObj[subKey] = exifObj[subKey]
                delete exifObj[subKey]
                hasValues = true
              }
            }
            if (hasValues) {
              exifObj[key] = subObj
              return true
            }
          }
          // Mantener otros valores como están si no están vacíos
          else if (value !== '') {
            exifObj[key] = value
            return true
          }

          return false
        }

        // Procesar todos los campos
        for (const [key, value] of Object.entries(exifData)) {
          processValue(key, value)
        }

        console.log('🔧 Metadata procesada:', JSON.stringify(exifObj, null, 2))

        // Combinar metadata de sharp y exifr
        if (Object.keys(exifObj).length > 0) {
          metadata.exif = {
            ...exifObj,
            format: sharpMetadata.format,
            space: sharpMetadata.space,
            channels: sharpMetadata.channels,
            depth: sharpMetadata.depth,
            density: sharpMetadata.density,
            chromaSubsampling: sharpMetadata.chromaSubsampling,
            isProgressive: sharpMetadata.isProgressive,
            hasProfile: sharpMetadata.hasProfile,
            hasAlpha: sharpMetadata.hasAlpha
          }
        }
      }
    } catch (error) {
      console.error('❌ Error extrayendo EXIF:', error)
    }

    // Intentar extraer metadata de generación AI del nombre del archivo
    const fileName = path.basename(filePath)
    const generationMetadata = extractGenerationMetadata(fileName)
    if (generationMetadata) {
      metadata.generation = generationMetadata
    }

    // Si no se encontró en el nombre, intentar extraer de los comentarios EXIF
    if (!metadata.generation && metadata.exif?.Comment) {
      const commentMetadata = extractGenerationMetadata(metadata.exif.Comment)
      if (commentMetadata) {
        metadata.generation = commentMetadata
      }
    }

    // Si no se encontró en los comentarios, intentar extraer de UserComment o ImageDescription
    if (!metadata.generation) {
      const otherComments = [
        metadata.exif?.UserComment,
        metadata.exif?.ImageDescription,
        metadata.exif?.Description
      ].filter(Boolean)

      for (const comment of otherComments) {
        const commentMetadata = extractGenerationMetadata(comment)
        if (commentMetadata) {
          metadata.generation = commentMetadata
          break
        }
      }
    }

  } catch (error) {
    console.error('Error extracting image metadata:', error)
  }

  return metadata
}

/**
 * Decodifica un Buffer a string, intentando varios encodings
 */
const decodeBuffer = (buffer: Buffer): string => {
  // Primero intentamos UTF-16 (común en EXIF)
  if (buffer.length >= 8 && buffer.slice(0, 8).toString() === 'UNICODE\0') {
    return buffer.slice(8).toString('utf16le').replace(/\0/g, '');
  }
  
  // Si no es UTF-16, intentamos varios encodings comunes
  const encodings = ['utf8', 'utf16le', 'ascii'];
  for (const encoding of encodings) {
    try {
      const decoded = buffer.toString(encoding as BufferEncoding).trim();
      // Si la decodificación produce texto legible, lo usamos
      if (decoded && !/[\x00-\x08\x0E-\x1F\x7F]/.test(decoded)) {
        return decoded;
      }
    } catch (e) {
      continue;
    }
  }
  
  // Si todo falla, usamos UTF-8 por defecto
  return buffer.toString('utf8').replace(/\0/g, '');
}
