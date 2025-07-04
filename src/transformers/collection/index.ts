/**
 * @file Punto de entrada para los transformadores de la entidad Collection.
 * @module transformers/collection
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Collection.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// 🗺️ Mappers - Transformaciones básicas entre tipos
export { toCollectionWithStats } from './mappers';

// 🔄 Transformers - Conversiones desde Drizzle
export { fromDrizzleCollection, fromDrizzleCollections } from './transformer';

// 📦 Serializers - Manejo de campos complejos JSON
export {
	deserializeFilters,
	deserializeSortBy,
	deserializeEditions,
	serializeFilters,
	serializeSortBy,
	serializeEditions,
} from './serializers';

// 🛡️ Validators - Validaciones con Zod
export {
	validateCollectionBase,
	validateCollectionStatistics,
	validateCollectionWithStats,
	validateCollectionCounts,
	validateCollectionCreate,
	validateCollectionUpdate,
	sanitizeCollectionData,
} from './validators';

// 📋 Schemas - Esquemas Zod para validación
export {
	CollectionBaseSchema,
	CollectionStatisticsSchema,
	CollectionWithStatsSchema,
	CollectionCountsSchema,
	CollectionCreateSchema,
	CollectionUpdateSchema,
} from './schema';
