/**
 * @file Funciones auxiliares para trabajar con colecciones
 * @module utils/collection/helpers
 */

import type { CollectionWithStats } from '@/types/entities/collection';
import { CollectionSortOption } from '@/types/entities/collection';

/**
 * Ordena un array de colecciones según la opción de ordenación
 * @param collections Array de colecciones a ordenar
 * @param sortOption Opción de ordenación
 * @returns Array ordenado de colecciones
 */
export function sortCollections(
	collections: CollectionWithStats[],
	sortOption: CollectionSortOption | string
): CollectionWithStats[] {
	const clonedCollections = [...collections];

	switch (sortOption) {
		case CollectionSortOption.NAME_ASC:
			return clonedCollections.sort((a, b) => a.name.localeCompare(b.name));

		case CollectionSortOption.NAME_DESC:
			return clonedCollections.sort((a, b) => b.name.localeCompare(a.name));

		case CollectionSortOption.DATE_ASC:
			return clonedCollections.sort(
				(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			);

		case CollectionSortOption.DATE_DESC:
			return clonedCollections.sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);

		case CollectionSortOption.ITEMS_ASC:
			return clonedCollections.sort((a, b) => (a.stats?.totalItems || 0) - (b.stats?.totalItems || 0));

		case CollectionSortOption.ITEMS_DESC:
			return clonedCollections.sort((a, b) => (b.stats?.totalItems || 0) - (a.stats?.totalItems || 0));

		case CollectionSortOption.PRICE_ASC:
			return clonedCollections.sort((a, b) => (a.price || 0) - (b.price || 0));

		case CollectionSortOption.PRICE_DESC:
			return clonedCollections.sort((a, b) => (b.price || 0) - (a.price || 0));

		default:
			return clonedCollections;
	}
}

/**
 * 📚 Filtra colecciones por múltiples criterios
 * @param collections Array de colecciones
 * @param filters Objeto con criterios de filtrado
 * @returns Array de colecciones filtradas
 */
export function filterCollections(
	collections: CollectionWithStats[],
	filters: any
): CollectionWithStats[] {
	if (!collections || collections.length === 0) {
		return [];
	}

	return collections.filter((collection) => {
		// Filtrar por categoría
		if (filters.category && collection.category !== filters.category) {
			return false;
		}

		// Filtrar por plataforma
		if (filters.platform && collection.platform !== filters.platform) {
			return false;
		}

		// Filtrar por favoritos
		if (filters.isFavorite !== undefined && collection.isFavorite !== filters.isFavorite) {
			return false;
		}

		// Filtrar por rango de precios
		if (filters.minPrice !== undefined && (collection.price || 0) < filters.minPrice) {
			return false;
		}

		if (filters.maxPrice !== undefined && (collection.price || 0) > filters.maxPrice) {
			return false;
		}

		// Filtrar por número de imágenes
		if (filters.minImages !== undefined) {
			const imageCount = collection.stats?.totalImages || 0;
			if (imageCount < filters.minImages) {
				return false;
			}
		}

		if (filters.maxImages !== undefined) {
			const imageCount = collection.stats?.totalImages || 0;
			if (imageCount > filters.maxImages) {
				return false;
			}
		}

		return true;
	});
}

/**
 * 📚 Agrupa colecciones por un campo específico
 * @param collections Array de colecciones
 * @param groupByField Campo por el cual agrupar
 * @returns Objeto con colecciones agrupadas
 */
export function groupCollectionsByField(
	collections: CollectionWithStats[],
	groupByField: keyof CollectionWithStats
): Record<string, CollectionWithStats[]> {
	if (!collections || collections.length === 0) {
		return {};
	}

	return collections.reduce(
		(groups, collection) => {
			const fieldValue = collection[groupByField];
			const key = fieldValue ? String(fieldValue) : 'Sin valor';

			if (!groups[key]) {
				groups[key] = [];
			}

			groups[key].push(collection);
			return groups;
		},
		{} as Record<string, CollectionWithStats[]>
	);
}

/**
 * 📚 Calcula el valor total de las colecciones
 * @param collections Array de colecciones
 * @returns Valor total
 */
export function calculateTotalValue(collections: CollectionWithStats[]): number {
	if (!collections || collections.length === 0) {
		return 0;
	}

	return collections.reduce((total, collection) => {
		return total + (collection.price || 0);
	}, 0);
}

/**
 * Valida si una URL es válida para una colección
 * @param url URL a validar
 * @returns Booleano indicando si es válida
 */
export function isValidCollectionUrl(url: string): boolean {
	if (!url) return true; // URLs vacías son válidas (opcionales)

	try {
		new URL(url);
		return true;
	} catch (_error) {
		return false;
	}
}

/**
 * Genera un slug basado en el nombre de la colección
 * @param name Nombre de la colección
 * @returns Slug para uso en URLs
 */
export function generateCollectionSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^\w\s-]/g, '') // Remover caracteres especiales
		.replace(/\s+/g, '-') // Reemplazar espacios con guiones
		.replace(/--+/g, '-') // Evitar guiones múltiples
		.trim();
}
