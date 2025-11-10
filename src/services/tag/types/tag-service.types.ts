/**
 * @file Tipos y definiciones para el servicio de etiquetas
 * @module services/tag/types
 */

import type { TagWithStats } from '@/types/entities/tag';

/**
 * Opciones para la consulta de etiquetas
 */
export interface GetTagsOptions {
	includeArchived?: boolean;
	search?: string;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	onlyFavorites?: boolean;
}

/**
 * Resultado de la consulta de etiquetas
 */
export interface GetTagsResult {
	tags: TagWithStats[];
	total: number;
}

/**
 * Clase de error personalizada para operaciones de Tag
 */
export class TagServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'TagServiceError';
	}
}

/**
 * Constantes de rutas para revalidación
 */
export const REVALIDATE_PATHS = ['/dashboard/tags', '/dashboard/images', '/dashboard/stats', '/api/tags'];
