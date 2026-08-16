/**
 * @file Enums y constantes principales para la entidad Wildcard
 * @module types/entities/wildcard/types
 */

// Re-export tipo base para compatibilidad
export type { WildcardWithStats } from './base';

import { WildcardSortCriteria, WildcardViewMode } from './enums';

// Re-export enums
export { WildcardSortCriteria, WildcardViewMode } from './enums';

/**
 * Mapa de propiedades de ordenamiento para wildcards
 */
export const WILDCARD_SORT_PROPERTY_MAP: Record<WildcardSortCriteria, string> = {
	[WildcardSortCriteria.NAME_ASC]: 'name',
	[WildcardSortCriteria.NAME_DESC]: 'name',
	[WildcardSortCriteria.USAGE_ASC]: 'usage',
	[WildcardSortCriteria.USAGE_DESC]: 'usage',
	[WildcardSortCriteria.CREATED_ASC]: 'createdAt',
	[WildcardSortCriteria.CREATED_DESC]: 'createdAt',
	[WildcardSortCriteria.UPDATED_ASC]: 'updatedAt',
	[WildcardSortCriteria.UPDATED_DESC]: 'updatedAt',
	[WildcardSortCriteria.CATEGORY_ASC]: 'category',
	[WildcardSortCriteria.CATEGORY_DESC]: 'category',
};
