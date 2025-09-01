/**
 * @file Punto de entrada para los transformadores de la entidad Concept.
 * @module transformers/concept
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Concept.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// 🎯 Adaptadores - Para componentes de lista estandarizados
export {
	adaptConceptsWithStats,
	adaptConceptWithStats,
	defaultConceptStats,
} from './adapter';

// 🗺️ Mappers - Transformaciones básicas entre tipos
export {
	createFilterDrizzle,
	createOrderByDrizzle,
	processConcepts,
	toCreateDataDrizzle,
	toSearchOptionsDrizzle,
	toUpdateDataDrizzle,
} from './mappers';
// 📋 Schemas - Esquemas Zod para validación
export {
	ConceptBaseSchema,
	ConceptCountsSchema,
	ConceptCreateSchema,
	ConceptFiltersSchema,
	ConceptSortOptionsSchema,
	ConceptStatisticsSchema,
	ConceptUpdateSchema,
	ConceptWithStatsSchema,
} from './schema';

// 📦 Serializers - Manejo de campos complejos JSON
export { deserializeTags, serializeTags } from './serializers';
// 🔄 Transformers - Conversiones desde Drizzle
export {
	fromDrizzleConcept,
	fromDrizzleConcepts,
	fromDrizzleConceptWithRelations,
} from './transformer';
// 🛡️ Validators - Validaciones con Zod
export {
	sanitizeConceptData,
	validateConceptBase,
	validateConceptCounts,
	validateConceptCreate,
	validateConceptFilters,
	validateConceptSortOptions,
	validateConceptStatistics,
	validateConceptUpdate,
	validateConceptWithStats,
} from './validators';
