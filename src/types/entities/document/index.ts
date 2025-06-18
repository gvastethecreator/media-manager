/**
 * @file Exportaciones principales de tipos para la entidad Document
 * @module types/entities/document
 */

// Exportar los tipos principales
export type {
    DocumentBase,
    DocumentCreateInput,
    DocumentUpdateInput
} from './types';

// Exportar el esquema de validación
export { documentSchema } from './document.schema';
