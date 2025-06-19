/**
 * @file Punto de entrada para los transformadores de la entidad Place.
 * @module transformers/place
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Place.
 * No se deben exportar serializadores de JSON, ya que son detalles de implementación interna.
 */

// De mappers.ts
export {
	mapCreatePlaceDataToPrisma,
	mapPlaceSearchOptionsToPrisma,
	mapUpdatePlaceDataToPrisma,
} from './mappers';

// De transformer.ts
export { fromPrismaPlace, fromPrismaPlaces } from './transformer';
