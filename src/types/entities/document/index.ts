/**
 * @file Exportaciones principales de tipos para la entidad Document
 * @module types/entities/document
 */

// Exportar el esquema de validación
export { documentSchema } from './document.schema';
// Exportar los tipos principales
export type {
    DocumentBase,
    DocumentComplete,
    DocumentCreateInput,
    DocumentUpdateInput
} from './types';

