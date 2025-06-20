/**
 * @file Funciones para mapear datos de Wildcard entre formatos
 * @module transformers/wildcard/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
	WildcardCreateInput,
	WildcardFilters,
	WildcardSearchOptions,
	WildcardUpdateInput,
} from '@/types/entities/wildcard';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('WildcardMappers');

/**
 * 🔄 Mapea un `WildcardCreateInput` a un objeto compatible con la BD.
 */
export function mapCreateWildcardDataToPrisma(input: WildcardCreateInput): Record<string, any> {
	try {
		const { parentId, children, ...rest } = input;
		return {
			...rest,
			children: children ? JSON.stringify(children) : '[]',
			parent: parentId ? { connect: { id: parentId } } : undefined,
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación de wildcard.', { error, input });
		throw new TransformerError('No se pudieron mapear los datos para crear el wildcard.');
	}
}

/**
 * 🔄 Mapea `WildcardUpdateInput` para actualizar en la BD.
 */
export function mapUpdateWildcardDataToPrisma(input: WildcardUpdateInput): Record<string, any> {
	try {
		const { parentId, children, ...rest } = input;
		const prismaData: Record<string, any> = { ...rest };

		if (parentId !== undefined) {
			prismaData.parent = parentId ? { connect: { id: parentId } } : { disconnect: true };
		}
		if (children) {
			prismaData.children = JSON.stringify(children);
		}
		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de wildcard.', { error, input });
		throw new TransformerError('No se pudieron mapear los datos para actualizar el wildcard.');
	}
}

/**
 * 🔄 Mapea `WildcardSearchOptions` a argumentos de busqueda.
 */
export function mapWildcardSearchOptionsToPrisma(options: WildcardSearchOptions): Record<string, any> {
	const { filters, ...rest } = options;
	return {
		...rest,
		where: filters ? mapWildcardFiltersToPrisma(filters) : undefined,
	};
}

/**
 * 🔄 Mapea `WildcardFilters` a condiciones de busqueda.
 */
function mapWildcardFiltersToPrisma(filters: WildcardFilters): Record<string, any> {
	const where: Record<string, any> = {};

	if (filters.search) {
		where.OR = [
			{ name: { contains: filters.search } },
			{ description: { contains: filters.search } },
		];
	}

	if (filters.category) {
		where.category = { equals: filters.category };
	}

	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}

	if (filters.parentId !== undefined) {
		where.parentId = filters.parentId;
	}

	if (filters.hasChildren !== undefined) {
		where.childWildcards = filters.hasChildren ? { some: {} } : { none: {} };
	}

	return where;
}
