/**
 * @file Punto de entrada para los transformadores de la entidad File.
 * @module transformers/file
 * @description Exporta funciones de transformación, validación y serialización para File.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Transformadores principales ---
export {
	groupFilesByType,
	toFileWithStats,
	toFileWithStatsList,
} from './mappers';
// --- Schema de Drizzle ---
export {
	type FileInsert,
	type FileSchema,
	filesTable,
	fileTypeEnum,
} from './schema';
// --- Serializadores ---
export {
	serializeDirectoryStructure,
	serializeFileBase,
	serializeFileGroupedStats,
	serializeFileList,
	serializeFileWithStats,
} from './serializers';
// --- Validadores y esquemas ---
export {
	type FileBase,
	type FileCreateInput,
	type FileSearchInput,
	type FileStatistics,
	type FileUpdateInput,
	type FileWithStats,
	fileBaseSchema,
	fileCreateSchema,
	fileSearchSchema,
	fileStatisticsSchema,
	fileUpdateSchema,
	fileWithStatsSchema,
} from './validators';
