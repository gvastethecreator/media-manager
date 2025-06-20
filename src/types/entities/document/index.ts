/**
 * @file Exportaciones principales de tipos para la entidad Document
 * @module types/entities/document
 */

// Exportar el esquema de validación
export { documentSchema } from './document.schema';

// Exportar los tipos principales
export type {
    Document,
    DocumentBase, DocumentComplete, DocumentCounts, DocumentCreateInput, DocumentFilters, DocumentFormData, DocumentRelationInput, DocumentRelations, DocumentSearchOptions,
    DocumentSearchResult, DocumentUpdateInput, DocumentWithCounts, DocumentWithRelations
} from './types';

