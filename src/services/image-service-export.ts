/**
 * @file Punto de exportación unificado para el servicio de imágenes
 * @module services/image
 * @description Este archivo es el punto de entrada principal para todas las funcionalidades relacionadas con imágenes
 */

/**
 * Re-exportación de tipos y constantes relacionados con imágenes
 */
export {
	IMAGE_EVENTS,
	THUMBNAIL_QUALITY_CONFIG, // Exportar la config
	type ThumbnailQuality, // Exportar el tipo
	type CreateImageInput, // Exportar tipos de input/options
	type ImageProcessingOptions,
} from './image/image.service';

/**
 * Re-exportación de la instancia singleton del servicio funcional de imágenes
 */
export { imageService } from './image/image.service';

// Exportar transformadores para facilitar su uso
export {
	transformImage,
	transformImageToComplete,
	transformImageToExtended,
	transformImages,
	transformImagesToComplete,
	transformImagesToExtended,
} from '@/transformers/image/transformer';
