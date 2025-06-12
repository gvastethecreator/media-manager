/**
 * @file Funciones auxiliares para la entidad Place
 * @module utils/place/helpers
 */

import { deserializePlaceDangers } from '../../transformers/place';
import { PLACE_SORT_PROPERTY_MAP, type Place, type PlaceFilters, PlaceSortCriteria } from '../../types/entities/place';

/**
 * Ordena una lista de lugares según el criterio especificado
 * @param places Lista de lugares a ordenar
 * @param sortBy Criterio de ordenación
 * @returns Lista ordenada
 */
export function sortPlaces(places: Place[], sortBy: string = PlaceSortCriteria.NAME_ASC): Place[] {
	const sortedPlaces = [...places];
	const sortProperty = PLACE_SORT_PROPERTY_MAP[sortBy as PlaceSortCriteria] || 'name';
	const isDesc = sortBy.endsWith('_desc');

	sortedPlaces.sort((a, b) => {
		let valueA: any = a[sortProperty as keyof Place];
		let valueB: any = b[sortProperty as keyof Place];

		// Manejar casos especiales para propiedades JSON
		if (sortProperty === 'dangers') {
			const dangerLevelA = a.dangerLevel || 'unknown';
			const dangerLevelB = b.dangerLevel || 'unknown';

			const dangerLevels = ['safe', 'low', 'moderate', 'high', 'extreme', 'deadly', 'unknown'];
			valueA = dangerLevels.indexOf(dangerLevelA);
			valueB = dangerLevels.indexOf(dangerLevelB);
		}

		// Manejar valores nulos
		if (valueA === null || valueA === undefined) return isDesc ? -1 : 1;
		if (valueB === null || valueB === undefined) return isDesc ? 1 : -1;

		// Comparar según tipo de valor
		if (typeof valueA === 'string' && typeof valueB === 'string') {
			return isDesc
				? valueB.localeCompare(valueA, 'es', { sensitivity: 'base' })
				: valueA.localeCompare(valueB, 'es', { sensitivity: 'base' });
		}

		// Comparar numéricamente
		return isDesc ? valueB - valueA : valueA - valueB;
	});

	return sortedPlaces;
}

/**
 * Filtra una lista de lugares según los criterios especificados
 * @param places Lista de lugares a filtrar
 * @param filters Filtros a aplicar
 * @returns Lista filtrada
 */
export function filterPlaces(places: Place[], filters: PlaceFilters): Place[] {
	if (!filters || Object.keys(filters).length === 0) {
		return places;
	}

	return places.filter((place) => {
		// Filtrar por búsqueda de texto
		if (filters.searchQuery) {
			const searchRegex = new RegExp(filters.searchQuery, 'i');
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
		if (filters.categories?.length && place.category) {
			if (!filters.categories.includes(place.category)) {
				return false;
			}
		}

		// Filtrar por tipo
		if (filters.types?.length && place.type) {
			if (!filters.types.includes(place.type)) {
				return false;
			}
		}

		// Filtrar por clima
		if (filters.climates?.length && place.climate) {
			if (!filters.climates.includes(place.climate)) {
				return false;
			}
		}

		// Filtrar por gobierno
		if (filters.governments?.length && place.government) {
			if (!filters.governments.includes(place.government)) {
				return false;
			}
		}

		// Filtrar por rango de población
		if (place.population !== null && filters.populationRange) {
			if (filters.populationRange.min !== undefined && place.population < filters.populationRange.min) {
				return false;
			}
			if (filters.populationRange.max !== undefined && place.population > filters.populationRange.max) {
				return false;
			}
		}

		// Filtrar por favoritos
		if (filters.onlyFavorites && !place.isFavorite) {
			return false;
		}

		// Filtrar por presencia de relaciones
		if (filters.hasImages && (!place.imagesCount || place.imagesCount === 0)) {
			return false;
		}
		if (filters.hasNotes && (!place.notesCount || place.notesCount === 0)) {
			return false;
		}
		if (filters.hasConcepts && (!place.conceptsCount || place.conceptsCount === 0)) {
			return false;
		}
		if (filters.hasPrompts && (!place.promptsCount || place.promptsCount === 0)) {
			return false;
		}

		return true;
	});
}

/**
 * Organiza lugares en una estructura de árbol basada en regiones
 * @param places Lista de lugares
 * @returns Estructura de árbol de lugares
 */
export function buildPlaceTree(places: Place[]) {
	const tree: Record<string, any> = {};
	const rootPlaces: Place[] = [];

	// Primero, agregar lugares sin región a la raíz
	for (const place of places) {
		if (!place.region) {
			rootPlaces.push(place);
		} else {
			const path = place.region.split('/').filter(Boolean);
			let current = tree;

			// Crear la estructura de árbol para la región
			for (const [index, segment] of path.entries()) {
				if (!current[segment]) {
					current[segment] = { places: [], children: {} };
				}

				if (index === path.length - 1) {
					current[segment].places.push(place);
				}

				current = current[segment].children;
			}
		}
	}

	return { rootPlaces, tree };
}

/**
 * Encuentra un lugar por ID en una lista
 * @param places Lista de lugares
 * @param id ID a buscar
 * @returns Lugar encontrado o undefined
 */
export function findPlaceById(places: Place[], id: string): Place | undefined {
	return places.find((place) => place.id === id);
}

/**
 * Encuentra lugares por IDs en una lista
 * @param places Lista de lugares
 * @param ids IDs a buscar
 * @returns Lista de lugares encontrados
 */
export function findPlacesByIds(places: Place[], ids: string[]): Place[] {
	return places.filter((place) => ids.includes(place.id));
}

/**
 * Encuentra lugares por categoría
 * @param places Lista de lugares
 * @param category Categoría a buscar
 * @returns Lista de lugares de la categoría
 */
export function findPlacesByCategory(places: Place[], category: string): Place[] {
	return places.filter((place) => place.category === category);
}

/**
 * Encuentra lugares por tipo
 * @param places Lista de lugares
 * @param type Tipo a buscar
 * @returns Lista de lugares del tipo
 */
export function findPlacesByType(places: Place[], type: string): Place[] {
	return places.filter((place) => place.type === type);
}

/**
 * Encuentra lugares por región
 * @param places Lista de lugares
 * @param region Región a buscar
 * @returns Lista de lugares de la región
 */
export function findPlacesByRegion(places: Place[], region: string): Place[] {
	return places.filter((place) => place.region?.startsWith(region));
}

/**
 * Prepara un lugar para una petición de creación/actualización
 * @param place Objeto lugar a preparar
 * @returns Datos preparados para la petición
 */
export function preparePlaceRequest(place: Partial<Place>): Record<string, any> {
	const {
		dangersArray,
		resourcesArray,
		statsObject,
		filtersObject,
		isSelected,
		isExpanded,
		isEditing,
		isHighlighted,
		imagesCount,
		notesCount,
		conceptsCount,
		promptsCount,
		dangerLevel,
		displayPopulation,
		displaySize,
		regionPath,
		...baseData
	} = place as any;

	// Si hay arrays y objetos, convertirlos a JSON
	const preparedData: Record<string, any> = { ...baseData };

	// Solo incluir en la petición si han cambiado
	if (dangersArray) {
		preparedData.dangers = JSON.stringify(dangersArray);
	}
	if (resourcesArray) {
		preparedData.resources = JSON.stringify(resourcesArray);
	}
	if (statsObject) {
		preparedData.stats = JSON.stringify(statsObject);
	}
	if (filtersObject) {
		preparedData.filters = JSON.stringify(filtersObject);
	}

	return preparedData;
}

/**
 * Calcula estadísticas para un conjunto de lugares
 * @param places Lista de lugares
 * @returns Estadísticas calculadas
 */
export function calculatePlaceStats(places: Place[]) {
	return {
		total: places.length,
		byType: countByProperty(places, 'type'),
		byCategory: countByProperty(places, 'category'),
		favorites: places.filter((p) => p.isFavorite).length,
		withImages: places.filter((p) => p.imagesCount && p.imagesCount > 0).length,
		withNotes: places.filter((p) => p.notesCount && p.notesCount > 0).length,
		withConcepts: places.filter((p) => p.conceptsCount && p.conceptsCount > 0).length,
		withPrompts: places.filter((p) => p.promptsCount && p.promptsCount > 0).length,
		averagePopulation: calculateAveragePopulation(places),
		dangerLevelDistribution: countByProperty(places, 'dangerLevel'),
	};
}

/**
 * Cuenta lugares por una propiedad específica
 * @param places Lista de lugares
 * @param property Propiedad a contar
 * @returns Conteo por valor de propiedad
 */
function countByProperty(places: Place[], property: keyof Place): Record<string, number> {
	const counts: Record<string, number> = {};

	for (const place of places) {
		const value = String(place[property] || 'unknown');
		counts[value] = (counts[value] || 0) + 1;
	}

	return counts;
}

/**
 * Calcula la población promedio de los lugares
 * @param places Lista de lugares
 * @returns Población promedio
 */
function calculateAveragePopulation(places: Place[]): number {
	const placesWithPopulation = places.filter((p) => p.population !== null);
	if (placesWithPopulation.length === 0) return 0;

	const total = placesWithPopulation.reduce((sum, place) => sum + (place.population || 0), 0);
	return Math.round(total / placesWithPopulation.length);
}
