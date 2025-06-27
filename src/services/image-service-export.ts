/**
 * @file Punto de exportación unificado para el servicio de imágenes
 * @module services/image
 * @description Este archivo es el punto de entrada principal para todas las funcionalidades relacionadas con imágenes
 */

// Exportar transformadores para facilitar su uso
export {
    transformImage, transformImageToComplete,
    transformImageToExtended, transformImages,
    transformImagesToComplete,
    transformImagesToExtended
} from '@/transformers/image/transformer';
/**
 * Re-exportación de tipos y constantes relacionados con imágenes
 */
/**
 * Re-exportación de la instancia singleton del servicio funcional de imágenes
 */
export {
    IMAGE_EVENTS, type CreateImageInput, type ImageProcessingOptions, // Exportar la configimageService, THUMBNAIL_QUALITY_CONFIG, 
    type ThumbnailQuality
} from './image/image.service';

// Exportar métodos específicos del servicio para facilitar su uso
export const {
	getImage,
	getImages,
	updateImage,
	deleteImage,
	createImage,
	generateThumbnail,
	getThumbnail,
	getOriginalImage,
	getImageMetadata,
} = imageService;
