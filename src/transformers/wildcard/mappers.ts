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
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('WildcardMappers');

/**
 * 🔄 Mapea un `WildcardCreateInput` a un `Prisma.WildcardCreateInput`.
 */
export function mapCreateWildcardDataToPrisma(input: WildcardCreateInput): Prisma.WildcardCreateInput {
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
 * 🔄 Mapea un `WildcardUpdateInput` a un `Prisma.WildcardUpdateInput`.
 */
export function mapUpdateWildcardDataToPrisma(input: WildcardUpdateInput): Prisma.WildcardUpdateInput {
	try {
		const { parentId, children, ...rest } = input;
		const prismaData: Prisma.WildcardUpdateInput = { ...rest };

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
 * 🔄 Mapea `WildcardSearchOptions` a `Prisma.WildcardFindManyArgs`.
 */
export function mapWildcardSearchOptionsToPrisma(options: WildcardSearchOptions): Prisma.WildcardFindManyArgs {
	const { filters, ...rest } = options;
	return {
		...rest,
		where: filters ? mapWildcardFiltersToPrisma(filters) : undefined,
	};
}

/**
 * 🔄 Mapea `WildcardFilters` a `Prisma.WildcardWhereInput`.
 */
function mapWildcardFiltersToPrisma(filters: WildcardFilters): Prisma.WildcardWhereInput {
	const where: Prisma.WildcardWhereInput = {};

	if (filters.search) {
		where.OR = [
			{ name: { contains: filters.search, mode: 'insensitive' } },
			{ description: { contains: filters.search, mode: 'insensitive' } },
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
