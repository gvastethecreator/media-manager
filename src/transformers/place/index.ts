/**
 * @file Índice de transformadores para la entidad Place.
 * @module transformers/place
 * @description Centraliza la exportación de funciones de transformación y mapeo
 * para la entidad Place, asegurando una interfaz consistente para el resto de la aplicación.
 
 */

// Exportar funciones de extensión desde types
export { extendPlace, extendPlaces, type PlaceFilters } from '../../types/entities/place/types';
// Exportar mappers, serializers, validators y schemas
export * from './mappers';
export * from './schema';
export * from './serializers';
// Exportar funciones principales de transformación
export {
	fromDrizzlePlace,
	fromDrizzlePlaces,
	toDrizzlePlace,
} from './transformer';
export * from './validators';
