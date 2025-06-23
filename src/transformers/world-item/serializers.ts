/**
 * @file Serializadores para la entidad WorldItem
 * @module transformers/world-item/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    WorldItemAttribute,
    WorldItemEffect,
    WorldItemFilter,
    WorldItemProperty,
    WorldItemRequirement,
    WorldItemStat
} from '@/types/entities/world-item';
import { safeJsonParse } from '@/lib/utils/json';

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
    return safeJsonParse<T[]>(jsonString, `deserializando ${fieldName}`).unwrapOr([]);
};


// Attributes
export const serializeAttributes = (data: WorldItemAttribute[] | string): string => serializeArray(data, 'attributes');
export const deserializeAttributes = (json: string | null): WorldItemAttribute[] => deserializeArray(json, 'attributes');

// Effects
export const serializeEffects = (data: WorldItemEffect[] | string): string => serializeArray(data, 'effects');
export const deserializeEffects = (json: string | null): WorldItemEffect[] => deserializeArray(json, 'effects');

// Requirements
export const serializeRequirements = (data: WorldItemRequirement[] | string): string => serializeArray(data, 'requirements');
export const deserializeRequirements = (json: string | null): WorldItemRequirement[] => deserializeArray(json, 'requirements');

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
