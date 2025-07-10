/**
 * @file Punto de entrada para los transformadores de la entidad Document.
 * @module transformers/document
 * @description Exporta funciones de transformación, validación y serialización para Document.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Transformadores principales ---
export { toDocumentWithStats, toDocumentWithStatsList } from './mappers';
// --- Schema de Drizzle ---
export { type DocumentInsert, type DocumentSchema, documentsTable } from './schema.ts';
// --- Serializadores ---
export {
	serializeDocumentBase,
	serializeDocumentContent,
	serializeDocumentList,
	serializeDocumentWithStats,
} from './serializers';
// --- Validadores y esquemas ---
export {
	type DocumentBase,
	type DocumentCreateInput,
	type DocumentSearchInput,
	type DocumentStatistics,
	type DocumentUpdateInput,
	type DocumentWithStats,
	documentBaseSchema,
	documentCreateSchema,
	documentSearchSchema,
	documentStatisticsSchema,
	documentUpdateSchema,
	documentWithStatsSchema,
} from './validators';
