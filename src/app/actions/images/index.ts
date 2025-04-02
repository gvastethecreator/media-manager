'use server';

/**
 * @file Exportaciones asíncronas para funciones de gestión de imágenes
 * @module app/actions/images
 */

import * as FolderImagesAction from './folder-images.action';
import * as ImageAccessActions from './image-access.actions';
import * as ImageCrudActions from './image-crud.actions';
import * as ImageProcessingActions from './image-processing.actions';
import { generateThumbnail as generateThumbnailFromAction, getThumbnail as getThumbnailFromAction } from './image-thumbnails.actions';
import * as ImagesRandomAction from './images-random.action';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'

// Exportaciones de image-access.actions
export async function getImageUrl(...args: Parameters<typeof ImageAccessActions.getImageUrl>) {
  return ImageAccessActions.getImageUrl(...args);
}
export async function getOriginalImage(...args: Parameters<typeof ImageAccessActions.getOriginalImage>) {
  return ImageAccessActions.getOriginalImage(...args);
}

// Exportaciones de image-crud.actions
export async function createImageAction(...args: Parameters<typeof ImageCrudActions.createImage>) {
  return ImageCrudActions.createImage(...args);
}
export async function updateImageAction(...args: Parameters<typeof ImageCrudActions.updateImage>) {
  return ImageCrudActions.updateImage(...args);
}
export async function deleteImageAction(...args: Parameters<typeof ImageCrudActions.deleteImage>) {
  return ImageCrudActions.deleteImage(...args);
}
export async function setImageFavoriteAction(...args: Parameters<typeof ImageCrudActions.updateFavoriteStatus>) {
  return ImageCrudActions.updateFavoriteStatus(...args);
}

// Exportaciones de image-processing.actions
export async function processImageAction(...args: Parameters<typeof ImageProcessingActions.processImage>) {
  return ImageProcessingActions.processImage(...args);
}
// La función reprocessImageAction no existe en el archivo fuente
// export async function reprocessImageAction(...args: Parameters<typeof ImageProcessingActions.reprocessImageAction>) {
//   return ImageProcessingActions.reprocessImageAction(...args);
// }

// Exportaciones de image-stats.actions
// La función getImageStatsAction no existe en el archivo fuente (existe updateImageStats)
// export async function getImageStatsAction(...args: Parameters<typeof ImageStatsActions.getImageStatsAction>) {
//   return ImageStatsActions.getImageStatsAction(...args);
// }
// La función getImageCountByFormatAction no existe en el archivo fuente
// export async function getImageCountByFormatAction(...args: Parameters<typeof ImageStatsActions.getImageCountByFormatAction>) {
//   return ImageStatsActions.getImageCountByFormatAction(...args);
// }

// Exportaciones de image-thumbnails.actions
export async function getThumbnail(...args: Parameters<typeof getThumbnailFromAction>) {
  return getThumbnailFromAction(...args);
}
export async function generateThumbnail(...args: Parameters<typeof generateThumbnailFromAction>) {
  return generateThumbnailFromAction(...args);
}

// Exportaciones de folder-images.action
export async function getLatestFolderImagesAction(...args: Parameters<typeof FolderImagesAction.getLatestFolderImages>) {
  return FolderImagesAction.getLatestFolderImages(...args);
}

// Exportaciones de images-random.action
export async function getRandomImagesForEntityAction(...args: Parameters<typeof ImagesRandomAction.getRandomImagesForEntity>) {
  return ImagesRandomAction.getRandomImagesForEntity(...args);
}

// NOTA: Funciones faltantes o no exportadas comentadas en la versión anterior, se mantienen omitidas

// NOTA: Los siguientes módulos no existen actualmente en el proyecto
// export * from './image-metadata.actions';
// export * from './image-relations.actions';
// export * from './image.actions';

// image-types.actions
export type { GetImagesOptions, GetImagesResult, ImageResult } from './image-types.actions';

