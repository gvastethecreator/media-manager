import type { ConceptBase, ConceptStats } from './base';

/**
 * Interfaz extendida para concepto con propiedades adicionales para UI
 */
export interface ConceptExtended extends ConceptBase {
	parsedTags?: string[];
	previewContent?: string;
	lastUpdated?: Date;
	stats?: ConceptStats;
}

/**
 * Interfaz para filtros de conceptos
 */
export interface ConceptFilters {
	search?: string;
	category?: string;
	tags?: string[];
	onlyFavorites?: boolean;
	startDate?: Date;
	endDate?: Date;
}

/**
 * Opciones de ordenación para conceptos
 */
export type ConceptSortOption =
	| 'name_asc'
	| 'name_desc'
	| 'created_asc'
	| 'created_desc'
	| 'updated_asc'
	| 'updated_desc'
	| 'category_asc'
	| 'category_desc'
	| 'favorites_first';

/**
 * Interfaz para respuesta paginada de conceptos
 */
export interface ConceptsPaginatedResponse {
	items: ConceptExtended[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
