/**
 * @file Serializadoreconst deserializeArray = <T>(jsonString: string | null, fieldName: string): T[] => {
	if (!jsonString) return [];
	return safeJsonParse<T[]>(jsonString, []);
};ara la entidad WorldItem
 * @module transformers/world-item/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { safeJsonParse } from '@/lib/utils/json';
import type { WorldItemEffect, WorldItemProperty, WorldItemRequirement } from '@/types/entities/world-item';

// Tipos para serializers compatibles
type WorldItemAttribute = {
	name: string;
	value: string | number;
	description?: string;
};

type WorldItemFilter = {
	property: string;
	operator: string;
	value: unknown;
};

type WorldItemStat = {
	name: string;
	value: number;
	type?: string;
};

const logger = serverLogger.withContext('WorldItemSerializers');

const serializeArray = <T>(data: T[] | string, fieldName: string): string => {
	try {
		if (typeof data === 'string') return data;
		return data?.length > 0 ? JSON.stringify(data) : '[]';
	} catch (error) {
		logger.error(`Error serializando ${fieldName}`, { error });
		return '[]';
	}
};

const deserializeArray = <T>(jsonString: string | null | undefined, fieldName: string): T[] => {
	if (!jsonString) return [];

	// Si el string no parece JSON válido (no empieza con [ o {), tratarlo como array de strings
	const trimmed = jsonString.trim();
	if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
		// Tratar como string simple o lista separada por comas
		if (trimmed.includes(',')) {
			return trimmed
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean) as T[];
		}
		return [trimmed] as T[];
	}

	return safeJsonParse<T[]>(jsonString, []);
};

// Attributes
export const serializeAttributes = (data: WorldItemAttribute[] | string): string => serializeArray(data, 'attributes');
export const deserializeAttributes = (json: string | null): WorldItemAttribute[] =>
	deserializeArray(json, 'attributes');

// Effects
export const serializeEffects = (data: WorldItemEffect[] | string): string => serializeArray(data, 'effects');
export const deserializeEffects = (json: string | null): WorldItemEffect[] => deserializeArray(json, 'effects');

// Requirements
export const serializeRequirements = (data: WorldItemRequirement[] | string): string =>
	serializeArray(data, 'requirements');
export const deserializeRequirements = (json: string | null): WorldItemRequirement[] =>
	deserializeArray(json, 'requirements');

// Stats
export const serializeStats = (data: WorldItemStat[] | string): string => serializeArray(data, 'stats');
export const deserializeStats = (json: string | null): WorldItemStat[] => deserializeArray(json, 'stats');

// Properties
export const serializeProperties = (data: WorldItemProperty[] | string): string => serializeArray(data, 'properties');
export const deserializeProperties = (json: string | null): WorldItemProperty[] => deserializeArray(json, 'properties');

// Filters
export const serializeFilters = (data: WorldItemFilter[] | string): string => serializeArray(data, 'filters');
export const deserializeFilters = (json: string | null): WorldItemFilter[] => deserializeArray(json, 'filters');

// Tags
export const serializeTags = (data: string[] | string): string => serializeArray(data, 'tags');
export const deserializeTags = (json: string | null): string[] => deserializeArray(json, 'tags');

/**
 * Extiende un WorldItem con datos adicionales
 */
export function extendWorldItem(item: Record<string, unknown>): Record<string, unknown> {
	if (!item) return item;

	return {
		...item,
		// Agregar extensiones aquí según sea necesario
	};
}

/**
 * Extiende múltiples WorldItems con datos adicionales
 */
export function extendWorldItems(items: Record<string, unknown>[]): Record<string, unknown>[] {
	if (!items || !Array.isArray(items)) return [];

	return items.map(extendWorldItem);
}
