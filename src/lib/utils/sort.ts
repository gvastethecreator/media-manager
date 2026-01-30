/**
 * @file Utilidades para ordenamiento
 * @module lib/utils/sort
 */

export type SortDirection = 'asc' | 'desc';

export interface SortOption<T = string> {
	field: T;
	direction: SortDirection;
	label: string;
}

export interface SortConfig<T = string> {
	field: T;
	direction: SortDirection;
}

/**
 * Ordena un array por una propiedad específica
 */
export function sortBy<T>(array: T[], field: keyof T, direction: SortDirection = 'asc'): T[] {
	return [...array].sort((a, b) => {
		const aValue = a[field];
		const bValue = b[field];

		if (aValue === bValue) {
			return 0;
		}

		let comparison = 0;

		if (typeof aValue === 'string' && typeof bValue === 'string') {
			comparison = aValue.localeCompare(bValue);
		} else if (typeof aValue === 'number' && typeof bValue === 'number') {
			comparison = aValue - bValue;
		} else if (aValue instanceof Date && bValue instanceof Date) {
			comparison = aValue.getTime() - bValue.getTime();
		} else {
			comparison = String(aValue).localeCompare(String(bValue));
		}

		return direction === 'desc' ? -comparison : comparison;
	});
}

/**
 * Ordena por múltiples campos
 */
export function sortByMultiple<T>(array: T[], sortConfigs: SortConfig<keyof T>[]): T[] {
	return [...array].sort((a, b) => {
		for (const config of sortConfigs) {
			const aValue = a[config.field];
			const bValue = b[config.field];

			if (aValue === bValue) {
				continue;
			}

			let comparison = 0;

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				comparison = aValue.localeCompare(bValue);
			} else if (typeof aValue === 'number' && typeof bValue === 'number') {
				comparison = aValue - bValue;
			} else if (aValue instanceof Date && bValue instanceof Date) {
				comparison = aValue.getTime() - bValue.getTime();
			} else {
				comparison = String(aValue).localeCompare(String(bValue));
			}

			if (comparison !== 0) {
				return config.direction === 'desc' ? -comparison : comparison;
			}
		}

		return 0;
	});
}

/**
 * Invierte la dirección de ordenamiento
 */
export function toggleSortDirection(direction: SortDirection): SortDirection {
	return direction === 'asc' ? 'desc' : 'asc';
}

/**
 * Opciones de ordenamiento comunes para entidades
 */
export const commonSortOptions = {
	name: { field: 'name', direction: 'asc' as const, label: 'Nombre (A-Z)' },
	nameDesc: { field: 'name', direction: 'desc' as const, label: 'Nombre (Z-A)' },
	createdAt: { field: 'createdAt', direction: 'desc' as const, label: 'Más recientes' },
	createdAtAsc: { field: 'createdAt', direction: 'asc' as const, label: 'Más antiguos' },
	updatedAt: { field: 'updatedAt', direction: 'desc' as const, label: 'Últimos modificados' },
	updatedAtAsc: { field: 'updatedAt', direction: 'asc' as const, label: 'Primeros modificados' },
};

/**
 * Opciones de ordenamiento para imágenes
 */
export const imageSortOptions = {
	...commonSortOptions,
	size: { field: 'size', direction: 'desc' as const, label: 'Tamaño (Mayor a menor)' },
	sizeAsc: { field: 'size', direction: 'asc' as const, label: 'Tamaño (Menor a mayor)' },
	width: { field: 'width', direction: 'desc' as const, label: 'Ancho (Mayor a menor)' },
	height: { field: 'height', direction: 'desc' as const, label: 'Alto (Mayor a menor)' },
};

/**
 * Opciones de ordenamiento para tags
 */
export const tagSortOptions = {
	...commonSortOptions,
	popularity: { field: 'popularity', direction: 'desc' as const, label: 'Más populares' },
	usage: { field: 'totalRelations', direction: 'desc' as const, label: 'Más usados' },
};
