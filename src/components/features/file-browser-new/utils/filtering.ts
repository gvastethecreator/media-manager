/**
 * @file Utilidades de filtrado para File Browser
 * @module file-browser-new/utils/filtering
 */

import type { BrowserItem, FilterOption } from '../types';

/**
 * Obtiene valor de un campo para filtrado
 */
function getFieldValue(item: BrowserItem, field: string): unknown {
	switch (field) {
		case 'name':
			return item.name ?? '';
		case 'type':
		case 'entityType':
			return item.entityType;
		case 'size':
			return item.size ?? 0;
		default:
			return (item as unknown as Record<string, unknown>)[field];
	}
}

/**
 * Evalúa un filtro contra un item
 */
function evaluateFilter(item: BrowserItem, filter: FilterOption): boolean {
	const value = getFieldValue(item, filter.field);
	const filterValue = filter.value;

	switch (filter.operator) {
		case 'eq':
			return value === filterValue;
		case 'neq':
			return value !== filterValue;
		case 'gt':
			return typeof value === 'number' && typeof filterValue === 'number' && value > filterValue;
		case 'gte':
			return typeof value === 'number' && typeof filterValue === 'number' && value >= filterValue;
		case 'lt':
			return typeof value === 'number' && typeof filterValue === 'number' && value < filterValue;
		case 'lte':
			return typeof value === 'number' && typeof filterValue === 'number' && value <= filterValue;
		case 'contains':
			return (
				typeof value === 'string' &&
				typeof filterValue === 'string' &&
				value.toLowerCase().includes(filterValue.toLowerCase())
			);
		case 'startsWith':
			return (
				typeof value === 'string' &&
				typeof filterValue === 'string' &&
				value.toLowerCase().startsWith(filterValue.toLowerCase())
			);
		case 'endsWith':
			return (
				typeof value === 'string' &&
				typeof filterValue === 'string' &&
				value.toLowerCase().endsWith(filterValue.toLowerCase())
			);
		default:
			return true;
	}
}

/**
 * Filtra items por texto de búsqueda
 */
export function filterBySearch(items: BrowserItem[], query: string): BrowserItem[] {
	if (!query.trim()) return items;

	const normalizedQuery = query.toLowerCase().trim();

	return items.filter((item) => {
		const name = (item.name ?? '').toLowerCase();
		return name.includes(normalizedQuery);
	});
}

/**
 * Filtra items por tipo de entidad
 */
export function filterByEntityType(items: BrowserItem[], types: string[]): BrowserItem[] {
	if (!types.length) return items;
	return items.filter((item) => types.includes(item.entityType));
}

/**
 * Aplica múltiples filtros (AND)
 */
export function applyFilters(items: BrowserItem[], filters: FilterOption[]): BrowserItem[] {
	if (!filters.length) return items;
	return items.filter((item) => filters.every((filter) => evaluateFilter(item, filter)));
}

/**
 * Filtra items sintéticos (como "..")
 */
export function filterSynthetic(items: BrowserItem[]): BrowserItem[] {
	return items.filter((item) => !item.isSynthetic);
}

/**
 * Pipeline de filtrado completo
 */
export interface FilterPipeline {
	search?: string;
	entityTypes?: string[];
	filters?: FilterOption[];
	excludeSynthetic?: boolean;
}

export function applyFilterPipeline(items: BrowserItem[], pipeline: FilterPipeline): BrowserItem[] {
	let result = items;

	if (pipeline.search) {
		result = filterBySearch(result, pipeline.search);
	}

	if (pipeline.entityTypes?.length) {
		result = filterByEntityType(result, pipeline.entityTypes);
	}

	if (pipeline.filters?.length) {
		result = applyFilters(result, pipeline.filters);
	}

	if (pipeline.excludeSynthetic) {
		result = filterSynthetic(result);
	}

	return result;
}
