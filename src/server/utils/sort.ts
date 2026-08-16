/**
 * @file Sort Utilities
 * @module server/utils/sort
 * @description Funciones de ordenamiento reutilizables para route handlers.
 * Extraídas de videos.effect.ts para evitar duplicación y mantener los handlers delgados.
 */

export function normalizeSortValue(value: unknown): number | string {
	if (value instanceof Date) {
		return value.getTime();
	}

	if (typeof value === 'number') {
		return value;
	}

	if (typeof value === 'string') {
		return value.toLowerCase();
	}

	if (typeof value === 'boolean') {
		return value ? 1 : 0;
	}

	if (value && typeof value === 'object' && 'getTime' in value && typeof value.getTime === 'function') {
		return value.getTime();
	}

	return 0;
}

export function sortEntitiesByField<T extends Record<string, unknown>>(
	items: T[],
	sortBy: string,
	sortOrder: 'asc' | 'desc'
): T[] {
	const direction = sortOrder === 'asc' ? 1 : -1;

	return [...items].sort((left, right) => {
		const leftValue = normalizeSortValue(left[sortBy]);
		const rightValue = normalizeSortValue(right[sortBy]);

		if (leftValue < rightValue) {
			return -1 * direction;
		}

		if (leftValue > rightValue) {
			return 1 * direction;
		}

		return 0;
	});
}
