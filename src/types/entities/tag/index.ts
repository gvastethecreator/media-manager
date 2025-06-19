/**
 * @file Exportaciones principales de tipos para la entidad Tag
 * @module types/entities/tag
 * @description Exportaciones centralizadas para tipos de Tag
 * @updated 2025-06-21
 */

// Exportar todos los tipos canónicos
export * from './types';

// Tipo principal para Tag (para compatibilidad con código legacy)
export type { Tag, TagWithRelations } from './types';

// Exportar esquemas de validación si existen
export * from './schema';

/**
 * 📊 Configuración visual de tag
 * Para compatibilidad con código existente
 */
export interface TagVisualConfig {
	view: string;
	sortBy: string;
	filters: string;
	lastViewedId: string | null;
	expandedIds: string[];
	selectedIds: string[];
}
