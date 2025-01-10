// Validación de configuración al iniciar la aplicación
import { imageConfig, ImageConfigSchema } from './image.config'
import { cacheConfig, CacheConfigSchema } from './cache.config'
import { ThumbnailQualitySchema, ThumbnailQuality, THUMBNAIL_QUALITY_CONFIG } from './thumbnail.config'

function validateConfigs() {
  try {
    ImageConfigSchema.parse(imageConfig)
    CacheConfigSchema.parse(cacheConfig)
  } catch (error) {
    console.error('❌ Error en la configuración:', error)
    process.exit(1)
  }
}

// Validar configuraciones al importar
validateConfigs()

export {
  imageConfig,
  ImageConfigSchema,
  cacheConfig,
  CacheConfigSchema,
  ThumbnailQualitySchema,
  ThumbnailQuality,
  THUMBNAIL_QUALITY_CONFIG,
}
