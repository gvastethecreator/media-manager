/**
 * @file Punto de entrada para transformadores de Video
 * @module transformers/video
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

// Exportaciones de mappers
export { mapToVideoBase, mapToVideoWithCounts, mapToVideoWithStats } from './mappers';

// Exportaciones de transformadores
export {
	fromDrizzleVideo,
	fromDrizzleVideos,
	fromDrizzleVideosWithCounts,
	fromDrizzleVideoWithCounts,
	getAllVideos,
	getVideoById,
	videosToRecord,
} from './transformer';

// Esquemas de validación
export { VideoCreateInputSchema, VideoSchema, VideoUpdateInputSchema } from './schema';
