import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import type { ImageMetadata } from '@/types/metadata';
import { statSync } from 'fs';
import sharp from 'sharp';

const metadataLogger = logger.withContext('MetadataService');

// Crear una instancia de CacheManager para metadatos
const metadataCache = new CacheManager<ImageMetadata>({
  name: 'metadata',
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 1000,
  updateAgeOnGet: true,
  allowStale: true
});

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
    mimeType: `image/${metadata.format}`
  };
}

export async function getImageMetadata(path: string): Promise<ImageMetadata> {
  try {
    // Intentar obtener del caché primero
    const cached = await metadataCache.get(path);
    if (cached) {
      metadataLogger.debug('🎯 Cache hit para metadatos:', { path });
      return cached;
    }

    metadataLogger.debug('🔍 Cache miss para metadatos:', { path });

    // Obtener metadatos
    const [fileSystem, imageInfo] = await Promise.all([
      getFileMetadata(path),
      getSharpMetadata(path)
    ]);

    const metadata: ImageMetadata = {
      dimensions: imageInfo.dimensions,
      fileSystem,
      mimeType: imageInfo.mimeType
    };

    // Guardar en caché
    await metadataCache.set(path, metadata);
    metadataLogger.debug('💾 Metadatos guardados en caché:', { path });

    return metadata;
  } catch (error) {
    metadataLogger.error('❌ Error obteniendo metadatos:', { path, error });
    throw error;
  }
}

// Función para precargar metadatos en lotes
export async function preloadMetadata(paths: string[]): Promise<void> {
  try {
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < paths.length; i += batchSize) {
      batches.push(paths.slice(i, i + batchSize));
    }

    metadataLogger.info(`🔄 Precargando ${paths.length} archivos en ${batches.length} lotes`);

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (path) => {
          const exists = await metadataCache.get(path);
          if (!exists) {
            await getImageMetadata(path);
          }
        })
      );
    }

    metadataLogger.info('✅ Precarga completada');
  } catch (error) {
    metadataLogger.error('❌ Error precargando metadatos:', error);
  }
}
