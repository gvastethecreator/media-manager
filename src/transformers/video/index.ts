/**
 * @file Punto de entrada para los transformadores de la entidad Video.
 * @module transformers/video
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Video.
 */

// De mappers.ts
export {
	mapCreateVideoDataToPrisma,
	mapUpdateVideoDataToPrisma,
	mapVideoSearchOptionsToPrisma,
} from './mappers';

// De transformer.ts
export { fromPrismaVideo, fromPrismaVideos } from './transformer';
