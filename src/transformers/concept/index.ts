/**
 * @file Punto de entrada para los transformadores de la entidad Concept.
 * @module transformers/concept
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Concept.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// 🗺️ Mappers - Transformaciones básicas entre tipos
export {
	toCreateDataDrizzle,
	toUpdateDataDrizzle,
	createOrderByDrizzle,
	createFilterDrizzle,
	toSearchOptionsDrizzle,
	processConcepts,
} from './mappers';

// 🔄 Transformers - Conversiones desde Drizzle
export {
	fromDrizzleConcept,
	fromDrizzleConcepts,
	fromDrizzleConceptWithRelations,
} from './transformer';

// 📦 Serializers - Manejo de campos complejos JSON
export { deserializeTags, serializeTags } from './serializers';

// 🛡️ Validators - Validaciones con Zod
export {
	validateConceptBase,
	validateConceptStatistics,
	validateConceptWithStats,
	validateConceptCounts,
	validateConceptCreate,
	validateConceptUpdate,
	validateConceptFilters,
	validateConceptSortOptions,
	sanitizeConceptData,
} from './validators';

// 📋 Schemas - Esquemas Zod para validación
export {
	ConceptBaseSchema,
	ConceptStatisticsSchema,
	ConceptWithStatsSchema,
	ConceptCountsSchema,
	ConceptCreateSchema,
	ConceptUpdateSchema,
	ConceptFiltersSchema,
	ConceptSortOptionsSchema,
} from './schema';
