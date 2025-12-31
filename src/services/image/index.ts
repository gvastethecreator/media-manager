/**
 * @file Exportaciones del servicio de Image
 * @module services/image
 * @description Punto de entrada para el servicio de imágenes
 *
 * Estructura modular:
 * - image.service.ts: CRUD y operaciones core
 * - image-thumbnail.service.ts: Generación y gestión de thumbnails
 * - image-lookup.service.ts: Búsqueda por hash, path, etc.
 * - image-processing.ts: Procesamiento de imágenes con Sharp
 * - image-events.ts: Sistema de eventos
 * - image-utils.ts: Utilidades y constantes
 */

// Servicio principal (CRUD)
export * from './image.service';
// Eventos
export { emitImageEvent, IMAGE_EVENTS } from './image-events';

// Funciones de búsqueda
export { buildImageWithStats, getImageByHash, getImageByPathAndFolder } from './image-lookup.service';
// Servicio de thumbnails
export { thumbnailService } from './image-thumbnail.service';

// Utilidades
export { SERVICE_NAME as IMAGE_SERVICE_NAME } from './image-utils';
