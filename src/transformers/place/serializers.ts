/**
 * @file Funciones de serialización y utilidades para la entidad Place
 * @module transformers/place/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { PlaceDanger, PlaceFilters, PlaceResource, PlaceStats } from '@/types/entities/place';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('PlaceSerializers');

/**
 * 💾 Serializa un array de `PlaceDanger` a un string JSON.
 * @param dangers Array de peligros a serializar.
 * @returns Un string JSON.
 * @throws {TransformerError} Si la serialización falla.
 */
export function serializePlaceDangers(dangers: PlaceDanger[]): string {
	try {
		return JSON.stringify(dangers);
	} catch (error) {
		logger.error('Error serializando los peligros del lugar', { error, dangers });
		throw new TransformerError('No se pudieron serializar los peligros del lugar.');
	}
}

/**
 * 🔍 Deserializa un string JSON a un array de `PlaceDanger`.
 * @param dangersJson String JSON de peligros.
 * @returns Un array de `PlaceDanger`.
 * @throws {TransformerError} Si la deserialización falla o el input es inválido.
 */
export function deserializePlaceDangers(dangersJson: string | null | undefined): PlaceDanger[] {
	if (!dangersJson) return [];
	try {
		const parsed = JSON.parse(dangersJson);
		// Aquí se podría añadir una validación con Zod si hubiera un schema para PlaceDanger
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando los peligros del lugar', { error, dangersJson });
		throw new TransformerError('El formato de los peligros del lugar es inválido.');
	}
}

/**
 * 💾 Serializa un array de `PlaceResource` a un string JSON.
 */
export function serializePlaceResources(resources: PlaceResource[]): string {
	try {
		return JSON.stringify(resources);
	} catch (error) {
		logger.error('Error serializando los recursos del lugar', { error, resources });
		throw new TransformerError('No se pudieron serializar los recursos del lugar.');
	}
}

/**
 * 🔍 Deserializa un string JSON a un array de `PlaceResource`.
 */
export function deserializePlaceResources(resourcesJson: string | null | undefined): PlaceResource[] {
	if (!resourcesJson) return [];
	try {
		const parsed = JSON.parse(resourcesJson);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error('Error deserializando los recursos del lugar', { error, resourcesJson });
		throw new TransformerError('El formato de los recursos del lugar es inválido.');
	}
}

/**
 * 💾 Serializa un objeto `PlaceStats` a un string JSON.
 */
export function serializePlaceStats(stats: PlaceStats): string {
	try {
		return JSON.stringify(stats);
	} catch (error) {
		logger.error('Error serializando las estadísticas del lugar', { error, stats });
		throw new TransformerError('No se pudieron serializar las estadísticas del lugar.');
	}
}

/**
 * 🔍 Deserializa un string JSON a un objeto `PlaceStats`.
 */
export function deserializePlaceStats(statsJson: string | null | undefined): PlaceStats | null {
	if (!statsJson) return null;
	try {
		return JSON.parse(statsJson) as PlaceStats;
	} catch (error) {
		logger.error('Error deserializando las estadísticas del lugar', { error, statsJson });
		throw new TransformerError('El formato de las estadísticas del lugar es inválido.');
	}
}

/**
 * 💾 Serializa un objeto `PlaceFilters` a un string JSON.
 */
export function serializePlaceFilters(filters: PlaceFilters): string {
	try {
		return JSON.stringify(filters);
	} catch (error) {
		logger.error('Error serializando los filtros del lugar', { error, filters });
		throw new TransformerError('No se pudieron serializar los filtros del lugar.');
	}
}

/**
 * 🔍 Deserializa un string JSON a un objeto `PlaceFilters`.
 */
export function deserializePlaceFilters(filtersJson: string | null | undefined): PlaceFilters | null {
	if (!filtersJson) return null;
	try {
		return JSON.parse(filtersJson) as PlaceFilters;
	} catch (error) {
		logger.error('Error deserializando los filtros del lugar', { error, filtersJson });
		throw new TransformerError('El formato de los filtros del lugar es inválido.');
	}
}
