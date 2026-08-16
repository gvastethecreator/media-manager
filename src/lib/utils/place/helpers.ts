/**
 * @file Funciones auxiliares para la entidad Place
 * @module utils/place/helpers
 */

import type { PlaceFilters } from '@/lib/api/places';
import type { PlaceWithStats } from '@/types/entities/place';

/**
 * Ordena una lista de lugares según el criterio especificado.
 * @param places Lista de lugares a ordenar.
 * @param sortBy Criterio de ordenación (ej: 'name_asc', 'population_desc').
 * @returns Lista ordenada de lugares.
 */
export function sortPlaces(places: PlaceWithStats[], sortBy = 'name_asc'): PlaceWithStats[] {
	const sortedPlaces = [...places];
	const [sortProperty, sortOrder] = sortBy.split('_') as [keyof PlaceWithStats, 'asc' | 'desc'];
	const isDesc = sortOrder === 'desc';

	sortedPlaces.sort((a, b) => {
		const valueA = a[sortProperty];
		const valueB = b[sortProperty];

		// Manejar valores nulos o indefinidos
		if (valueA === null || valueA === undefined) {
			return 1;
		}
		if (valueB === null || valueB === undefined) {
			return -1;
		}

		// Comparar según tipo de valor
		if (typeof valueA === 'string' && typeof valueB === 'string') {
			return isDesc
				? valueB.localeCompare(valueA, 'en', { sensitivity: 'base' })
				: valueA.localeCompare(valueB, 'en', { sensitivity: 'base' });
		}

		if (typeof valueA === 'number' && typeof valueB === 'number') {
			return isDesc ? valueB - valueA : valueA - valueB;
		}

		if (valueA instanceof Date && valueB instanceof Date) {
			return isDesc ? valueB.getTime() - valueA.getTime() : valueA.getTime() - valueB.getTime();
		}

		// Fallback para otros tipos
		return 0;
	});

	return sortedPlaces;
}

/**
 * Filtra una lista de lugares según los criterios especificados.
 * @param places Lista de lugares a filtrar (deben incluir los conteos de relaciones).
 * @param filters Filtros a aplicar.
 * @returns Lista filtrada de lugares.
 */
export function filterPlaces(places: PlaceWithStats[], filters: PlaceFilters): PlaceWithStats[] {
	if (!filters || Object.keys(filters).length === 0) {
		return places;
	}

	return places.filter((place) => {
		// Filtrar por búsqueda de texto
		if (filters.search) {
			const searchRegex = new RegExp(filters.search, 'i');
			const searchableText = [
				place.name,
				place.description,
				place.region,
				place.type,
				place.climate,
				place.government,
				place.lore,
				place.history,
			]
				.filter(Boolean)
				.join(' ');
			if (!searchRegex.test(searchableText)) {
				return false;
			}
		}

		// Filtrar por categoría
		if (filters.category && place.category !== filters.category) {
			return false;
		}

		// Filtrar por favoritos
		if (filters.isFavorite !== undefined && place.isFavorite !== filters.isFavorite) {
			return false;
		}

		// Filtrar por conteo mínimo de imágenes
		if (filters.limit && place._count && place._count.images && place._count.images < filters.limit) {
			return false;
		}

		// Filtrar por tipo
		if (filters.type && place.type !== filters.type) {
			return false;
		}

		// Filtrar por ubicación
		if (filters.location && place.location !== filters.location) {
			return false;
		}

		return true;
	});
}

/**
 * Organiza lugares en una estructura de árbol basada en la propiedad `region`.
 * @param places Lista de lugares.
 * @returns Un objeto con una lista de lugares raíz y un árbol de regiones.
 */
export function buildPlaceTree(places: PlaceWithStats[]) {
	const tree: Record<string, { places: PlaceWithStats[]; children: any }> = {};
	const rootPlaces: PlaceWithStats[] = [];

	for (const place of places) {
		if (place.region) {
			const path = place.region.split('/').filter(Boolean);
			let current = tree;

			for (const [index, segment] of path.entries()) {
				if (!current[segment]) {
					current[segment] = { places: [], children: {} };
				}
				if (index === path.length - 1) {
					current[segment].places.push(place);
				}
				current = current[segment].children;
			}
		} else {
			rootPlaces.push(place);
		}
	}

	return { rootPlaces, tree };
}

/**
 * Encuentra un lugar por su ID en una lista.
 */
export function findPlaceById(places: PlaceWithStats[], id: string): PlaceWithStats | undefined {
	return places.find((place) => place.id === id);
}

/**
 * Encuentra múltiples lugares por sus IDs en una lista.
 */
export function findPlacesByIds(places: PlaceWithStats[], ids: string[]): PlaceWithStats[] {
	const idSet = new Set(ids);
	return places.filter((place) => idSet.has(place.id));
}

/**
 * Calcula estadísticas agregadas sobre una lista de lugares.
 * @param places Lista de lugares.
 * @returns Un objeto con estadísticas como total, conteo por categoría, etc.
 */
export function calculatePlaceStats(places: PlaceWithStats[]) {
	return {
		total: places.length,
		byCategory: countByProperty(places, 'category'),
		byType: countByProperty(places, 'type'),
		byClimate: countByProperty(places, 'climate'),
		averagePopulation: calculateAveragePopulation(places),
		favorites: places.filter((p) => p.isFavorite).length,
	};
}

function countByProperty(places: PlaceWithStats[], property: keyof PlaceWithStats): Record<string, number> {
	return places.reduce(
		(acc, place) => {
			const key = place[property];
			if (typeof key === 'string' && key) {
				acc[key] = (acc[key] || 0) + 1;
			}
			return acc;
		},
		{} as Record<string, number>
	);
}

function calculateAveragePopulation(places: PlaceWithStats[]): number {
	const populatedPlaces = places.filter((p) => typeof p.population === 'number');
	if (populatedPlaces.length === 0) {
		return 0;
	}
	const totalPopulation = populatedPlaces.reduce((sum, p) => {
		const population = typeof p.population === 'number' ? p.population : 0;
		return sum + population;
	}, 0);
	return totalPopulation / populatedPlaces.length;
}
