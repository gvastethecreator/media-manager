/**
 * @file Punto de entrada para los transformadores de la entidad File.
 * @module transformers/file
 * @description Exporta funciones de transformación, validación y serialización para File.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Filtros ---
export {
	applyFileFilters,
	applyFileFiltersAndSort,
	applySortToFiles,
} from './filters';
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
// --- Las siguientes funciones están implementadas en el módulo utils ---
export {
	determineFileType,
	determineMimeType,
	generateFileId,
	serializeDirectoryContents,
	serializeFileOperationResult,
} from './utils';
// Server-only helpers (no se deben usar en cliente)
// Nota: no reexportamos helpers server-only desde el barrel para evitar que código cliente
// los importe accidentalmente. Importar directamente desde './utils.server' cuando sea necesario en server.
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
