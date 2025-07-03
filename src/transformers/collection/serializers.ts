/**
 * @file Funciones de serialización/deserialización para la entidad Collection.
 * @module transformers/collection/serializers
 * @description Contiene funciones para manejar la serialización de campos complejos (JSON) de la entidad Collection.
 */

import type { Prisma } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type {
	CollectionCreateInput,
	CollectionEdition,
	CollectionFilter,
	CollectionSortBy,
	CollectionUpdateInput,
} from '@/types/entities/collection';

const logger = serverLogger.withContext('CollectionSerializers');

/**
 * 🔄 Deserializa el campo `filters` de una Collection.
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
 * 🔄 Serializa los datos para crear una colección en Prisma.
 */
export function toPrismaCollectionCreate(data: CollectionCreateInput): Prisma.CollectionCreateInput {
	const { imageIds, tagIds, groupIds, propertyIds, wildcardIds, ...rest } = data;
	const prismaData: Prisma.CollectionCreateInput = {
		...rest,
	};

	// Conectar relaciones si existen
	if (imageIds && imageIds.length > 0) {
		prismaData.images = { connect: imageIds.map((id) => ({ id })) };
	}
	if (tagIds && tagIds.length > 0) {
		prismaData.tags = { connect: tagIds.map((id) => ({ id })) };
	}
	if (groupIds && groupIds.length > 0) {
		prismaData.groups = { connect: groupIds.map((id) => ({ id })) };
	}
	if (propertyIds && propertyIds.length > 0) {
		prismaData.properties = { connect: propertyIds.map((id) => ({ id })) };
	}
	if (wildcardIds && wildcardIds.length > 0) {
		prismaData.wildcards = { connect: wildcardIds.map((id) => ({ id })) };
	}

	return prismaData;
}

/**
 * 🔄 Serializa los datos para actualizar una colección en Prisma.
 */
export function toPrismaCollectionUpdate(data: CollectionUpdateInput): Prisma.CollectionUpdateInput {
	const { imageIds, tagIds, groupIds, propertyIds, wildcardIds, ...rest } = data;
	const prismaData: Prisma.CollectionUpdateInput = {
		...rest,
	};

	// Actualizar relaciones si se proporcionan
	if (imageIds !== undefined) {
		prismaData.images = { set: imageIds.map((id) => ({ id })) };
	}
	if (tagIds !== undefined) {
		prismaData.tags = { set: tagIds.map((id) => ({ id })) };
	}
	if (groupIds !== undefined) {
		prismaData.groups = { set: groupIds.map((id) => ({ id })) };
	}
	if (propertyIds !== undefined) {
		prismaData.properties = { set: propertyIds.map((id) => ({ id })) };
	}
	if (wildcardIds !== undefined) {
		prismaData.wildcards = { set: wildcardIds.map((id) => ({ id })) };
	}

	return prismaData;
}
