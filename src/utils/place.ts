/**
 * @file Utilidades para la entidad Place
 * @module utils/place
 * @description Funciones de utilidad para filtrar, buscar y ordenar lugares
 */

import type { PlaceFilters, PlaceWithStats } from '../types/entities/place';

/**
 * Filtra una lista de lugares según los criterios especificados
 * @param places Lista de lugares a filtrar
 * @param filters Criterios de filtrado
 * @returns Lista de lugares filtrados
 */
export function filterPlaces(places: PlaceWithStats[], filters: PlaceFilters): PlaceWithStats[] {
	if (!filters) return places;

	return places.filter((place) => {
		// Filtro por búsqueda de texto
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			const matchesSearch =
				place.name.toLowerCase().includes(searchLower) ||
				place.description?.toLowerCase().includes(searchLower) ||
				place.location?.toLowerCase().includes(searchLower);

			if (!matchesSearch) return false;
		}

		// Filtro por categoría
		if (filters.category && filters.category.length > 0) {
			if (!place.category || !filters.category.includes(place.category as any)) {
				return false;
			}
		}

		// Filtro por tipo
		if (filters.type && filters.type.length > 0) {
			if (!place.type || !filters.type.includes(place.type as any)) {
				return false;
			}
		}

		// Filtro por favoritos
		if (typeof filters.isFavorite === 'boolean') {
			if (place.isFavorite !== filters.isFavorite) {
				return false;
			}
		}

		// Filtro por presencia de imágenes
		if (typeof filters.hasImages === 'boolean') {
			const hasImages = place.totalImages > 0;
			if (hasImages !== filters.hasImages) {
				return false;
			}
		}

		// Filtro por presencia de videos
		if (typeof filters.hasVideos === 'boolean') {
			const hasVideos = place.totalVideos > 0;
			if (hasVideos !== filters.hasVideos) {
				return false;
			}
		}

		// Filtro por rango de fechas
		if (filters.dateRange) {
			const placeDate = new Date(place.createdAt);

			if (filters.dateRange.start && placeDate < filters.dateRange.start) {
				return false;
			}

			if (filters.dateRange.end && placeDate > filters.dateRange.end) {
				return false;
			}
		}

		return true;
	});
}

/**
 * Busca un lugar por su ID
 * @param places Lista de lugares
 * @param id ID del lugar a buscar
 * @returns El lugar encontrado o undefined
 */
export function findPlaceById(places: PlaceWithStats[], id: string): PlaceWithStats | undefined {
	return places.find((place) => place.id === id);
}

/**
 * Busca múltiples lugares por sus IDs
 * @param places Lista de lugares
 * @param ids Array de IDs de lugares a buscar
 * @returns Array de lugares encontrados
 */
export function findPlacesByIds(places: PlaceWithStats[], ids: string[]): PlaceWithStats[] {
	return places.filter((place) => ids.includes(place.id));
}

/**
 * Ordena una lista de lugares según el criterio especificado
 * @param places Lista de lugares a ordenar
 * @param sortBy Criterio de ordenación
 * @param sortOrder Dirección del ordenamiento (asc/desc)
 * @returns Lista de lugares ordenados
 */
export function sortPlaces(
	places: PlaceWithStats[],
	sortBy = 'name',
	sortOrder: 'asc' | 'desc' = 'asc'
): PlaceWithStats[] {
	return [...places].sort((a, b) => {
		let valueA: any;
		let valueB: any;

		switch (sortBy) {
			case 'name':
				valueA = a.name.toLowerCase();
				valueB = b.name.toLowerCase();
				break;
			case 'createdAt':
				valueA = new Date(a.createdAt);
				valueB = new Date(b.createdAt);
				break;
			case 'updatedAt':
				valueA = new Date(a.updatedAt);
				valueB = new Date(b.updatedAt);
				break;
			case 'category':
				valueA = a.category || '';
				valueB = b.category || '';
				break;
			case 'type':
				valueA = a.type || '';
				valueB = b.type || '';
				break;
			case 'totalImages':
				valueA = a.totalImages;
				valueB = b.totalImages;
				break;
			case 'totalVideos':
				valueA = a.totalVideos;
				valueB = b.totalVideos;
				break;
			default:
				valueA = a.name.toLowerCase();
				valueB = b.name.toLowerCase();
		}

		if (valueA < valueB) {
			return sortOrder === 'asc' ? -1 : 1;
		}
		if (valueA > valueB) {
			return sortOrder === 'asc' ? 1 : -1;
		}
		return 0;
	});
}
