/**
 * @file Funciones auxiliares para la entidad Collection
 * @module utils/collection/helpers
 */

import type { CollectionExtended } from '@/types/entities/collection';
import { CollectionSortOption } from '@/types/entities/collection';

/**
 * Ordena un array de colecciones según la opción de ordenación
 * @param collections Array de colecciones a ordenar
 * @param sortOption Opción de ordenación
 * @returns Array ordenado de colecciones
 */
export function sortCollections(
	collections: CollectionExtended[],
	sortOption: CollectionSortOption | string
): CollectionExtended[] {
	const clonedCollections = [...collections];

	switch (sortOption) {
		case CollectionSortOption.NAME_ASC:
			return clonedCollections.sort((a, b) => (a as any).name.localeCompare((b as any).name));

		case CollectionSortOption.NAME_DESC:
			return clonedCollections.sort((a, b) => (b as any).name.localeCompare((a as any).name));

		case CollectionSortOption.DATE_ASC:
			return clonedCollections.sort(
				(a, b) => new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
			);

		case CollectionSortOption.DATE_DESC:
			return clonedCollections.sort(
				(a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime()
			);

		case CollectionSortOption.ITEMS_ASC:
			return clonedCollections.sort((a, b) => (a.imageCount || 0) - (b.imageCount || 0));

		case CollectionSortOption.ITEMS_DESC:
			return clonedCollections.sort((a, b) => (b.imageCount || 0) - (a.imageCount || 0));

		case CollectionSortOption.PRICE_ASC:
			return clonedCollections.sort((a, b) => ((a as any).price || 0) - ((b as any).price || 0));

		case CollectionSortOption.PRICE_DESC:
			return clonedCollections.sort((a, b) => ((b as any).price || 0) - ((a as any).price || 0));

		default:
			return clonedCollections;
	}
}

/**
 * Agrupa colecciones por una propiedad específica
 * @param collections Array de colecciones a agrupar
 * @param groupBy Propiedad por la que agrupar
 * @returns Objeto con grupos de colecciones
 */
export function groupCollections(
	collections: CollectionExtended[],
	groupBy: 'category' | 'rarity' | 'platform' | null
): Record<string, CollectionExtended[]> {
	if (!groupBy) {
		return { all: collections };
	}

	return collections.reduce(
		(groups, collection) => {
			const key = ((collection as any)[groupBy] as string) || 'other';

			if (!groups[key]) {
				groups[key] = [];
			}

			groups[key].push(collection);
			return groups;
		},
		{} as Record<string, CollectionExtended[]>
	);
}

/**
 * Calcula el valor total de todas las colecciones
 * @param collections Array de colecciones
 * @returns Valor total
 */
export function calculateTotalValue(collections: CollectionExtended[]): number {
	return collections.reduce((total, collection) => {
		return total + ((collection as any).price || 0);
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
	} catch (error) {
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
