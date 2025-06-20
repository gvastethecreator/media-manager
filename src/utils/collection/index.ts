/**
 * @file Índice de exportación para utilidades de Collection
 * @module utils/collection
 */

export * from './helpers';
export * from './validators';

import type { CollectionExtended } from '@/types/entities/collection';

/**
 * 📚 Ordena las colecciones según la opción especificada
 * @param collections Array de colecciones a ordenar
 * @param sortOption Opción de ordenamiento (ej: 'name_asc', 'price_desc')
 * @returns Array de colecciones ordenadas
 */
export function sortCollections(collections: CollectionExtended[], sortOption: string): CollectionExtended[] {
	if (!collections || collections.length === 0) {
		return [];
	}

	const [field, direction] = sortOption.split('_');
	const isDesc = direction === 'desc';

	return [...collections].sort((a, b) => {
		let aValue: any;
		let bValue: any;

		switch (field) {
			case 'name':
				aValue = a.name?.toLowerCase() || '';
				bValue = b.name?.toLowerCase() || '';
				break;
			case 'price':
				aValue = a.price || 0;
				bValue = b.price || 0;
				break;
			case 'created':
			case 'createdAt':
				aValue = new Date(a.createdAt).getTime();
				bValue = new Date(b.createdAt).getTime();
				break;
			case 'updated':
			case 'updatedAt':
				aValue = new Date(a.updatedAt).getTime();
				bValue = new Date(b.updatedAt).getTime();
				break;
			case 'category':
				aValue = a.category?.toLowerCase() || '';
				bValue = b.category?.toLowerCase() || '';
				break;
			case 'platform':
				aValue = a.platform?.toLowerCase() || '';
				bValue = b.platform?.toLowerCase() || '';
				break;
			case 'rarity':
				aValue = a.rarity?.toLowerCase() || '';
				bValue = b.rarity?.toLowerCase() || '';
				break;
			default:
				aValue = a.name?.toLowerCase() || '';
				bValue = b.name?.toLowerCase() || '';
		}

		// Comparación
		let result = 0;
		if (typeof aValue === 'string') {
			result = aValue.localeCompare(bValue);
		} else {
			result = aValue - bValue;
		}

		return isDesc ? -result : result;
	});
}

/**
 * 📚 Agrupa las colecciones según el criterio especificado
 * @param collections Array de colecciones a agrupar
 * @param groupBy Criterio de agrupamiento
 * @returns Objeto con grupos de colecciones
 */
export function groupCollections(
	collections: CollectionExtended[],
	groupBy: 'category' | 'rarity' | 'platform' | null
): Record<string, CollectionExtended[]> {
	if (!collections || collections.length === 0 || !groupBy) {
		return { Todas: collections || [] };
	}

	const groups: Record<string, CollectionExtended[]> = {};

	for (const collection of collections) {
		let groupKey: string;

		switch (groupBy) {
			case 'category':
				groupKey = collection.category || 'Sin categoría';
				break;
			case 'rarity':
				groupKey = collection.rarity || 'Sin rareza';
				break;
			case 'platform':
				groupKey = collection.platform || 'Sin plataforma';
				break;
			default:
				groupKey = 'Todas';
		}

		if (!groups[groupKey]) {
			groups[groupKey] = [];
		}
		groups[groupKey].push(collection);
	}

	// Ordenar los grupos por nombre
	const sortedGroups: Record<string, CollectionExtended[]> = {};
	const sortedKeys = Object.keys(groups).sort();

	for (const key of sortedKeys) {
		sortedGroups[key] = groups[key];
	}

	return sortedGroups;
}

/**
 * 📚 Filtra colecciones por término de búsqueda
 * @param collections Array de colecciones
 * @param searchTerm Término de búsqueda
 * @returns Array de colecciones filtradas
 */
export function filterCollectionsBySearch(collections: CollectionExtended[], searchTerm: string): CollectionExtended[] {
	if (!searchTerm.trim()) {
		return collections;
	}

	const term = searchTerm.toLowerCase();

	return collections.filter(
		(collection) =>
			collection.name.toLowerCase().includes(term) ||
			collection.description?.toLowerCase().includes(term) ||
			collection.category?.toLowerCase().includes(term) ||
			collection.platform?.toLowerCase().includes(term)
	);
}

/**
 * 📚 Obtiene estadísticas de las colecciones
 * @param collections Array de colecciones
 * @returns Objeto con estadísticas
 */
export function getCollectionStats(collections: CollectionExtended[]) {
	if (!collections || collections.length === 0) {
		return {
			total: 0,
			favorites: 0,
			withImages: 0,
			totalValue: 0,
			categories: {},
			platforms: {},
		};
	}

	const stats = {
		total: collections.length,
		favorites: 0,
		withImages: 0,
		totalValue: 0,
		categories: {} as Record<string, number>,
		platforms: {} as Record<string, number>,
	};

	for (const collection of collections) {
		// Favoritos
		if (collection.isFavorite) {
			stats.favorites++;
		}

		// Con imágenes
		if (collection.imageCount && collection.imageCount > 0) {
			stats.withImages++;
		}

		// Valor total
		if (collection.price) {
			stats.totalValue += collection.price;
		}

		// Categorías
		const category = collection.category || 'Sin categoría';
		stats.categories[category] = (stats.categories[category] || 0) + 1;

		// Plataformas
		const platform = collection.platform || 'Sin plataforma';
		stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
	}

	return stats;
}
