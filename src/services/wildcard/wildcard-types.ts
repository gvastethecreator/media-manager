/**
 * @file Tipos compartidos para operaciones de wildcards
 * @module services/wildcard/wildcard-types
 */

import type { WildcardWithStats } from '@/types/entities/wildcard';

/**
 * Opciones para obtener wildcards
 */
export interface GetWildcardsOptions {
	search?: string;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	onlyFavorites?: boolean;
	parentId?: string | null;
}

/**
 * Resultado de obtener wildcards
 */
export interface GetWildcardsResult {
	wildcards: WildcardWithStats[];
	total: number;
}

// Re-export tipos principales
export type { WildcardWithStats };
