/**
 * @file Índice de transformadores para la entidad Place.
 * @module transformers/place
 * @description Centraliza la exportación de funciones de transformación y mapeo
 * para la entidad Place, asegurando una interfaz consistente para el resto de la aplicación.
 */

// --- Exportaciones de Mappers ---
// Se renombran para seguir el patrón de nomenclatura: map[Entidad][Accion]To[Destino]
export {
	createFilter as mapPlaceFiltersToPrisma,
	createOrderBy as mapPlaceOrderByToPrisma,
	toCreateData as mapCreatePlaceDataToPrisma,
	toPlaceWithStats,
	toSearchOptions as mapPlaceSearchOptionsToPrisma,
	toUpdateData as mapUpdatePlaceDataToPrisma,
} from './mappers';
