/**
 * @file Funciones de serialización/deserialización para la entidad Collection.
 * @module transformers/collection/serializers
 * @description Contiene funciones para manejar la serialización de campos complejos (JSON) de la entidad Collection.
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type {
    CollectionCreateInput,
    CollectionEdition,
    CollectionFilter,
    CollectionSortBy,
    CollectionUpdateInput,
} from '@/types/entities/collection';

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleCollectionCreateInput = {
	name: string;
	description?: string | null;
	filters?: string;
	sortBy?: string;
	editions?: string;
	// Las relaciones se manejan por separado en Drizzle
};

type DrizzleCollectionUpdateInput = {
	name?: string;
	description?: string | null;
	filters?: string;
	sortBy?: string;
	editions?: string;
	// Las relaciones se manejan por separado en Drizzle
};

const logger = serverLogger.withContext('CollectionSerializers');

/**
 * 🔄 Deserializa el campo `filters` de una Collection.
 * ✅ MIGRADO A DRIZZLE
 * @param jsonString El string JSON que representa los filtros.
 * @returns Un array de `CollectionFilter`.
 * @throws {TransformerError} si el JSON es inválido.
 */
export function deserializeFilters(jsonString: string | null | undefined): CollectionFilter[] {
	if (!jsonString || jsonString === '[]') {
		return [];
	}
	try {
		const parsed = JSON.parse(jsonString);
		// Aquí se podría añadir una validación más estricta del tipo CollectionFilter[]
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error(`Error deserializando 'filters'`, { error, jsonString });
		throw new TransformerError(`El formato del campo 'filters' es inválido.`);
	}
}

/**
 * 🔄 Serializa el campo `filters` de una Collection.
 * ✅ MIGRADO A DRIZZLE
 * @param data El array de `CollectionFilter`.
 * @returns El string JSON.
 * @throws {TransformerError} si la serialización falla.
 */
export function serializeFilters(data: CollectionFilter[] | null | undefined): string {
	if (!data || data.length === 0) {
		return '[]';
	}
	try {
		return JSON.stringify(data);
	} catch (error) {
		logger.error(`Error serializando 'filters'`, { error, data });
		throw new TransformerError(`No se pudo serializar el campo 'filters'.`);
	}
}

/**
 * 🔄 Deserializa el campo `sortBy` de una Collection.
 * ✅ MIGRADO A DRIZZLE
 * @param jsonString El string JSON que representa el orden.
 * @returns Un objeto `CollectionSortBy`.
 * @throws {TransformerError} si el JSON es inválido.
 */
export function deserializeSortBy(jsonString: string | null | undefined): CollectionSortBy | null {
	if (!jsonString || jsonString === '{}') {
		return null;
	}
	try {
		const parsed = JSON.parse(jsonString);
		return typeof parsed === 'object' && parsed !== null ? parsed : null;
	} catch (error) {
		logger.error(`Error deserializando 'sortBy'`, { error, jsonString });
		throw new TransformerError(`El formato del campo 'sortBy' es inválido.`);
	}
}

/**
 * 🔄 Serializa el campo `sortBy` de una Collection.
 * ✅ MIGRADO A DRIZZLE
 * @param data El objeto `CollectionSortBy`.
 * @returns El string JSON.
 * @throws {TransformerError} si la serialización falla.
 */
export function serializeSortBy(data: CollectionSortBy | null | undefined): string {
	if (!data) {
		return '{}';
	}
	try {
		return JSON.stringify(data);
	} catch (error) {
		logger.error(`Error serializando 'sortBy'`, { error, data });
		throw new TransformerError(`No se pudo serializar el campo 'sortBy'.`);
	}
}

/**
 * 🔄 Deserializa el campo `editions` de una Collection.
 * ✅ MIGRADO A DRIZZLE
 * @param jsonString El string JSON que representa las ediciones.
 * @returns Un array de `CollectionEdition`.
 * @throws {TransformerError} si el JSON es inválido.
 */
export function deserializeEditions(jsonString: string | null | undefined): CollectionEdition[] {
	if (!jsonString || jsonString === '[]') {
		return [];
	}
	try {
		const parsed = JSON.parse(jsonString);
		// Aquí se podría añadir una validación más estricta del tipo CollectionEdition[]
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error(`Error deserializando 'editions'`, { error, jsonString });
		throw new TransformerError(`El formato del campo 'editions' es inválido.`);
	}
}

/**
 * 🔄 Serializa el campo `editions` de una Collection.
 * ✅ MIGRADO A DRIZZLE
 * @param data El array de `CollectionEdition`.
 * @returns El string JSON.
 * @throws {TransformerError} si la serialización falla.
 */
export function serializeEditions(data: CollectionEdition[] | null | undefined): string {
	if (!data || data.length === 0) {
		return '[]';
	}
	try {
		return JSON.stringify(data);
	} catch (error) {
		logger.error(`Error serializando 'editions'`, { error, data });
		throw new TransformerError(`No se pudo serializar el campo 'editions'.`);
	}
}

/**
 * 🔄 Serializa los datos para crear una colección en Drizzle.
 * ✅ MIGRADO A DRIZZLE
 */
export function toDrizzleCollectionCreate(data: CollectionCreateInput): DrizzleCollectionCreateInput {
	const { imageIds, tagIds, groupIds, propertyIds, wildcardIds, ...rest } = data;

	// En Drizzle, las relaciones se manejan por separado
	// Los IDs se almacenan como metadata o se crean relaciones en tablas de unión
	const drizzleData: DrizzleCollectionCreateInput = {
		...rest,
		// Serializar campos JSON si existen
		filters: rest.filters ? serializeFilters(rest.filters) : undefined,
		sortBy: rest.sortBy ? serializeSortBy(rest.sortBy) : undefined,
		editions: rest.editions ? serializeEditions(rest.editions) : undefined,
	};

	return drizzleData;
}

/**
 * 🔄 Serializa los datos para actualizar una colección en Drizzle.
 * ✅ MIGRADO A DRIZZLE
 */
export function toDrizzleCollectionUpdate(data: CollectionUpdateInput): DrizzleCollectionUpdateInput {
	const { imageIds, tagIds, groupIds, propertyIds, wildcardIds, ...rest } = data;

	// En Drizzle, las relaciones se manejan por separado
	const drizzleData: DrizzleCollectionUpdateInput = {
		...rest,
		// Serializar campos JSON si existen
		filters: rest.filters ? serializeFilters(rest.filters) : undefined,
		sortBy: rest.sortBy ? serializeSortBy(rest.sortBy) : undefined,
		editions: rest.editions ? serializeEditions(rest.editions) : undefined,
	};

	return drizzleData;
}

// Mantener funciones legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar toDrizzleCollectionCreate
 */
export const toPrismaCollectionCreate = toDrizzleCollectionCreate;

/**
 * @deprecated Usar toDrizzleCollectionUpdate
 */
export const toPrismaCollectionUpdate = toDrizzleCollectionUpdate;
