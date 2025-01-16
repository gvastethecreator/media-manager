'use server';

import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import type { FileMetadata, AIMetadata } from '@/types/metadata';
import ExifReader from 'exifreader';
import { statSync } from 'fs';
import sharp from 'sharp';

const metadataLogger = logger.withContext('MetadataService');

// Configuración de retry
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 1000,
  backoffFactor: 2,
  jitter: true
};

// Configuraciones específicas
const METADATA_RETRY_CONFIG: RetryConfig = {
  ...DEFAULT_RETRY_CONFIG,
  maxAttempts: 5,
  maxDelay: 2000,
  backoffFactor: 1.5
};

// Clase personalizada para errores de metadata
class MetadataError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'MetadataError';
  }
}

// Tipos auxiliares para ExifReader
interface ExifTag {
  id: number;
  value: any;
  description?: string;
}

interface GPSTag extends ExifTag {
  value: [number, number][];
}

interface TypedGPSTag {
  value: [[number, number], [number, number], [number, number]];
  description?: string;
}

// Constantes para PNG
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const TEXT_CHUNK = 'tEXt';
const ITXT_CHUNK = 'iTXt';
const ZTXT_CHUNK = 'zTXt';

interface PNGChunk {
  length: number;
  type: string;
  data: Buffer;
  crc: number;
}

class MetadataService {
  private cache: CacheManager<FileMetadata>;
  private logger = metadataLogger;

  constructor() {
    this.cache = new CacheManager<FileMetadata>({
      name: 'metadata',
      ttl: 5 * 60 * 1000, // 5 minutos
      maxSize: 1000,
      updateAgeOnGet: true,
      allowStale: true
    });
  }

  private calculateDelay(baseDelay: number, attempt: number, config: RetryConfig): number {
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelay
    );

    if (!config.jitter) {
      return exponentialDelay;
    }

    // Aplicar jitter: random entre 0.5x y 1.5x del delay calculado
    const min = exponentialDelay * 0.5;
    const max = exponentialDelay * 1.5;
    return Math.floor(min + Math.random() * (max - min));
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    context: { path: string; operation: string }
  ): Promise<T> {
    let lastError: Error | null = null;
    let baseDelay = config.initialDelay;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      const startTime = Date.now();

      try {
        const result = await operation();

        if (attempt > 1) {
          this.logger.info(`Operación exitosa después de ${attempt} intentos:`, {
            path: context.path,
            operation: context.operation,
            totalTime: Date.now() - startTime
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const delay = this.calculateDelay(baseDelay, attempt, config);

        if (attempt === config.maxAttempts) {
          this.logger.error(`Máximo de intentos alcanzado para ${context.operation}:`, {
            path: context.path,
            attempts: attempt,
            totalTime: Date.now() - startTime,
            error: lastError.message,
            stack: lastError.stack
          });
          throw lastError;
        }

        this.logger.warn(`Reintentando ${context.operation} (intento ${attempt}/${config.maxAttempts}):`, {
          path: context.path,
          delay,
          attempt,
          error: lastError.message,
          nextAttemptIn: delay
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private async readPNGChunks(buffer: Buffer): Promise<PNGChunk[]> {
    const chunks: PNGChunk[] = [];
    let offset = 0;

    // Verificar firma PNG
    if (!buffer.slice(0, 8).equals(PNG_SIGNATURE)) {
      throw new Error('No es un archivo PNG válido');
    }
    offset += 8;

    while (offset < buffer.length) {
      // Leer chunk
      const length = buffer.readUInt32BE(offset);
      offset += 4;

      const type = buffer.slice(offset, offset + 4).toString('ascii');
      offset += 4;

      const data = buffer.slice(offset, offset + length);
      offset += length;

      const crc = buffer.readUInt32BE(offset);
      offset += 4;

      chunks.push({ length, type, data, crc });
    }

    return chunks;
  }

  private parseTextChunk(data: Buffer): { keyword: string, text: string } {
    const nullIndex = data.indexOf(0);
    const keyword = data.slice(0, nullIndex).toString('ascii');
    const text = data.slice(nullIndex + 1).toString('utf8');
    return { keyword, text };
  }

  private async extractPNGMetadata(path: string): Promise<any> {
    try {
      const buffer = await sharp(path).toBuffer();
      const chunks = await this.readPNGChunks(buffer);

      const metadata: Record<string, any> = {};

      // Buscar chunks de texto
      for (const chunk of chunks) {
        if (chunk.type === TEXT_CHUNK) {
          const { keyword, text } = this.parseTextChunk(chunk.data);
          metadata[keyword] = text;

          this.logger.debug('Chunk PNG encontrado:', {
            type: chunk.type,
            keyword,
            textLength: text.length,
            textPreview: text.substring(0, 100)
          });
        }
      }

      return metadata;
    } catch (error) {
      this.logger.error('Error extrayendo metadata PNG:', {
        path,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async extractMetadata(path: string): Promise<FileMetadata> {
    return this.withRetry(
      async () => {
        try {
          // Intentar obtener del caché primero
          const cached = await this.cache.get(path);
          if (cached) {
            this.logger.debug('🎯 Cache hit para metadatos:', { path });
            return cached;
          }

          this.logger.debug('🔍 Cache miss para metadatos:', { path });

          // Extraer metadata básica del sistema de archivos
          const fileSystem = await this.getFileSystemMetadata(path);

          // Leer el buffer de la imagen
          const buffer = await sharp(path).toBuffer();

          // Obtener metadata básica con sharp
          const basicMetadata = await this.extractBasicMetadata(buffer);

          // Construir objeto base de metadata
          const metadata: FileMetadata = {
            ...basicMetadata,
            fileSystem
          };

          // Extraer metadata EXIF/XMP/IPTC usando ExifReader
          try {
            const tags = await ExifReader.load(buffer);
            const exifMetadata = await this.extractExifMetadata(tags);
            Object.assign(metadata, exifMetadata);

            // Extraer metadata de AI si existe
            const aiMetadata = await this.extractAIMetadata(tags);
            if (aiMetadata) {
              metadata.generation = aiMetadata;
            }

            this.logger.debug('Metadata extraída:', {
              path,
              hasExif: !!metadata.exif,
              hasXmp: !!metadata.xmp,
              hasIptc: !!metadata.iptc,
              hasAI: !!metadata.generation
            });
          } catch (error) {
            this.logger.error('Error extrayendo metadata avanzada:', {
              path,
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            });
          }

          // Extraer metadata específica de PNG y AI
          if (metadata.mimeType?.includes('png')) {
            try {
              const pngMetadata = await this.extractPNGMetadata(path);
              if (pngMetadata) {
                const aiMetadata = await this.extractAIMetadata(pngMetadata);
                if (aiMetadata) {
                  metadata.generation = aiMetadata;
                }
              }
            } catch (error) {
              if (error instanceof MetadataError) {
                this.logger.warn(`Error de metadata: ${error.code}`, {
                  message: error.message,
                  path: error.path,
                  details: error.details
                });
              } else {
                this.logger.error('Error procesando metadata PNG/AI:', {
                  path,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  stack: error instanceof Error ? error.stack : undefined
                });
              }
            }
          }

          // Validar y guardar en caché
          if (this.validateMetadata(metadata)) {
            await this.cache.set(path, metadata);
            this.logger.debug('💾 Metadatos guardados en caché:', { path });
          }

          return metadata;
        } catch (error) {
          if (error instanceof MetadataError) {
            this.logger.warn(`Error de metadata: ${error.code}`, {
              message: error.message,
              path: error.path,
              details: error.details
            });
          } else {
            this.logger.error('❌ Error obteniendo metadatos:', {
              path,
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            });
          }
          throw error;
        }
      },
      METADATA_RETRY_CONFIG,
      { path, operation: 'extracción de metadata' }
    );
  }

  private async getFileSystemMetadata(path: string) {
    const stats = statSync(path);
    return {
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      size: stats.size
    };
  }

  private async extractBasicMetadata(buffer: Buffer): Promise<Partial<FileMetadata>> {
    const metadata = await sharp(buffer).metadata();
    return {
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0
      },
      mimeType: `image/${metadata.format}`,
      colorSpace: metadata.space,
      hasAlpha: metadata.hasAlpha || false,
      isAnimated: metadata.pages ? metadata.pages > 1 : false
    };
  }

  private async extractExifMetadata(tags: ExifReader.Tags): Promise<Partial<FileMetadata>> {
    const metadata: Partial<FileMetadata> = {};

    // Extraer EXIF
    if (tags.Make || tags.Model || tags.Software) {
      metadata.exif = {
        make: tags.Make?.description,
        model: tags.Model?.description,
        software: tags.Software?.description,
        dateTime: tags.DateTimeOriginal?.description || tags.DateTime?.description,
        exposureTime: this.parseRational(tags.ExposureTime as ExifTag),
        fNumber: this.parseRational(tags.FNumber as ExifTag),
        iso: typeof tags.ISOSpeedRatings?.value === 'number' ? tags.ISOSpeedRatings.value : undefined,
        focalLength: this.parseRational(tags.FocalLength as ExifTag),
        lens: tags.LensModel?.description,
        copyright: tags.Copyright?.description,
        artist: tags.Artist?.description,
        description: tags.ImageDescription?.description
      };

      // Extraer GPS
      if (tags.GPSLatitude && tags.GPSLongitude) {
        const gpsData = {
          latitude: this.parseGPSCoordinate(
            tags.GPSLatitude as unknown as TypedGPSTag,
            tags.GPSLatitudeRef as ExifTag
          ),
          longitude: this.parseGPSCoordinate(
            tags.GPSLongitude as unknown as TypedGPSTag,
            tags.GPSLongitudeRef as ExifTag
          ),
          altitude: undefined as number | undefined
        };

        if (tags.GPSAltitude) {
          gpsData.altitude = this.parseRational(tags.GPSAltitude as ExifTag);
        }

        metadata.exif.gps = gpsData;
      }
    }

    // Extraer XMP
    if (tags.xmp) {
      const xmpData: Partial<FileMetadata['xmp']> = {};

      if (tags['Xmp.dc.title']?.description) {
        xmpData.title = tags['Xmp.dc.title'].description;
      }
      if (tags['Xmp.dc.creator']?.description) {
        xmpData.creator = tags['Xmp.dc.creator'].description;
      }
      if (tags['Xmp.dc.rights']?.description) {
        xmpData.rights = tags['Xmp.dc.rights'].description;
      }
      if (Array.isArray(tags['Xmp.dc.subject']?.value)) {
        xmpData.subject = tags['Xmp.dc.subject'].value.map(v => String(v));
      }
      if (typeof tags['Xmp.xmp.Rating']?.value === 'number') {
        xmpData.rating = tags['Xmp.xmp.Rating'].value;
      }

      if (Object.keys(xmpData).length > 0) {
        metadata.xmp = xmpData;
      }
    }

    // Extraer IPTC
    if (tags.iptc) {
      const iptcData: Partial<FileMetadata['iptc']> = {};

      if (tags['Iptc.Headline']?.description) {
        iptcData.headline = tags['Iptc.Headline'].description;
      }
      if (tags['Iptc.Caption']?.description) {
        iptcData.caption = tags['Iptc.Caption'].description;
      }
      if (Array.isArray(tags['Iptc.Keywords']?.value)) {
        iptcData.keywords = tags['Iptc.Keywords'].value.map(v => String(v));
      }
      if (tags['Iptc.CopyrightNotice']?.description) {
        iptcData.copyright = tags['Iptc.CopyrightNotice'].description;
      }
      if (tags['Iptc.Source']?.description) {
        iptcData.source = tags['Iptc.Source'].description;
      }

      if (Object.keys(iptcData).length > 0) {
        metadata.iptc = iptcData;
      }
    }

    return metadata;
  }

  private async extractAIMetadata(tags: ExifReader.Tags): Promise<AIMetadata | null> {
    // Buscar en chunks PNG
    const parameters = tags.parameters?.description || tags.Comment?.description;

    if (parameters) {
      return this.parseAIParameters(parameters);
    }

    return null;
  }

  private parseAIParameters(text: string): AIMetadata | null {
    try {
      // Separar el prompt del resto de parámetros
      const paramsSplit = text.split('\n');
      const prompt = paramsSplit[0].trim();
      const paramsText = paramsSplit.slice(1).join('\n');

      // Patrones comunes en imágenes de Stable Diffusion
      const patterns = {
        steps: /Steps: (\d+)/,
        sampler: /Sampler: ([^,]+)/,
        cfg_scale: /CFG scale: (\d+\.?\d*)/,
        seed: /Seed: (-?\d+)/,
        model: /Model: ([^,\n]+)/,
        clip_skip: /Clip skip: (\d+)/,
      };

      const result: AIMetadata = {
        type: 'stable-diffusion',
        prompt,
        extra_params: {}
      };

      // Extraer valores usando los patrones
      for (const [key, pattern] of Object.entries(patterns)) {
        const match = paramsText.match(pattern);
        if (match) {
          const value = this.parseValue(key, match[1].trim());
          if (key in result && value !== undefined) {
            (result as any)[key] = value;
          } else if (value !== undefined && result.extra_params) {
            result.extra_params[key] = value;
          }
        }
      }

      // Buscar prompt negativo
      const negativeMatch = text.match(/Negative prompt: (.*?)(?=\n[A-Za-z]+:|\n?$)/s);
      if (negativeMatch) {
        result.negative_prompt = negativeMatch[1].trim();
      }

      return Object.keys(result).length > 1 ? result : null;
    } catch (error) {
      this.logger.error('Error parseando parámetros AI:', error);
      return null;
    }
  }

  private parseValue(key: string, value: string): any {
    if (['steps', 'seed', 'clip_skip'].includes(key)) {
      return parseInt(value);
    }
    if (['cfg_scale'].includes(key)) {
      return parseFloat(value);
    }
    return value;
  }

  private parseRational(tag?: ExifTag): number | undefined {
    if (!tag?.value || !Array.isArray(tag.value)) return undefined;
    const [numerator, denominator] = tag.value;
    return denominator ? numerator / denominator : numerator;
  }

  private parseGPSCoordinate(coord: TypedGPSTag, ref: ExifTag): number {
    if (!coord?.value || !ref?.value) return 0;

    const [[degrees], [minutes], [seconds]] = coord.value;
    let decimal = degrees + (minutes / 60) + (seconds / 3600);

    // Convertir a negativo para Sur/Oeste
    if (ref.value === 'S' || ref.value === 'W') {
      decimal = -decimal;
    }

    return decimal;
  }

  private validateMetadata(metadata: FileMetadata): boolean {
    try {
      // 1. Validar estructura básica
      if (!metadata || typeof metadata !== 'object') {
        this.logger.warn('Metadata inválida: no es un objeto');
        return false;
      }

      // 2. Validar dimensiones
      if (metadata.dimensions) {
        const { width, height } = metadata.dimensions;
        if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
          this.logger.warn('Metadata inválida: dimensiones incorrectas', { width, height });
          return false;
        }
      }

      // 3. Validar sistema de archivos
      if (metadata.fileSystem) {
        const { created, modified, size } = metadata.fileSystem;
        if (!created || !modified || typeof size !== 'number' || size < 0) {
          this.logger.warn('Metadata inválida: información del sistema de archivos incorrecta', {
            created,
            modified,
            size
          });
          return false;
        }

        // Validar formato de fechas
        try {
          new Date(created).toISOString();
          new Date(modified).toISOString();
        } catch {
          this.logger.warn('Metadata inválida: fechas en formato incorrecto', {
            created,
            modified
          });
          return false;
        }
      }

      // 4. Validar metadata de generación AI
      if (metadata.generation) {
        const { type, prompt, model } = metadata.generation;

        // Validar tipo
        if (!type || !['stable-diffusion', 'comfyui', 'invoke-ai', 'novel-ai'].includes(type)) {
          this.logger.warn('Metadata inválida: tipo de generación AI desconocido', { type });
          return false;
        }

        // Validar campos requeridos según el tipo
        if (type === 'stable-diffusion' && !prompt) {
          this.logger.warn('Metadata inválida: falta prompt en metadata de Stable Diffusion');
          return false;
        }

        // Validar tipos de datos
        if (metadata.generation.steps && !Number.isInteger(metadata.generation.steps)) {
          this.logger.warn('Metadata inválida: steps debe ser un número entero');
          return false;
        }

        if (metadata.generation.cfg_scale && typeof metadata.generation.cfg_scale !== 'number') {
          this.logger.warn('Metadata inválida: cfg_scale debe ser un número');
          return false;
        }

        if (metadata.generation.seed && !Number.isInteger(metadata.generation.seed)) {
          this.logger.warn('Metadata inválida: seed debe ser un número entero');
          return false;
        }
      }

      // 5. Validar GPS si existe
      if (metadata.exif?.gps) {
        const { latitude, longitude, altitude } = metadata.exif.gps;

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          this.logger.warn('Metadata inválida: coordenadas GPS incorrectas', {
            latitude,
            longitude
          });
          return false;
        }

        // Validar rangos
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          this.logger.warn('Metadata inválida: coordenadas GPS fuera de rango', {
            latitude,
            longitude
          });
          return false;
        }

        // Validar altitud si existe
        if (altitude !== undefined && typeof altitude !== 'number') {
          this.logger.warn('Metadata inválida: altitud GPS incorrecta', { altitude });
          return false;
        }
      }

      // 6. Validar arrays en XMP y IPTC
      if (metadata.xmp?.subject && !Array.isArray(metadata.xmp.subject)) {
        this.logger.warn('Metadata inválida: XMP subject debe ser un array');
        return false;
      }

      if (metadata.iptc?.keywords && !Array.isArray(metadata.iptc.keywords)) {
        this.logger.warn('Metadata inválida: IPTC keywords debe ser un array');
        return false;
      }

      // 7. Validar tipos de datos en EXIF
      if (metadata.exif) {
        const { exposureTime, fNumber, iso, focalLength } = metadata.exif;

        if (exposureTime !== undefined && typeof exposureTime !== 'number') {
          this.logger.warn('Metadata inválida: exposureTime debe ser un número');
          return false;
        }

        if (fNumber !== undefined && typeof fNumber !== 'number') {
          this.logger.warn('Metadata inválida: fNumber debe ser un número');
          return false;
        }

        if (iso !== undefined && !Number.isInteger(iso)) {
          this.logger.warn('Metadata inválida: ISO debe ser un número entero');
          return false;
        }

        if (focalLength !== undefined && typeof focalLength !== 'number') {
          this.logger.warn('Metadata inválida: focalLength debe ser un número');
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Error validando metadata:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        metadata
      });
      return false;
    }
  }

  parseMetadata(metadataString: string | null): FileMetadata | null {
    if (!metadataString) {
      this.logger.warn('No hay metadata para parsear');
      return null;
    }

    try {
      const parsed = JSON.parse(metadataString);
      if (!parsed || typeof parsed !== 'object') {
        this.logger.warn('Metadata inválida:', metadataString);
        return null;
      }
      return parsed;
    } catch (error) {
      this.logger.error('Error parseando metadata:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: metadataString
      });
      return null;
    }
  }
}

// Crear una instancia privada del servicio
const metadataService = new MetadataService();

// Exportar solo funciones asíncronas
export async function parseMetadata(metadata: string | null): Promise<FileMetadata | null> {
  return metadataService.parseMetadata(metadata);
}

export async function extractMetadata(path: string): Promise<FileMetadata> {
  return metadataService.extractMetadata(path);
}

export async function preloadMetadata(paths: string[]): Promise<void> {
  try {
    metadataLogger.info('🔄 Iniciando precarga de metadatos...', { count: paths.length });

    const results = await Promise.allSettled(
      paths.map(path => metadataService.extractMetadata(path))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    metadataLogger.info('✅ Precarga completada:', {
      total: paths.length,
      succeeded,
      failed
    });
  } catch (error) {
    metadataLogger.error('❌ Error en precarga:', error);
    throw error;
  }
}
