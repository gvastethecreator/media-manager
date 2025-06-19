/**
 * @file Exportaciones principales de tipos para la entidad JsonFile
 * @module types/entities/json-file
 */

// Exportar el esquema de validación
export { jsonFileSchema } from './json-file.schema';
// Exportar los tipos principales
export type {
    JsonFileBase,
    JsonFileComplete,
    JsonFileCreateInput,
    JsonFileUpdateInput
} from './types';

