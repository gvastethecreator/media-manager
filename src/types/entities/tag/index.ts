/**
 * @file Exportaciones principales de tipos para la entidad Tag
 * @module types/entities/tag
 * @description Exportaciones centralizadas para tipos de Tag
 * @updated 2025-06-21
 */

// Exportar esquemas de validación si existen
export * from './schema';

// Tipo principal para Tag (para compatibilidad con código legacy)
export type { Tag, TagWithRelations } from './types';
// Exportar todos los tipos canónicos
export * from './types';
