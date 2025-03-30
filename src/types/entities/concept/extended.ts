import type { ConceptBase, ConceptComplete, ConceptStats, ConceptWithRelationsComplete } from './index';

/**
 * Filtros para conceptos
 */
export interface ConceptFilters {
	search?: string;
	category?: string | null;
	tags?: string[];
	onlyFavorites?: boolean;
}

/**
 * Interfaz extendida para concepto con propiedades adicionales para UI
 * @deprecated Use ConceptExtendedComplete instead
 */
export interface ConceptExtended extends ConceptBase {
	parsedTags?: string[];
	previewContent?: string;
	lastUpdated?: Date;
	stats?: ConceptStats;
}

/**
 * Interfaz para un concepto con propiedades extendidas y campos JSON deserializados
 */
export interface ConceptExtendedComplete extends ConceptComplete {
	previewContent?: string;
	lastUpdated?: Date;
	stats?: ConceptStats;
}

/**
 * Interfaz para un concepto con relaciones, propiedades extendidas y campos JSON deserializados
 */
export interface ConceptWithRelationsExtendedComplete extends ConceptWithRelationsComplete {
	previewContent?: string;
	lastUpdated?: Date;
	stats?: ConceptStats;
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
