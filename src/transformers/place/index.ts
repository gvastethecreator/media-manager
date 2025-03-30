/**
 * @file Exportaciones para el transformer de Place
 * @module transformers/place
 */

// Serializadores
export {
    deserializePlaceDangers, deserializePlaceFilters, deserializePlaceResources, deserializePlaceStats, extendPlace,
    extendPlaces, formatPopulation, fromPrismaPlace,
    // Funciones de formato para UI
    getDangerLevel, getDisplaySize,
    getRegionPath,
    // Utilidades para campos JSON
    serializePlaceDangers, serializePlaceFilters, serializePlaceResources, serializePlaceStats,
    // Funciones principales
    toPrismaPlace, validatePlace,
    // Opciones de transformación
    type PlaceTransformOptions
} from './serializers';

// Mappers
export {

    // Funciones de utilidad
    generatePlaceColor, getCompleteLocationName,
    // Funciones para Prisma
    mapCreatePlaceDataToPrisma, mapPlaceFiltersToPrisma, mapPlaceSearchOptionsToPrisma, mapPlaceToRelatedPlace, mapUpdatePlaceDataToPrisma, suggestPlaceEmoji
} from './mappers';

