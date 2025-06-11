/**
 * @file Validadores para la entidad Place
 * @module utils/place/validators
 */

import { z } from 'zod';
import {
        PlaceCategory,
        type PlaceDanger,
        type PlaceFilters,
        type PlaceResource,
        type PlaceStats,
        PlaceType,
} from '../../types/entities/place';
import { ClimateType, DangerLevel, GovernmentType } from '../../types/entities/place/enums';

/**
 * Esquema para validar un lugar
 */
export const placeSchema = z.object({
	name: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre es demasiado largo'),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	region: z.string().nullable().optional(),
	type: z.nativeEnum(PlaceType).nullable().optional(),
	climate: z.nativeEnum(ClimateType).nullable().optional(),
	population: z.number().int().positive().nullable().optional(),
	government: z.nativeEnum(GovernmentType).nullable().optional(),
	category: z.nativeEnum(PlaceCategory).nullable().optional(),
	lore: z.string().nullable().optional(),
	history: z.string().nullable().optional(),
	isFavorite: z.boolean().optional().default(false),
});

/**
 * Esquema para validar un peligro de lugar
 */
export const placeDangerSchema = z.object({
	name: z.string().min(1, 'El nombre del peligro es obligatorio'),
	description: z.string().optional(),
	level: z.nativeEnum(DangerLevel).optional(),
	location: z.string().optional(),
});

/**
 * Esquema para validar un recurso de lugar
 */
export const placeResourceSchema = z.object({
	name: z.string().min(1, 'El nombre del recurso es obligatorio'),
	description: z.string().optional(),
	rarity: z.string().optional(),
	amount: z.string().optional(),
});

/**
 * Esquema para validar estadísticas de lugar
 */
export const placeStatsSchema = z.object({
	population: z.number().int().positive().optional(),
	size: z.string().optional(),
	wealth: z.string().optional(),
	militaryPower: z.string().optional(),
	magicalInfluence: z.string().optional(),
	stability: z.string().optional(),
	reputation: z.string().optional(),
	technologicalLevel: z.string().optional(),
	customStats: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

/**
 * Esquema para validar filtros de lugar
 */
export const placeFiltersSchema = z.object({
        searchQuery: z.string().optional(),
        categories: z.array(z.string()).optional(),
        types: z.array(z.string()).optional(),
        climates: z.array(z.string()).optional(),
        governments: z.array(z.string()).optional(),
        dangerLevels: z.array(z.string()).optional(),
        populationRange: z
                .object({
                        min: z.number().int().optional(),
                        max: z.number().int().optional(),
                })
                .optional(),
        onlyFavorites: z.boolean().optional(),
        hasImages: z.boolean().optional(),
        hasNotes: z.boolean().optional(),
        hasConcepts: z.boolean().optional(),
        hasPrompts: z.boolean().optional(),
});

/**
 * Valida un objeto Place
 * @param place Lugar a validar
 * @returns Objeto de resultado de validación
 */
export function validatePlace(place: unknown) {
	return placeSchema.safeParse(place);
}

/**
 * Valida un array de peligros de lugar
 * @param dangers Array de peligros
 * @returns Objeto de resultado de validación
 */
export function validatePlaceDangers(dangers: unknown) {
	return z.array(placeDangerSchema).safeParse(dangers);
}

/**
 * Valida un array de recursos de lugar
 * @param resources Array de recursos
 * @returns Objeto de resultado de validación
 */
export function validatePlaceResources(resources: unknown) {
	return z.array(placeResourceSchema).safeParse(resources);
}

/**
 * Valida estadísticas de lugar
 * @param stats Objeto de estadísticas
 * @returns Objeto de resultado de validación
 */
export function validatePlaceStats(stats: unknown) {
	return placeStatsSchema.safeParse(stats);
}

/**
 * Valida filtros de lugar
 * @param filters Objeto de filtros
 * @returns Objeto de resultado de validación
 */
export function validatePlaceFilters(filters: unknown) {
	return placeFiltersSchema.safeParse(filters);
}

/**
 * Parsea y valida peligros desde JSON
 * @param dangersJson JSON string de peligros
 * @returns Peligros validados o null si es inválido
 */
export function parseAndValidateDangers(dangersJson: string | null): PlaceDanger[] | null {
        if (!dangersJson) return [];

	try {
		const dangers = JSON.parse(dangersJson);
                const validationResult = validatePlaceDangers(dangers);

                if (validationResult.success) {
                        return validationResult.data as PlaceDanger[];
                }
		console.error('Validación de peligros fallida:', validationResult.error);
		return null;
	} catch (error) {
		console.error('Error al parsear peligros:', error);
		return null;
	}
}

/**
 * Parsea y valida recursos desde JSON
 * @param resourcesJson JSON string de recursos
 * @returns Recursos validados o null si es inválido
 */
export function parseAndValidateResources(resourcesJson: string | null): PlaceResource[] | null {
        if (!resourcesJson) return [];

	try {
		const resources = JSON.parse(resourcesJson);
                const validationResult = validatePlaceResources(resources);

                if (validationResult.success) {
                        return validationResult.data as PlaceResource[];
                }
		console.error('Validación de recursos fallida:', validationResult.error);
		return null;
	} catch (error) {
		console.error('Error al parsear recursos:', error);
		return null;
	}
}

/**
 * Parsea y valida estadísticas desde JSON
 * @param statsJson JSON string de estadísticas
 * @returns Estadísticas validadas o null si es inválido
 */
export function parseAndValidateStats(statsJson: string | null): PlaceStats | null {
        if (!statsJson) return {};

	try {
		const stats = JSON.parse(statsJson);
                const validationResult = validatePlaceStats(stats);

                if (validationResult.success) {
                        return validationResult.data as PlaceStats;
                }
		console.error('Validación de estadísticas fallida:', validationResult.error);
		return null;
	} catch (error) {
		console.error('Error al parsear estadísticas:', error);
		return null;
	}
}

/**
 * Parsea y valida filtros desde JSON
 * @param filtersJson JSON string de filtros
 * @returns Filtros validados o null si es inválido
 */
export function parseAndValidateFilters(filtersJson: string | null): PlaceFilters | null {
        if (!filtersJson) return {};

	try {
		const filters = JSON.parse(filtersJson);
                const validationResult = validatePlaceFilters(filters);

                if (validationResult.success) {
                        return validationResult.data as PlaceFilters;
                }
		console.error('Validación de filtros fallida:', validationResult.error);
		return null;
	} catch (error) {
		console.error('Error al parsear filtros:', error);
		return null;
	}
}
