/**
 * @file Punto de entrada para transformadores de Video
 * @module transformers/video
 * ✅ MIGRADO A DRIZZLE
 */

export {
	mapCreateVideoDataToDrizzle,
	mapUpdateVideoDataToDrizzle,
	mapVideoFiltersToDrizzleArgs,
	// Alias para compatibilidad, marcados como deprecated en el mapper
	mapCreateVideoDataToPrisma,
	mapUpdateVideoDataToPrisma,
	mapVideoFiltersToPrismaArgs,
} from './mappers';

export { fromDrizzleVideo, fromDrizzleVideos, toVideoWithStats } from './transformer';

// TODO: Revisar y migrar esquemas de validación si es necesario
// export { VideoSchema } from './schema';
