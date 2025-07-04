/**
 * @file Índice de transformadores para la entidad Place.
 * @module transformers/place
 * @description Centraliza la exportación de funciones de transformación y mapeo
 * para la entidad Place, asegurando una interfaz consistente para el resto de la aplicación.
 */

// --- Exportaciones de Mappers ---
// Se renombran para seguir el patrón de nomenclatura: map[Entidad][Accion]To[Destino]
export {
	createFilterForDrizzle,
	createOrderByForDrizzle,
	toCreateDataForDrizzle,
	toPlaceWithStats,
	toSearchOptionsForDrizzle,
	toUpdateDataForDrizzle,
} from './mappers';

// --- Exportaciones de Transformer ---
// (No hay transformer.ts para Place, ya que la lógica está en mappers)

// --- Exportaciones de Serializers ---
// (No hay serializers.ts para Place)
