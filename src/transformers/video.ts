/**
 * @file Archivo principal para transformadores de Video
 * @module transformers/video
 * @deprecated Importar directamente desde 'src/transformers/video/v2'
 */

import VideoTransformer, {
    VideoTransformOptions,
    extendVideo,
    extendVideos,
    fromPrismaVideo,
    parseMetadata,
    toCreateVideoData,
    toPrismaVideo,
    toRelatedVideo,
    toSearchFilters,
    toSearchOptions,
    toSearchResult,
    toUpdateVideoData,
    validateVideo
} from './video/v2';

// Re-exportar funciones individualmente
export {
    VideoTransformOptions,
    extendVideo,
    extendVideos,
    fromPrismaVideo,
    parseMetadata,
    toCreateVideoData, toPrismaVideo, // Mantener compatibilidad con nombre antiguo
    toSearchFilters,
    toSearchOptions,
    toSearchResult, toUpdateVideoData, toRelatedVideo as toVideoRelated, validateVideo
};

// Exportaciones por alias para compatibilidad con el código existente
export const mapCreateVideoDataToPrisma = toCreateVideoData;
export const mapUpdateVideoDataToPrisma = toUpdateVideoData;
export const mapVideoSearchOptionsToPrisma = toSearchOptions;
export const mapVideoFiltersToPrisma = toSearchFilters;
export const mapVideoToRelatedVideo = toRelatedVideo;

// Exportar objeto de compatibilidad como predeterminado
export default VideoTransformer;