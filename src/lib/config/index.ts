import { CacheConfigSchema, cacheConfig } from './cache.config';
// Validación de configuración al iniciar la aplicación
import { ImageConfigSchema, imageConfig } from './image.config';
import { THUMBNAIL_QUALITY_CONFIG, ThumbnailQuality, ThumbnailQualitySchema } from './thumbnail.config';

function validateConfigs() {
	try {
		ImageConfigSchema.parse(imageConfig);
		CacheConfigSchema.parse(cacheConfig);
	} catch (error) {
		console.error('❌ Error en la configuración:', error);
		process.exit(1);
	}
}

// Validar configuraciones al importar
validateConfigs();

export {
	imageConfig,
	ImageConfigSchema,
	cacheConfig,
	CacheConfigSchema,
	ThumbnailQualitySchema,
	ThumbnailQuality,
	THUMBNAIL_QUALITY_CONFIG,
};
