/**
 * @file Exportaciones para el transformer de Place
 * @module transformers/place
 */

// Importar el transformer v2
import PlaceTransformer from './v2';

// Reexportar el transformer completo como exportación por defecto para compatibilidad
export default PlaceTransformer;

// Exportar funciones individuales
export {
    createPlace, deletePlace,
    filterPlaces, getPlaceById,
    getPlacesByIds, getRelatedPlaces, searchPlaces, updatePlace
} from './v2';

// Exportar funciones de mapeo
export {
    generatePlaceColor, getCompleteLocationName, mapCreatePlaceDataToPrisma, mapPlaceFiltersToPrisma,
    mapPlaceSearchOptionsToPrisma,
    mapPlaceToRelatedPlace, mapUpdatePlaceDataToPrisma, suggestPlaceEmoji
} from './v2/mappers';

// Exportar funciones de serialización
export {
    deserializePlaceDangers, deserializePlaceFilters, deserializePlaceResources, deserializePlaceStats, extendPlace,
    extendPlaces,
    fromPrismaPlace, serializePlaceDangers, serializePlaceFilters, serializePlaceResources, serializePlaceStats, toPrismaPlace,
    validatePlace, type PlaceTransformOptions
} from './v2/serializers';

// Nota: Se mantiene compatibilidad con la versión anterior
// mediante la exportación por defecto del objeto PlaceTransformer
