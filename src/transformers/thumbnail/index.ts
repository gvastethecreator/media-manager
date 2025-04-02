/**
 * @file Punto de entrada para transformadores de Thumbnail
 * @module transformers/thumbnail
 */

export * from './transformer';

// Exportar transformador como objeto para mantener coherencia con otros transformadores
import * as transformerFunctions from './transformer';

export const thumbnailTransformer = {
    transform: transformerFunctions.transformThumbnail,
    transformMany: transformerFunctions.transformThumbnails,
    toWithStats: transformerFunctions.transformThumbnailToWithStats,
    toExtended: transformerFunctions.transformThumbnailToExtended,
    calculateStats: transformerFunctions.calculateThumbnailStats
};