/**
 * @file Tipos para el servicio de etiquetas
 * @module services/tag/tag-types
 * @description Interfaces y tipos compartidos para operaciones de tags
 */

import type { TagWithStats } from '@/types/entities/tag';

/**
 * Opciones para obtener etiquetas con filtros
 */
export interface GetTagsOptions {
	includeArchived?: boolean;
	onlyFavorites?: boolean;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	search?: string;
}

/**
 * Resultado de búsqueda de etiquetas
 */
export interface GetTagsResult {
	tags: TagWithStats[];
	total: number;
}
