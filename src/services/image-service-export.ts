/**
 * @file Punto de exportación unificado para el servicio de imágenes
 * @module services/image
 * @description Este archivo es el punto de entrada principal para todas las funcionalidades relacionadas con imágenes
 */

// Exportar transformadores para facilitar su uso
export {
	transformImage,
	transformImages,
	transformImagesToComplete,
	transformImagesToExtended,
	transformImageToComplete,
	transformImageToExtended,
} from '@/transformers/image/transformer';
/**
 * Re-exportación de tipos y constantes relacionados con imágenes
 */
/**
 * Re-exportación de la instancia singleton del servicio funcional de imágenes
 */
export {
	type CreateImageInput, // Exportar tipos de input/options
	IMAGE_EVENTS,
	type ImageProcessingOptions,
	imageService,
	THUMBNAIL_QUALITY_CONFIG, // Exportar la config
	type ThumbnailQuality, // Exportar el tipo
} from './image/image.service';
