/**
 * @file Punto de entrada para los transformadores de la entidad Video.
 * @module transformers/video
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Video.
 */

// De transformer.ts
export { VideoTransformer } from './transformer';

// De mappers.ts
export {
    mapCreateVideoDataToPrisma,
    mapUpdateVideoDataToPrisma
} from './mappers';

// Exportaciones individuales para compatibilidad legacy
import { VideoTransformer } from './transformer';

export const {
    fromPrismaVideo,
    fromPrismaVideoWithCounts,
    fromPrismaVideos,
    fromPrismaVideosWithCounts,
    getAllVideos,
    getVideoById,
    videosToRecord
} = VideoTransformer;

