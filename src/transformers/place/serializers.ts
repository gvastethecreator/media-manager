/**
 * @file Funciones de serialización/deserialización para la entidad Place
 * @module transformers/place/serializers
 */

import { createLogger } from '@/lib/logger';
import { PlaceSchema } from '@/types/entities/place/schema';
import type {
	PlaceBase,
	PlaceComplete,
	PlaceCreateInput,
	PlaceDanger,
	PlaceFilters,
	PlaceRelations,
	PlaceResource,
	PlaceStats,
	PlaceUpdateInput,
} from '@/types/entities/place/types';

// Logger específico para el transformer de Place
const log = createLogger('place-transformer');

/**
 * 🎯 Opciones para serializar/deserializar lugares
 */
interface PlaceTransformOptions {
	validateFields?: boolean;
	deserializeFields?: boolean;
	includeRelations?: boolean;
	includeUI?: boolean;
	includeStats?: boolean;
}

/**
 * 🔄 Serializa un lugar completo para Prisma
 * @param place Objeto PlaceComplete con campos deserializados
 * @param options Opciones de transformación
 * @returns Objeto formateado para Prisma
 */
export function toPrismaPlace(
	place: PlaceComplete | PlaceCreateInput | PlaceUpdateInput,
	options: PlaceTransformOptions = {}
): Record<string, any> {
	try {
		const { validateFields = true, deserializeFields = true } = options;

		// Validar datos de entrada si es requerido
		if (validateFields) {
			PlaceSchema.parse(place);
		}

		// Base de datos para Prisma
		const prismaData: Record<string, any> = {
			...(place as Record<string, any>),
		};

		// Serializar campos JSON si están presentes y son objetos/arrays
		if (deserializeFields) {
			// Serializar peligros
			if (place.dangers && typeof place.dangers !== 'string') {
				prismaData.dangers = serializePlaceDangers(place.dangers as PlaceDanger[]);
			}

			// Serializar recursos
			if (place.resources && typeof place.resources !== 'string') {
				prismaData.resources = serializePlaceResources(place.resources as PlaceResource[]);
			}

			// Serializar estadísticas
			if (place.stats && typeof place.stats !== 'string') {
				prismaData.stats = serializePlaceStats(place.stats as PlaceStats);
			}

			// Serializar filtros
			if (place.filters && typeof place.filters !== 'string') {
				prismaData.filters = serializePlaceFilters(place.filters as PlaceFilters);
			}
		}

		// Eliminar campos que no pertenecen al modelo Prisma
		prismaData.dangersArray = undefined;
		prismaData.resourcesArray = undefined;
		prismaData.statsObject = undefined;
		prismaData.filtersObject = undefined;

		// Eliminar propiedades de UI
		prismaData.isSelected = undefined;
		prismaData.isExpanded = undefined;
		prismaData.isEditing = undefined;
		prismaData.isHighlighted = undefined;
		prismaData.dangerLevel = undefined;
		prismaData.displayPopulation = undefined;
		prismaData.displaySize = undefined;
		prismaData.regionPath = undefined;
		prismaData.recentImages = undefined;

		// Eliminar relaciones que se manejan de forma separada
		prismaData.images = undefined;
		prismaData.videos = undefined;
		prismaData.albums = undefined;
		prismaData.collections = undefined;
		prismaData.tags = undefined;
		prismaData.characters = undefined;
		prismaData.worldItems = undefined;
		prismaData.concepts = undefined;
		prismaData.prompts = undefined;
		prismaData.notes = undefined;
		prismaData.wildcards = undefined;
		prismaData.properties = undefined;
		prismaData.groups = undefined;
		prismaData._count = undefined;

		return prismaData;
	} catch (error) {
		log.error('Error transformando place a formato Prisma', { error });
		throw new Error(`Error transformando place a formato Prisma: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Deserializa un lugar desde Prisma
 * @param prismaPlace Objeto de lugar desde Prisma
 * @param options Opciones de transformación
 * @returns Lugar completo con campos deserializados
 */
export function fromPrismaPlace(
	prismaPlace: PlaceBase & Record<string, any>,
	options: PlaceTransformOptions = {}
): PlaceComplete {
	try {
		const { deserializeFields = true, includeRelations = false, includeUI = false, includeStats = false } = options;

		// Base del lugar
		const placeComplete: Record<string, any> = {
			...prismaPlace,
		};

		// Deserializar campos JSON
		if (deserializeFields) {
			// Deserializar peligros
			placeComplete.dangersArray = deserializePlaceDangers(prismaPlace.dangers);

			// Deserializar recursos
			placeComplete.resourcesArray = deserializePlaceResources(prismaPlace.resources);

			// Deserializar estadísticas
			placeComplete.statsObject = deserializePlaceStats(prismaPlace.stats);

			// Deserializar filtros
			placeComplete.filtersObject = deserializePlaceFilters(prismaPlace.filters);
		}

		// Incluir relaciones si están presentes y habilitadas
		if (includeRelations) {
			// Mantener todas las relaciones que existan en el objeto Prisma
			const relationsFields: (keyof PlaceRelations)[] = [
				'images',
				'videos',
				'albums',
				'collections',
				'tags',
				'characters',
				'worldItems',
				'concepts',
				'prompts',
				'notes',
				'wildcards',
				'properties',
				'groups',
			];

			relationsFields.forEach((field) => {
				if (prismaPlace[field]) {
					placeComplete[field] = prismaPlace[field];
				}
			});

			// Incluir contadores si están presentes
			if (prismaPlace._count) {
				placeComplete._count = prismaPlace._count;
			}
		}

		// Incluir campos UI si se solicita
		if (includeUI) {
			placeComplete.dangerLevel = getDangerLevel(prismaPlace.dangers);
			placeComplete.displayPopulation = formatPopulation(prismaPlace.population);
			placeComplete.displaySize = getDisplaySize(prismaPlace.stats);
			placeComplete.regionPath = getRegionPath(prismaPlace.region);
		}

		// Incluir estadísticas si se solicita
		if (includeStats && prismaPlace._count) {
			placeComplete.imagesCount = prismaPlace._count.images || 0;
			placeComplete.notesCount = prismaPlace._count.notes || 0;
			placeComplete.conceptsCount = prismaPlace._count.concepts || 0;
			placeComplete.promptsCount = prismaPlace._count.prompts || 0;
		}

		return placeComplete as PlaceComplete;
	} catch (error) {
		log.error('Error transformando place desde formato Prisma', { error });
		throw new Error(`Error transformando place desde formato Prisma: ${(error as Error).message}`);
	}
}

/**
 * 💾 Serializa los peligros de un lugar
 * @param dangers Array de peligros
 * @returns JSON string de peligros
 */
export function serializePlaceDangers(dangers: PlaceDanger[]): string {
	try {
		return JSON.stringify(dangers);
	} catch (error) {
		log.error('Error serializando los peligros del lugar', { error });
		return JSON.stringify([]);
	}
}

/**
 * 🔍 Deserializa los peligros de un lugar
 * @param dangersJson JSON string de peligros
 * @returns Array de peligros
 */
export function deserializePlaceDangers(dangersJson: string | null): PlaceDanger[] {
	if (!dangersJson) return [];

	try {
		return JSON.parse(dangersJson) as PlaceDanger[];
	} catch (error) {
		log.error('Error deserializando los peligros del lugar', { error });
		return [];
	}
}

/**
 * 💾 Serializa los recursos de un lugar
 * @param resources Array de recursos
 * @returns JSON string de recursos
 */
export function serializePlaceResources(resources: PlaceResource[]): string {
	try {
		return JSON.stringify(resources);
	} catch (error) {
		log.error('Error serializando los recursos del lugar', { error });
		return JSON.stringify([]);
	}
}

/**
 * 🔍 Deserializa los recursos de un lugar
 * @param resourcesJson JSON string de recursos
 * @returns Array de recursos
 */
export function deserializePlaceResources(resourcesJson: string | null): PlaceResource[] {
	if (!resourcesJson) return [];

	try {
		return JSON.parse(resourcesJson) as PlaceResource[];
	} catch (error) {
		log.error('Error deserializando los recursos del lugar', { error });
		return [];
	}
}

/**
 * 💾 Serializa las estadísticas de un lugar
 * @param stats Objeto de estadísticas
 * @returns JSON string de estadísticas
 */
export function serializePlaceStats(stats: PlaceStats): string {
	try {
		return JSON.stringify(stats);
	} catch (error) {
		log.error('Error serializando las estadísticas del lugar', { error });
		return JSON.stringify({});
	}
}

/**
 * 🔍 Deserializa las estadísticas de un lugar
 * @param statsJson JSON string de estadísticas
 * @returns Objeto de estadísticas
 */
export function deserializePlaceStats(statsJson: string | null): PlaceStats {
	if (!statsJson) return {};

	try {
		return JSON.parse(statsJson) as PlaceStats;
	} catch (error) {
		log.error('Error deserializando las estadísticas del lugar', { error });
		return {};
	}
}

/**
 * 💾 Serializa los filtros de un lugar
 * @param filters Objeto de filtros
 * @returns JSON string de filtros
 */
export function serializePlaceFilters(filters: PlaceFilters): string {
	try {
		return JSON.stringify(filters);
	} catch (error) {
		log.error('Error serializando los filtros del lugar', { error });
		return JSON.stringify({});
	}
}

/**
 * 🔍 Deserializa los filtros de un lugar
 * @param filtersJson JSON string de filtros
 * @returns Objeto de filtros
 */
export function deserializePlaceFilters(filtersJson: string | null): PlaceFilters {
	if (!filtersJson) return {};

	try {
		return JSON.parse(filtersJson) as PlaceFilters;
	} catch (error) {
		log.error('Error deserializando los filtros del lugar', { error });
		return {};
	}
}

/**
 * 🔍 Valida y formatea un lugar para su uso
 * @param place Datos del lugar a validar
 * @returns Lugar validado y formateado
 */
export function validatePlace(place: Record<string, any>): PlaceComplete {
	try {
		const validatedData = PlaceSchema.parse(place);
		return validatedData as unknown as PlaceComplete;
	} catch (error) {
		log.error('Error validando datos de lugar', { error, place });
		throw new Error(`Error validando datos de lugar: ${(error as Error).message}`);
	}
}

/**
 * 🎯 Extiende un lugar con campos adicionales
 * @param place Lugar base a extender
 * @param options Opciones de extensión
 * @returns Lugar extendido con campos adicionales
 */
export function extendPlace(
	place: PlaceBase & Record<string, any>,
	options: PlaceTransformOptions = {}
): PlaceComplete {
	try {
		// Crear el lugar completo
		const extendedPlace = fromPrismaPlace(place, options);

		return extendedPlace;
	} catch (error) {
		log.error('Error extendiendo lugar', { error, place });
		throw new Error(`Error extendiendo lugar: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Extiende varios lugares con campos adicionales
 * @param places Lista de lugares a extender
 * @param options Opciones de extensión
 * @returns Lista de lugares extendidos
 */
export function extendPlaces(
	places: (PlaceBase & Record<string, any>)[],
	options: PlaceTransformOptions = {}
): PlaceComplete[] {
	return places.map((place) => extendPlace(place, options));
}

/**
 * 🔍 Obtiene el nivel de peligro de un lugar
 * @param dangersJson String serializado de peligros
 * @returns Nivel de peligro formateado
 */
function getDangerLevel(dangersJson: string | null): string {
	const dangers = deserializePlaceDangers(dangersJson);

	if (!dangers || dangers.length === 0) {
		return 'Seguro';
	}

	const maxLevel = Math.max(...dangers.map((danger) => danger.level || 0));

	if (maxLevel >= 8) return 'Extremo';
	if (maxLevel >= 6) return 'Alto';
	if (maxLevel >= 4) return 'Moderado';
	if (maxLevel >= 2) return 'Bajo';
	return 'Mínimo';
}

/**
 * 🔍 Formatea la población de un lugar
 * @param population Número de población
 * @returns Población formateada
 */
function formatPopulation(population: number | null): string {
	if (!population) return 'Desconocida';

	if (population >= 1000000) {
		return `${(population / 1000000).toFixed(1)}M`;
	}

	if (population >= 1000) {
		return `${(population / 1000).toFixed(1)}K`;
	}

	return population.toString();
}

/**
 * 🔍 Obtiene el tamaño de un lugar desde sus estadísticas
 * @param statsJson String serializado de estadísticas
 * @returns Tamaño formateado
 */
function getDisplaySize(statsJson: string | null): string {
	const stats = deserializePlaceStats(statsJson);

	if (!stats || !stats.size) {
		return 'Desconocido';
	}

	const size = stats.size;

	if (size >= 1000) {
		return `${(size / 1000).toFixed(1)}km²`;
	}

	return `${size}m²`;
}

/**
 * 🔍 Obtiene la ruta de región de un lugar
 * @param region String de región
 * @returns Array de jerarquía de regiones
 */
function getRegionPath(region: string | null): string[] {
	if (!region) return [];

	// Separar por '/' o '>' para crear la jerarquía
	return region.split(/[\/|>]/).map((r) => r.trim());
}

// Exportar funciones obsoletas con alias para mantener compatibilidad
export const toPlaceComplete = fromPrismaPlace;
export const fromPlaceComplete = toPrismaPlace;
