/**
 * @file Exportaciones principales de tipos para la entidad JsonFile
 * @module types/entities/json-file
 */

// Exportar los tipos principales
export type {
    JsonFileBase,
    JsonFileCreateInput,
    JsonFileUpdateInput
} from './types';

// Exportar el esquema de validación
export { jsonFileSchema } from './json-file.schema';
