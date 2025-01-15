import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import type { FileMetadata, AIMetadata } from '@/types/metadata';
import { statSync, readFileSync } from 'fs';
import sharp from 'sharp';
import * as exifr from 'exifr';

const metadataLogger = logger.withContext('MetadataService');

// Crear una instancia de CacheManager para metadatos
const metadataCache = new CacheManager<FileMetadata>({
  name: 'metadata',
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 1000,
  updateAgeOnGet: true,
  allowStale: true
});

// Tipos de generadores AI soportados
const AI_GENERATORS = {
  STABLE_DIFFUSION: 'stable-diffusion',
  COMFYUI: 'comfyui',
  INVOKE_AI: 'invoke-ai',
  NOVEL_AI: 'novel-ai'
} as const;

async function getFileMetadata(path: string) {
  const stats = statSync(path);
  return {
    size: stats.size,
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString()
  };
}

async function getSharpMetadata(path: string) {
  const metadata = await sharp(path).metadata();
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

function calculateDelay(baseDelay: number, attempt: number, config: RetryConfig): number {
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

async function withRetry<T>(
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
        metadataLogger.info(`Operación exitosa después de ${attempt} intentos:`, {
          path: context.path,
          operation: context.operation,
          totalTime: Date.now() - startTime
        });
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const delay = calculateDelay(baseDelay, attempt, config);

      if (attempt === config.maxAttempts) {
        metadataLogger.error(`Máximo de intentos alcanzado para ${context.operation}:`, {
          path: context.path,
          attempts: attempt,
          totalTime: Date.now() - startTime,
          error: lastError.message,
          stack: lastError.stack
        });
        throw lastError;
      }

      metadataLogger.warn(`Reintentando ${context.operation} (intento ${attempt}/${config.maxAttempts}):`, {
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

// Configuraciones específicas para diferentes operaciones
const METADATA_RETRY_CONFIG: RetryConfig = {
  ...DEFAULT_RETRY_CONFIG,
  maxAttempts: 5,
  maxDelay: 2000,
  backoffFactor: 1.5
};

const PNG_RETRY_CONFIG: RetryConfig = {
  ...DEFAULT_RETRY_CONFIG,
  maxAttempts: 3,
  maxDelay: 1500,
  backoffFactor: 2
};

const AI_RETRY_CONFIG: RetryConfig = {
  ...DEFAULT_RETRY_CONFIG,
  maxAttempts: 2,
  maxDelay: 500,
  backoffFactor: 1.5
};

async function extractPNGMetadata(path: string): Promise<any> {
  return withRetry(
    async () => {
      const buffer = await sharp(path).toBuffer();
      const chunks = await exifr.parse(buffer, {
        tiff: true,
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        ihdr: true,
        multiSegment: true,
        mergeOutput: false
      });

      metadataLogger.debug('Chunks PNG extraídos:', {
        path,
        chunkKeys: chunks ? Object.keys(chunks) : [],
        chunks
      });

      return chunks;
    },
    PNG_RETRY_CONFIG,
    { path, operation: 'extracción de chunks PNG' }
  );
}

function validateMetadata(metadata: FileMetadata): boolean {
  try {
    // 1. Validar estructura básica
    if (!metadata || typeof metadata !== 'object') {
      metadataLogger.warn('Metadata inválida: no es un objeto');
      return false;
    }

    // 2. Validar dimensiones
    if (metadata.dimensions) {
      const { width, height } = metadata.dimensions;
      if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
        metadataLogger.warn('Metadata inválida: dimensiones incorrectas', { width, height });
        return false;
      }
    }

    // 3. Validar sistema de archivos
    if (metadata.fileSystem) {
      const { created, modified, size } = metadata.fileSystem;
      if (!created || !modified || typeof size !== 'number' || size < 0) {
        metadataLogger.warn('Metadata inválida: información del sistema de archivos incorrecta', {
          created,
          modified,
          size
        });
        return false;
      }
    }

    // 4. Validar metadata de generación AI
    if (metadata.generation) {
      const { type } = metadata.generation;
      if (!type || !['stable-diffusion', 'comfyui', 'invoke-ai', 'novel-ai'].includes(type)) {
        metadataLogger.warn('Metadata inválida: tipo de generación AI desconocido', { type });
        return false;
      }
    }

    // 5. Validar GPS si existe
    if (metadata.exif?.gps) {
      const { latitude, longitude } = metadata.exif.gps;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        metadataLogger.warn('Metadata inválida: coordenadas GPS incorrectas', {
          latitude,
          longitude
        });
        return false;
      }
    }

    return true;
  } catch (error) {
    metadataLogger.error('Error validando metadata:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      metadata
    });
    return false;
  }
}

export async function getImageMetadata(path: string): Promise<FileMetadata> {
  return withRetry(
    async () => {
      try {
        // Intentar obtener del caché primero
        const cached = await metadataCache.get(path);
        if (cached) {
          metadataLogger.debug('🎯 Cache hit para metadatos:', { path });
          return cached;
        }

        metadataLogger.debug('🔍 Cache miss para metadatos:', { path });

        // 1. Obtener metadata básica
        const fileSystem = await getFileMetadata(path);
        const sharpMetadata = await getSharpMetadata(path);

        // 2. Construir objeto base de metadata
        const metadata: FileMetadata = {
          dimensions: sharpMetadata.dimensions,
          fileSystem,
          mimeType: sharpMetadata.mimeType,
          colorSpace: sharpMetadata.colorSpace,
          hasAlpha: sharpMetadata.hasAlpha,
          isAnimated: sharpMetadata.isAnimated
        };

        // 3. Extraer metadata EXIF/XMP/IPTC
        try {
          const exifData = await exifr.parse(path, {
            tiff: true,
            xmp: true,
            icc: true,
            iptc: true,
            jfif: true,
            ihdr: true,
            multiSegment: true,
            mergeOutput: true,
            sanitize: true,
            translateKeys: true,
            translateValues: true,
          });

          if (exifData) {
            // Procesar EXIF
            metadata.exif = {
              make: exifData.Make || exifData.make,
              model: exifData.Model || exifData.model,
              software: exifData.Software || exifData.software,
              dateTime: exifData.DateTimeOriginal || exifData.CreateDate || exifData.ModifyDate,
              exposureTime: exifData.ExposureTime || exifData.exposureTime,
              fNumber: exifData.FNumber || exifData.fNumber,
              iso: exifData.ISO || exifData.iso,
              focalLength: exifData.FocalLength || exifData.focalLength,
              lens: exifData.LensModel || exifData.lens,
              copyright: exifData.Copyright || exifData.copyright,
              artist: exifData.Artist || exifData.artist,
              description: exifData.ImageDescription || exifData.description
            };

            // Procesar GPS
            if (exifData.latitude && exifData.longitude) {
              metadata.exif.gps = {
                latitude: exifData.latitude,
                longitude: exifData.longitude,
                altitude: exifData.altitude
              };
            }

            // Procesar XMP
            if (exifData.xmp) {
              metadata.xmp = {
                title: exifData.xmp.title,
                creator: exifData.xmp.creator,
                rights: exifData.xmp.rights,
                subject: Array.isArray(exifData.xmp.subject) ? exifData.xmp.subject : [],
                rating: typeof exifData.xmp.rating === 'number' ? exifData.xmp.rating : undefined
              };
            }

            // Procesar IPTC
            if (exifData.iptc) {
              metadata.iptc = {
                headline: exifData.iptc.headline || exifData.iptc.Headline,
                caption: exifData.iptc.caption || exifData.iptc.Caption,
                keywords: Array.isArray(exifData.iptc.keywords) ? exifData.iptc.keywords :
                  Array.isArray(exifData.iptc.Keywords) ? exifData.iptc.Keywords : [],
                copyright: exifData.iptc.copyright || exifData.iptc.CopyrightNotice,
                source: exifData.iptc.source || exifData.iptc.Source
              };
            }
          }
        } catch (error) {
          metadataLogger.error('Error extrayendo EXIF/XMP/IPTC:', {
            path,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
        }

        // 4. Extraer metadata específica de PNG y AI
        if (metadata.mimeType?.includes('png')) {
          try {
            const pngMetadata = await extractPNGMetadata(path);
            if (pngMetadata) {
              // Intentar extraer metadata de AI
              const aiMetadata = await parseAIMetadata(pngMetadata, path);
              if (aiMetadata) {
                metadata.generation = aiMetadata;
              }
            }
          } catch (error) {
            if (error instanceof MetadataError) {
              metadataLogger.warn(`Error de metadata: ${error.code}`, {
                message: error.message,
                path: error.path,
                details: error.details
              });
            } else {
              metadataLogger.error('Error procesando metadata PNG/AI:', {
                path,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
              });
            }
          }
        }

        // Validar metadata antes de guardar en caché
        if (!validateMetadata(metadata)) {
          metadataLogger.warn('Metadata inválida, no se guardará en caché:', {
            path,
            metadata
          });
        } else {
          // Guardar en caché
          await metadataCache.set(path, metadata);
          metadataLogger.debug('💾 Metadatos guardados en caché:', { path });
        }

        return metadata;
      } catch (error) {
        if (error instanceof MetadataError) {
          metadataLogger.warn(`Error de metadata: ${error.code}`, {
            message: error.message,
            path: error.path,
            details: error.details
          });
        } else {
          metadataLogger.error('❌ Error obteniendo metadatos:', {
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

async function parseAIMetadata(pngMetadata: any, path: string): Promise<AIMetadata | null> {
  return withRetry(
    async () => {
      // 1. Intentar extraer de parámetros en chunks PNG
      if (pngMetadata.parameters || pngMetadata.Comment) {
        const parameters = pngMetadata.parameters || pngMetadata.Comment;

        metadataLogger.debug('Analizando parámetros AI:', {
          path,
          hasParameters: !!pngMetadata.parameters,
          hasComment: !!pngMetadata.Comment,
          parameters
        });

        // Detectar tipo de generador
        if (parameters.includes('Steps:') && parameters.includes('Sampler:')) {
          // Stable Diffusion WebUI
          const promptMatch = parameters.match(/^([^:]+)$/m);
          const negativeMatch = parameters.match(/^Negative prompt: (.+)$/m);
          const settingsMatch = parameters.match(/^Steps: (\d+), Sampler: ([^,]+), CFG scale: (\d+), Seed: (-?\d+)/);

          if (!settingsMatch) {
            throw new MetadataError(
              'Formato de parámetros SD inválido',
              path,
              'SD_PARAMS_PARSE_ERROR',
              { parameters }
            );
          }

          const metadata: AIMetadata = {
            type: 'stable-diffusion',
            prompt: promptMatch?.[1]?.trim(),
            negative_prompt: negativeMatch?.[1]?.trim(),
            steps: settingsMatch[1] ? parseInt(settingsMatch[1]) : undefined,
            sampler: settingsMatch[2]?.trim(),
            cfg_scale: settingsMatch[3] ? parseFloat(settingsMatch[3]) : undefined,
            seed: settingsMatch[4] ? parseInt(settingsMatch[4]) : undefined,
            raw: parameters
          };

          metadataLogger.debug('Metadata Stable Diffusion extraída:', {
            path,
            metadata
          });

          return metadata;
        } else if (parameters.includes('workflow')) {
          // ComfyUI
          const metadata: AIMetadata = {
            type: 'comfyui',
            workflow: parameters,
            raw: parameters
          };

          metadataLogger.debug('Metadata ComfyUI extraída:', {
            path,
            metadata
          });

          return metadata;
        }

        throw new MetadataError(
          'Tipo de generador AI no soportado',
          path,
          'UNSUPPORTED_AI_GENERATOR',
          { parameters }
        );
      }

      // 2. Intentar extraer del nombre del archivo
      const filename = path.split(/[\\/]/).pop() || '';
      const sdMatch = filename.match(/(\{.*\})/);
      if (sdMatch) {
        try {
          const genData = JSON.parse(sdMatch[1]);
          const metadata: AIMetadata = {
            type: 'stable-diffusion',
            prompt: genData.prompt,
            negative_prompt: genData.negative_prompt,
            model: genData.model,
            steps: genData.steps,
            sampler: genData.sampler,
            cfg_scale: genData.cfg_scale,
            seed: genData.seed,
            raw: JSON.stringify(genData)
          };

          metadataLogger.debug('Metadata extraída del nombre:', {
            path,
            metadata
          });

          return metadata;
        } catch (error) {
          throw new MetadataError(
            'Error parseando JSON del nombre',
            path,
            'FILENAME_JSON_PARSE_ERROR',
            {
              error: error instanceof Error ? error.message : 'Unknown error',
              match: sdMatch[1]
            }
          );
        }
      }

      return null;
    },
    AI_RETRY_CONFIG,
    { path, operation: 'parsing de metadata AI' }
  );
}

export async function preloadMetadata(paths: string[]): Promise<void> {
  try {
    metadataLogger.info('🔄 Iniciando precarga de metadatos...', { count: paths.length });

    const results = await Promise.allSettled(
      paths.map(path => getImageMetadata(path))
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
