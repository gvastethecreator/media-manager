/**
 * @file Utilidades de ordenamiento para File Browser
 * @module file-browser-new/utils/sorting
 */

import type { BrowserItem } from '../types';
import type { SortOption } from '../types';

/**
 * Obtiene valor de un campo para ordenamiento
 */
function getFieldValue(item: BrowserItem, field: string): unknown {
	switch (field) {
		case 'name':
			return item.name?.toLowerCase() ?? '';
		case 'size':
			return item.size ?? 0;
		case 'createdAt':
		case 'created':
		case 'date':
			return normalizeDate(item.createdAt);
		case 'type':
		case 'entityType':
			return item.entityType;
		default:
			return (item as unknown as Record<string, unknown>)[field];
	}
}

/**
 * Normaliza fecha a timestamp numérico
 */
function normalizeDate(value: Date | string | number | undefined): number {
	if (!value) return 0;
	if (typeof value === 'number') return value;
	if (value instanceof Date) return value.getTime();
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Compara dos valores para ordenamiento
 */
function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
	const multiplier = direction === 'asc' ? 1 : -1;

	// Null/undefined al final
	if (a == null && b == null) return 0;
	if (a == null) return 1;
	if (b == null) return -1;

	// Comparación por tipo
	if (typeof a === 'string' && typeof b === 'string') {
		return a.localeCompare(b) * multiplier;
	}

	if (typeof a === 'number' && typeof b === 'number') {
		return (a - b) * multiplier;
	}

	// Fallback a string
	return String(a).localeCompare(String(b)) * multiplier;
}

/**
 * Ordena items por un criterio único
 */
export function sortBySingle(items: BrowserItem[], sort: SortOption): BrowserItem[] {
	if (!items.length || !sort.field) return items;

	return [...items].sort((a, b) => {
		const aVal = getFieldValue(a, sort.field);
		const bVal = getFieldValue(b, sort.field);
		return compareValues(aVal, bVal, sort.direction);
	});
}

/**
 * Ordena items por múltiples criterios
 */
export function sortByMultiple(items: BrowserItem[], sorts: SortOption[]): BrowserItem[] {
	if (!items.length || !sorts.length) return items;

	return [...items].sort((a, b) => {
		for (const sort of sorts) {
			const aVal = getFieldValue(a, sort.field);
			const bVal = getFieldValue(b, sort.field);
			const result = compareValues(aVal, bVal, sort.direction);
			if (result !== 0) return result;
		}
		return 0;
	});
}

/**
 * Ordena con carpetas primero
 */
export function sortWithFoldersFirst(items: BrowserItem[], sorts: SortOption[]): BrowserItem[] {
	const folders = items.filter((it) => it.entityType === 'folder');
	const files = items.filter((it) => it.entityType !== 'folder');

	const sortedFolders = sorts.length ? sortByMultiple(folders, sorts) : folders;
	const sortedFiles = sorts.length ? sortByMultiple(files, sorts) : files;

	return [...sortedFolders, ...sortedFiles];
}
