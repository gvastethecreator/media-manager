/**
 * @file Punto de entrada para los transformadores de la entidad Document.
 * @module transformers/document
 * @description Exporta funciones de transformación, validación y serialización para Document.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Transformadores principales ---
export { toDocumentWithStats, toDocumentWithStatsList } from './mappers';

// --- Serializadores ---
export {
	serializeDocumentBase,
	serializeDocumentWithStats,
	serializeDocumentList,
	serializeDocumentContent,
} from './serializers';

// --- Validadores y esquemas ---
export {
	documentBaseSchema,
	documentStatisticsSchema,
	documentWithStatsSchema,
	documentCreateSchema,
	documentUpdateSchema,
	documentSearchSchema,
	type DocumentBase,
	type DocumentStatistics,
	type DocumentWithStats,
	type DocumentCreateInput,
	type DocumentUpdateInput,
	type DocumentSearchInput,
} from './validators';

// --- Schema de Drizzle ---
export { documentsTable, type DocumentSchema, type DocumentInsert } from './schema';
