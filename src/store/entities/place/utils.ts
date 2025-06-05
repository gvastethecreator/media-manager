/**
 * @file Utilidades para el store de Place
 * @module store/entities/place/utils
 */

import type { Place, PlaceFilters } from '../../../types/entities/place';
import { PLACE_ID_PREFIX, PLACE_TYPE_COLORS } from './constants';

/**
 * Genera un ID único para un lugar
 * @returns ID único para un lugar
 */
export const generatePlaceId = (): string => {
	return `${PLACE_ID_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Filtra una lista de lugares según los criterios especificados
 * @param places Lista de lugares
 * @param filters Filtros a aplicar
 * @param searchQuery Consulta de búsqueda
 * @returns Lista filtrada de lugares
 */
export const filterPlaces = (places: Place[], filters: PlaceFilters, searchQuery = ''): Place[] => {
	if (!places || places.length === 0) return [];

	// Si no hay filtros ni consulta, devolver todos los lugares
	if (!filters && !searchQuery) return places;

	return places.filter((place) => {
		// Filtro por búsqueda
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			const matchesSearch =
				place.name.toLowerCase().includes(query) ||
				place.description?.toLowerCase().includes(query) ||
				place.type?.toLowerCase().includes(query) ||
				place.region?.toLowerCase().includes(query) ||
				place.climate?.toLowerCase().includes(query) ||
				place.government?.toLowerCase().includes(query) ||
				place.category?.toLowerCase().includes(query);

			if (!matchesSearch) return false;
		}

		// Filtros específicos
		if (filters) {
			// Filtro por tipo
			if (filters.types && filters.types.length > 0) {
				if (!place.type || !filters.types.includes(place.type)) return false;
			}

			// Filtro por categoría
			if (filters.categories && filters.categories.length > 0) {
				if (!place.category || !filters.categories.includes(place.category)) return false;
			}

			// Filtro por regiones
			if (filters.regions && filters.regions.length > 0) {
				if (!place.region || !filters.regions.includes(place.region)) return false;
			}

			// Filtro por favoritos
			if (filters.onlyFavorites && !place.isFavorite) {
				return false;
			}

			// Filtros de población
			if (typeof filters.minPopulation === 'number' || typeof filters.maxPopulation === 'number') {
				if (typeof place.population === 'number') {
					if (typeof filters.minPopulation === 'number' && place.population < filters.minPopulation) return false;
					if (typeof filters.maxPopulation === 'number' && place.population > filters.maxPopulation) return false;
				}
			}

			// Filtros por relaciones
			if (filters.hasImages && (!place._count?.images || place._count.images === 0)) return false;
			if (filters.hasNotes && (!place._count?.notes || place._count.notes === 0)) return false;
			if (filters.hasConcepts && (!place._count?.concepts || place._count.concepts === 0)) return false;
			if (filters.hasPrompts && (!place._count?.prompts || place._count.prompts === 0)) return false;
		}

		return true;
	});
};

/**
 * Ordena una lista de lugares según el criterio especificado
 * @param places Lista de lugares
 * @param sortBy Criterio de ordenamiento
 * @returns Lista ordenada de lugares
 */
export const sortPlaces = (places: Place[], sortBy: string): Place[] => {
	if (!places || places.length === 0) return [];

	const sortedPlaces = [...places];

	switch (sortBy) {
		case 'name_asc':
			return sortedPlaces.sort((a, b) => a.name.localeCompare(b.name));

		case 'name_desc':
			return sortedPlaces.sort((a, b) => b.name.localeCompare(a.name));

		case 'created_asc':
			return sortedPlaces.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

		case 'created_desc':
			return sortedPlaces.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		case 'updated_asc':
			return sortedPlaces.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

		case 'updated_desc':
			return sortedPlaces.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

		case 'type_asc':
			return sortedPlaces.sort((a, b) => (a.type || '').localeCompare(b.type || ''));

		case 'type_desc':
			return sortedPlaces.sort((a, b) => (b.type || '').localeCompare(a.type || ''));

		case 'population_asc':
			return sortedPlaces.sort((a, b) => (a.population || 0) - (b.population || 0));

		case 'population_desc':
			return sortedPlaces.sort((a, b) => (b.population || 0) - (a.population || 0));

		default:
			return sortedPlaces;
	}
};

/**
 * Extrae un valor numérico de un string JSON de estadísticas
 * @param statsJson String JSON de estadísticas
 * @param key Clave a extraer
 * @returns Valor numérico o undefined si no existe
 */
export const extractNumberFromStats = (statsJson: string | null, key: string): number | undefined => {
	if (!statsJson) return undefined;

	try {
		const stats = JSON.parse(statsJson);
		const value = stats[key];
		return typeof value === 'number' ? value : undefined;
	} catch (error) {
		return undefined;
	}
};

/**
 * Analiza y transforma las estadísticas JSON de un lugar
 * @param statsJson String JSON de estadísticas
 * @returns Objeto de estadísticas analizadas
 */
export const parsePlaceStats = (statsJson: string | null): Record<string, any> => {
	if (!statsJson) return {};

	try {
		return JSON.parse(statsJson);
	} catch (error) {
		return {};
	}
};

/**
 * Convierte un objeto de estadísticas a string JSON
 * @param stats Objeto de estadísticas
 * @returns String JSON de estadísticas
 */
export const stringifyPlaceStats = (stats: Record<string, any>): string => {
	try {
		return JSON.stringify(stats);
	} catch (error) {
		return '{}';
	}
};

/**
 * Obtiene el color asociado a un tipo de lugar
 * @param type Tipo de lugar
 * @returns Código de color
 */
export const getPlaceTypeColor = (type: string | null): string => {
	if (!type) return '#6B7280';
	const typeKey = type.toLowerCase() as keyof typeof PLACE_TYPE_COLORS;
	return PLACE_TYPE_COLORS[typeKey] || '#6B7280';
};
