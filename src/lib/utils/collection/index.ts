/**
 * @file Índice de exportación para utilidades de Collection
 * @module utils/collection
 */

export * from './helpers';
export * from './validators';

import type { CollectionWithStats } from '@/types/entities/collection';

/**
 * 📚 Ordena las colecciones según la opción especificada
 * @param collections Array de colecciones a ordenar
 * @param sortOption Opción de ordenamiento (ej: 'name_asc', 'price_desc')
 * @returns Array de colecciones ordenadas
 */
export function sortCollections(collections: CollectionWithStats[], sortOption: string): CollectionWithStats[] {
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

			case 'totalItems':
				aValue = (a.stats?.imageCount || 0) + (a.stats?.videoCount || 0);
				bValue = (b.stats?.imageCount || 0) + (b.stats?.videoCount || 0);
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
	collections: CollectionWithStats[],
	groupBy: 'rarity' | null
): Record<string, CollectionWithStats[]> {
	if (!collections || collections.length === 0 || !groupBy) {
		return { Todas: collections || [] };
	}

	const groups: Record<string, CollectionWithStats[]> = {};

	for (const collection of collections) {
		let groupKey: string;

		switch (groupBy) {
			case 'rarity': {
				// Determinar rareza basada en el número de elementos
				const totalItems = (collection.stats?.imageCount || 0) + (collection.stats?.videoCount || 0);
				if (totalItems > 100) {
					groupKey = 'Mítica';
				} else if (totalItems > 50) {
					groupKey = 'Rara';
				} else if (totalItems > 20) {
					groupKey = 'Poco común';
				} else {
					groupKey = 'Común';
				}
				break;
			}
			default:
				groupKey = 'Todas';
		}

		if (!groups[groupKey]) {
			groups[groupKey] = [];
		}
		groups[groupKey].push(collection);
	}

	// Ordenar los grupos por nombre
	const sortedGroups: Record<string, CollectionWithStats[]> = {};
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
export function filterCollectionsBySearch(
	collections: CollectionWithStats[],
	searchTerm: string
): CollectionWithStats[] {
	if (!searchTerm.trim()) {
		return collections;
	}

	const term = searchTerm.toLowerCase();

	return collections.filter(
		(collection) => collection.name.toLowerCase().includes(term) || collection.description?.toLowerCase().includes(term)
	);
}

/**
 * 📚 Obtiene estadísticas de las colecciones
 * @param collections Array de colecciones
 * @returns Objeto con estadísticas
 */
export function getCollectionStats(collections: CollectionWithStats[]) {
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

		// Con imágenes (usar estadísticas pre-calculadas)
		if (collection.stats?.imageCount && collection.stats.imageCount > 0) {
			stats.withImages++;
		}

		// Valor total
		// totalValue no está disponible en CollectionStatistics
		// stats.totalValue += collection.stats.totalValue;
	}

	return stats;
}
