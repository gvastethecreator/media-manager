/**
 * @file Exportaciones principales de tipos para la entidad JsonFile
 * @module types/entities/json-file
 */

// Exportar el esquema de validación
export { jsonFileSchema } from './json-file.schema';

// Exportar los tipos principales
export type {
    JsonFile,
    JsonFileBase, JsonFileComplete, JsonFileCounts, JsonFileCreateInput, JsonFileFilters, JsonFileFormData, JsonFileRelationInput, JsonFileRelations, JsonFileSearchOptions,
    JsonFileSearchResult, JsonFileUpdateInput, JsonFileWithCounts, JsonFileWithRelations
} from './types';

// Alias para retrocompatibilidad
export type { JsonFileComplete as JsonFile } from './types';

