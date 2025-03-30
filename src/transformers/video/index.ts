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
