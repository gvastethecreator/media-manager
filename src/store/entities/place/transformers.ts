/**
 * @file Transformadores para la entidad Place
 * @module store/entities/place/transformers
 */

import type {
	CreatePlaceData,
	ParsedPlaceVisualConfig,
	Place,
	PlaceFilters,
	UpdatePlaceData,
} from '../../../types/entities/place';
import { PLACE_TYPE_EMOJIS } from './constants';
import { generatePlaceId, parsePlaceStats } from './utils';

/**
 * Transforma los datos para crear un lugar en una entidad completa
 * @param data Datos para crear el lugar
 * @returns Entidad de lugar
 */
export const createPlaceFromData = (data: CreatePlaceData): Place => {
	const now = new Date();
	const placeType = data.type?.toLowerCase() || 'other';

	// Obtener emoji recomendado según el tipo
	const defaultEmoji = PLACE_TYPE_EMOJIS[placeType] || '📍';

	return {
		id: generatePlaceId(),
		name: data.name,
		emoji: data.emoji || defaultEmoji,
		color: data.color || '#6B7280',
		description: data.description || null,
		shortcut: data.shortcut || null,
		region: data.region || null,
		type: data.type || null,
		climate: data.climate || null,
		population: data.population || null,
		government: data.government || null,
		dangers: data.dangers || '{}',
		resources: data.resources || '{}',
		lore: data.lore || null,
		history: data.history || null,
		stats: data.stats || '{}',
		sortBy: data.sortBy || 'name_asc',
		filters: data.filters || '{}',
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
		category: data.category || null,
		createdAt: now,
		updatedAt: now,
	};
};

/**
 * Aplica actualizaciones parciales a un lugar
 * @param place Lugar original
 * @param updates Actualizaciones a aplicar
 * @returns Lugar actualizado
 */
export const updatePlace = (place: Place, updates: Partial<Place> | UpdatePlaceData): Place => {
	return {
		...place,
		...updates,
		updatedAt: new Date(),
	};
};

/**
 * Analiza la configuración visual desde formato JSON
 * @param configJson Configuración visual en formato JSON
 * @returns Configuración analizada
 */
export const parseVisualConfig = (configJson: string): ParsedPlaceVisualConfig => {
	try {
		const parsed = JSON.parse(configJson);

		return {
			view: parsed.view || 'grid',
			sortBy: parsed.sortBy || 'name_asc',
			filters: parsed.filters || {},
			lastViewedPlaceId: parsed.lastViewedPlaceId || null,
			expandedPlaceIds: parsed.expandedPlaceIds || [],
			selectedPlaceIds: parsed.selectedPlaceIds || [],
		};
	} catch (error) {
		return {
			view: 'grid',
			sortBy: 'name_asc',
			filters: {},
			lastViewedPlaceId: null,
			expandedPlaceIds: [],
			selectedPlaceIds: [],
		};
	}
};

/**
 * Convierte la configuración visual a formato JSON
 * @param config Configuración visual
 * @returns Configuración en formato JSON
 */
export const stringifyVisualConfig = (config: ParsedPlaceVisualConfig): string => {
	try {
		return JSON.stringify(config);
	} catch (error) {
		return '{}';
	}
};

/**
 * Procesa un lugar para su visualización, añadiendo propiedades derivadas
 * @param place Lugar a procesar
 * @returns Lugar procesado
 */
export const processPlace = (place: Place): Place => {
	const stats = parsePlaceStats(place.stats);

	// Formatear población para visualización
	const displayPopulation = place.population ? place.population.toLocaleString() : 'Desconocida';

	// Formatear tipo para visualización
	const displayType = place.type ? place.type.charAt(0).toUpperCase() + place.type.slice(1) : '';

	// Clases CSS según tipo
	const typeClass = place.type ? `place-type-${place.type.toLowerCase()}` : '';

	return {
		...place,
		displayPopulation,
		displayType,
		typeClass,
	};
};

/**
 * Procesa una lista de lugares para su visualización
 * @param places Lista de lugares
 * @returns Lista procesada
 */
export const processPlaces = (places: Place[]): Place[] => {
	return places.map(processPlace);
};

/**
 * Convierte filtros de UI a formato para API
 * @param filters Filtros UI
 * @returns Filtros para API
 */
export const convertFiltersToApiParams = (filters: PlaceFilters): Record<string, string> => {
	const params: Record<string, string> = {};

	// Convertir arrays a strings separados por comas
	if (filters.types && filters.types.length > 0) {
		params.types = filters.types.join(',');
	}

	if (filters.categories && filters.categories.length > 0) {
		params.categories = filters.categories.join(',');
	}

	if (filters.regions && filters.regions.length > 0) {
		params.regions = filters.regions.join(',');
	}

	// Convertir booleanos y números
	if (filters.onlyFavorites) {
		params.isFavorite = 'true';
	}

	if (typeof filters.minPopulation === 'number') {
		params.minPopulation = filters.minPopulation.toString();
	}

	if (typeof filters.maxPopulation === 'number') {
		params.maxPopulation = filters.maxPopulation.toString();
	}

	// Filtros de relaciones
	if (filters.hasImages) {
		params.hasImages = 'true';
	}

	if (filters.hasNotes) {
		params.hasNotes = 'true';
	}

	if (filters.hasConcepts) {
		params.hasConcepts = 'true';
	}

	if (filters.hasPrompts) {
		params.hasPrompts = 'true';
	}

	return params;
};
