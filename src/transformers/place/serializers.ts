/**
 * @file Funciones de serialización/deserialización para la entidad Place
 * @module transformers/place/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
  PlaceBase,
  PlaceComplete,
  PlaceDanger,
  PlaceExtendedComplete,
  PlaceFilters,
  PlaceResource,
  PlaceStats
} from '@/types/entities/place';

const serializerLogger = serverLogger.withContext('PlaceSerializer');

/**
 * Serializa los peligros de un lugar a formato JSON string
 * @param dangers Array de peligros
 * @returns JSON string de peligros
 */
export function serializePlaceDangers(dangers: PlaceDanger[]): string {
	try {
		return JSON.stringify(dangers);
	} catch (error) {
		serializerLogger.error('❌ Error al serializar los peligros del lugar:', error);
		return JSON.stringify([]);
	}
}

/**
 * Deserializa los peligros de un lugar desde JSON string
 * @param dangersJson JSON string de peligros
 * @returns Array de peligros
 */
export function deserializePlaceDangers(dangersJson: string | null): PlaceDanger[] {
	if (!dangersJson) return [];

	try {
		return JSON.parse(dangersJson) as PlaceDanger[];
	} catch (error) {
		serializerLogger.error('❌ Error al deserializar los peligros del lugar:', error);
		return [];
	}
}

/**
 * Serializa los recursos de un lugar a formato JSON string
 * @param resources Array de recursos
 * @returns JSON string de recursos
 */
export function serializePlaceResources(resources: PlaceResource[]): string {
	try {
		return JSON.stringify(resources);
	} catch (error) {
		serializerLogger.error('❌ Error al serializar los recursos del lugar:', error);
		return JSON.stringify([]);
	}
}

/**
 * Deserializa los recursos de un lugar desde JSON string
 * @param resourcesJson JSON string de recursos
 * @returns Array de recursos
 */
export function deserializePlaceResources(resourcesJson: string | null): PlaceResource[] {
	if (!resourcesJson) return [];

	try {
		return JSON.parse(resourcesJson) as PlaceResource[];
	} catch (error) {
		serializerLogger.error('❌ Error al deserializar los recursos del lugar:', error);
		return [];
	}
}

/**
 * Serializa las estadísticas de un lugar a formato JSON string
 * @param stats Objeto de estadísticas
 * @returns JSON string de estadísticas
 */
export function serializePlaceStats(stats: PlaceStats): string {
	try {
		return JSON.stringify(stats);
	} catch (error) {
		serializerLogger.error('❌ Error al serializar las estadísticas del lugar:', error);
		return JSON.stringify({});
	}
}

/**
 * Deserializa las estadísticas de un lugar desde JSON string
 * @param statsJson JSON string de estadísticas
 * @returns Objeto de estadísticas
 */
export function deserializePlaceStats(statsJson: string | null): PlaceStats {
	if (!statsJson) return {};

	try {
		return JSON.parse(statsJson) as PlaceStats;
	} catch (error) {
		serializerLogger.error('❌ Error al deserializar las estadísticas del lugar:', error);
		return {};
	}
}

/**
 * Serializa los filtros de un lugar a formato JSON string
 * @param filters Objeto de filtros
 * @returns JSON string de filtros
 */
export function serializePlaceFilters(filters: PlaceFilters): string {
	try {
		return JSON.stringify(filters);
	} catch (error) {
		serializerLogger.error('❌ Error al serializar los filtros del lugar:', error);
		return JSON.stringify({});
	}
}

/**
 * Deserializa los filtros de un lugar desde JSON string
 * @param filtersJson JSON string de filtros
 * @returns Objeto de filtros
 */
export function deserializePlaceFilters(filtersJson: string | null): PlaceFilters {
	if (!filtersJson) return {};

	try {
		return JSON.parse(filtersJson) as PlaceFilters;
	} catch (error) {
		serializerLogger.error('❌ Error al deserializar los filtros del lugar:', error);
		return {};
	}
}

/**
 * Transforma un objeto Place de Prisma a un objeto PlaceComplete
 * Esto deserializa todos los campos JSON y prepara la estructura completa
 * @param place Place de Prisma
 * @returns PlaceComplete con todos los campos deserializados
 */
export function toPlaceComplete(place: PlaceBase): PlaceComplete {
	try {
		return {
			...place,
			dangersArray: deserializePlaceDangers(place.dangers),
			resourcesArray: deserializePlaceResources(place.resources),
			statsObject: deserializePlaceStats(place.stats),
			filtersObject: deserializePlaceFilters(place.filters)
		};
	} catch (error) {
		serializerLogger.error('❌ Error al deserializar Place:', error);
		// En caso de error, devolvemos un objeto con arrays/objetos vacíos
		return {
			...place,
			dangersArray: [],
			resourcesArray: [],
			statsObject: {},
			filtersObject: {}
		};
	}
}

/**
 * Transforma un objeto PlaceComplete de vuelta a un PlaceBase para persistir
 * @param place PlaceComplete
 * @returns PlaceBase para guardar en BD
 */
export function fromPlaceComplete(place: PlaceComplete): PlaceBase {
	try {
		const { dangersArray, resourcesArray, statsObject, filtersObject, ...basePlace } = place;

		return {
			...basePlace,
			dangers: serializePlaceDangers(dangersArray),
			resources: serializePlaceResources(resourcesArray),
			stats: serializePlaceStats(statsObject),
			filters: serializePlaceFilters(filtersObject)
		};
	} catch (error) {
		serializerLogger.error('❌ Error al serializar Place para BD:', error);
		// En caso de error, devolvemos el objeto original
		const { dangersArray, resourcesArray, statsObject, filtersObject, ...basePlace } = place;
		return basePlace as PlaceBase;
	}
}

/**
 * Transforma un PlaceComplete a un PlaceExtendedComplete con propiedades de UI
 * @param place PlaceComplete
 * @param countData Datos de conteo opcionales para relaciones
 * @returns PlaceExtendedComplete con propiedades UI
 */
export function mapPlaceExtendedFromComplete(
	place: PlaceComplete,
	countData?: { images?: number; notes?: number; concepts?: number; prompts?: number }
): PlaceExtendedComplete {
	return {
		...place,
		// Propiedades UI básicas
		isSelected: false,
		isExpanded: false,
		isEditing: false,
		isHighlighted: false,
		// Contadores de relaciones
		imagesCount: countData?.images || 0,
		notesCount: countData?.notes || 0,
		conceptsCount: countData?.concepts || 0,
		promptsCount: countData?.prompts || 0,
		// Datos derivados
		dangerLevel: getDangerLevel(place.dangers),
		displayPopulation: formatPopulation(place.population),
		displaySize: getDisplaySize(place.stats),
		regionPath: getRegionPath(place.region),
	};
}

/**
 * Obtiene el nivel de peligro basado en los peligros del lugar
 * @param dangersJson JSON string de peligros
 * @returns Nivel de peligro como string
 */
function getDangerLevel(dangersJson: string | null): string {
	const dangers = deserializePlaceDangers(dangersJson);
	if (!dangers.length) return 'safe';

	// Lógica para determinar nivel de peligro
	const hasSevereDangers = dangers.some(d => d.level && d.level > 7);
	const hasModerateDangers = dangers.some(d => d.level && d.level > 3);

	if (hasSevereDangers) return 'high';
	if (hasModerateDangers) return 'moderate';
	return 'low';
}

/**
 * Formatea la población para mostrar
 * @param population Número de población
 * @returns Texto formateado de población
 */
function formatPopulation(population: number | null): string {
	if (population === null || population === undefined) return 'Unknown';
	if (population === 0) return 'Uninhabited';
	if (population < 100) return 'Tiny settlement';
	if (population < 1000) return 'Small settlement';
	if (population < 10000) return 'Medium settlement';
	if (population < 100000) return 'Large settlement';
	return 'Metropolis';
}

/**
 * Obtiene el tamaño del lugar basado en estadísticas
 * @param statsJson JSON string de estadísticas
 * @returns Texto descriptivo del tamaño
 */
function getDisplaySize(statsJson: string | null): string {
	const stats = deserializePlaceStats(statsJson);
	if (!stats || !Object.keys(stats).length) return 'Unknown size';

	// Intentar determinar tamaño basado en estadísticas
	if (stats.size) {
		const size = stats.size;
		if (size < 3) return 'Tiny';
		if (size < 6) return 'Small';
		if (size < 12) return 'Medium';
		if (size < 18) return 'Large';
		return 'Huge';
	}

	return 'Medium size';
}

/**
 * Convierte una región en un array de path
 * @param region Texto de región
 * @returns Array con segmentos de path
 */
function getRegionPath(region: string | null): string[] {
	if (!region) return [];
	return region.split('/').filter(Boolean);
}
