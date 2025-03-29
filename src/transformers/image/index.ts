/**
 * @file Exportaciones de transformers para la entidad Image
 * @module transformers/image
 */

// Exportar serializadores
export {
  deserializeImageMetadata, extendImage,
  extendImages, fromImageComplete, fromImageVisualConfigComplete,
  // Funciones obsoletas, mantenidas por compatibilidad
  serializeImageMetadata, serializeImageVisualConfig, toImageComplete, toImageVisualConfigComplete
} from './serializers';

// Exportar mappers
export {
  getDerivedImageProperties, mapCreateImageDataToPrisma, mapToImageSummaries, mapToImageSummary, mapUpdateImageDataToPrisma,
  // Función obsoleta, mantenida por compatibilidad
  updateImageMetadata
} from './mappers';

