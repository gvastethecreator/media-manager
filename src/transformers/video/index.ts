/**
 * @file Punto de entrada para el transformer de Video
 * @module transformers/video
 */

export * from './mappers';
export * from './serializers';

// Alias para funciones comunes
import {
    mapCreateVideoDataToPrisma,
    mapUpdateVideoDataToPrisma,
    mapVideoFiltersToPrisma,
    mapVideoSearchOptionsToPrisma,
    mapVideoToRelatedVideo
} from './mappers';
import { extendVideo, extendVideos, fromPrismaVideo, toPrismaVideo, validateVideo } from './serializers';

// Exportaciones por defecto
export default {
  // Serializers
  fromPrisma: fromPrismaVideo,
  toPrisma: toPrismaVideo,
  validate: validateVideo,
  extend: extendVideo,
  extendMany: extendVideos,

  // Mappers
  mapCreateData: mapCreateVideoDataToPrisma,
  mapUpdateData: mapUpdateVideoDataToPrisma,
  mapSearchOptions: mapVideoSearchOptionsToPrisma,
  mapFilters: mapVideoFiltersToPrisma,
  mapToRelated: mapVideoToRelatedVideo
};

/**
 * Función principal para transformar videos desde Prisma
 * Esta función sirve como punto de entrada principal para transformar videos
 * @param video - Video de Prisma
 * @returns Video transformado con propiedades extendidas
 */
export const transformVideo = fromPrismaVideo;

/**
 * Función principal para transformar múltiples videos desde Prisma
 * @param videos - Array de videos de Prisma
 * @returns Array de videos transformados con propiedades extendidas
 */
export const transformVideos = extendVideos;
