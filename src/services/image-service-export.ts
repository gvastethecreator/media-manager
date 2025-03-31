/**
 * @file Exportación principal del servicio de imágenes
 * @module services/image
 * @description Punto de entrada unificado para el servicio de imágenes
 */

import * as imageService from './image.service.functional';

// Exportar todo el servicio funcional
export { imageService };

// Exportación de funciones individuales para uso directo
export const {
  getImageById,
  getImages,
  createImage,
  updateImage,
  deleteImage,
  regenerateThumbnail,
  // Eventos
  onProgress,
  onError,
  onComplete,
  onStats,
  onImageCreated,
  onImageUpdated,
  onImageDeleted,
  onImagesChanged,
  onThumbnailGenerated,
  onMetadataUpdated,
} = imageService;

// Exportar tipos y constantes
export type {
    CreateImageInput,
    ImageProcessingOptions
} from './image.service.functional';

export {
    IMAGE_EVENTS,
    ThumbnailQuality
} from './image.service.functional';
