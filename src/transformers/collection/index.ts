/**
 * @file Punto de entrada para los transformadores de la entidad Collection.
 * @module transformers/collection
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Collection.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// 🗺️ Mappers - Transformaciones básicas entre tipos
export { toCollectionWithStats } from './mappers';
// 📋 Schemas - Esquemas Zod para validación
export {
	CollectionBaseSchema,
	CollectionCountsSchema,
	CollectionCreateSchema,
	CollectionStatisticsSchema,
	CollectionUpdateSchema,
	CollectionWithStatsSchema,
} from './schema';

// 📦 Serializers - Manejo de campos complejos JSON
export {
	deserializeEditions,
	deserializeFilters,
	deserializeSortBy,
	serializeEditions,
	serializeFilters,
	serializeSortBy,
} from './serializers';
// 🔄 Transformers - Conversiones desde Drizzle
export { fromDrizzleCollection, fromDrizzleCollections } from './transformer';
// 🛡️ Validators - Validaciones con Zod
export {
	sanitizeCollectionData,
	validateCollectionBase,
	validateCollectionCounts,
	validateCollectionCreate,
	validateCollectionStatistics,
	validateCollectionUpdate,
	validateCollectionWithStats,
} from './validators';
