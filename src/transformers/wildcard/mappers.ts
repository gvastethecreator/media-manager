/**
 * @file Funciones para mapear y transformar datos de la entidad Wildcard.
 * @module transformers/wildcard/mappers
 * @description Contiene funciones para:
 *              1. Transformar la entrada de la app a tipos de Prisma (create/update).
 *              2. Transformar los datos de Prisma a tipos enriquecidos de la app (WildcardWithStats).
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { safeJsonParse } from '@/lib/utils/json';
import {
    PrismaWildcardWithCounts,
    WildcardCreateInput,
    WildcardSearchOptions,
    WildcardUpdateInput,
    WildcardWithStats,
} from '@/types/entities/wildcard';
import { calculateCompleteness } from '@/utils/transformers/calculate-completeness';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('WildcardMappers');

/**
 * 🃏 Transforma un objeto Wildcard de Prisma a un objeto WildcardWithStats enriquecido.
 *
 * @param wildcard - El objeto de la base de datos, incluyendo los `_count` de relaciones.
 * @returns Un objeto WildcardWithStats con campos JSON parseados y estadísticas calculadas.
 */
export function toWildcardWithStats(wildcard: PrismaWildcardWithCounts): WildcardWithStats {
	const { _count, ...rest } = wildcard;

	const completenessFields = [rest.description, rest.category, rest.type];
	const relationCounts = [
		_count?.images ?? 0,
		_count?.notes ?? 0,
		_count?.characters ?? 0,
		_count?.places ?? 0,
		_count?.tags ?? 0,
	];

	const popularity = relationCounts.reduce((sum, count) => sum + count, 0);
	const usageDiversity = relationCounts.filter(count => count > 0).length;

	const stats: WildcardWithStats = {
		...rest,
		properties: safeJsonParse(rest.properties, null),
		children: safeJsonParse(rest.children, []),
		_stats: {
			popularity,
			usageDiversity,
			completenessScore: calculateCompleteness(completenessFields),
			// TODO: Implementar una lógica más sofisticada para la adaptabilidad.
			adaptabilityScore: (usageDiversity / 5) * 100,
		},
		_count,
	};

	return stats;
}

/**
 * 🔄 Mapea un `WildcardCreateInput` a un `Prisma.WildcardCreateInput`.
 */
export function mapCreateWildcardDataToPrisma(input: WildcardCreateInput): Prisma.WildcardCreateInput {
	try {
		// Los campos de relaciones como `tags` no están en el tipo base de Prisma,
		// por lo que usamos 'as any' para evitar errores de tipo aquí.
		const { tags, ...rest } = input as any;

		return {
			...rest,
			children: input.children ? JSON.stringify(input.children) : '[]',
			properties: input.properties ? JSON.stringify(input.properties) : '{}',
			tags: tags ? { connect: tags.map((id: string) => ({ id })) } : undefined,
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
		const { tags, ...rest } = input as any;
		const data: Prisma.WildcardUpdateInput = { ...rest };

		if (input.children) data.children = JSON.stringify(input.children);
		if (input.properties) data.properties = JSON.stringify(input.properties);
		if (tags) data.tags = { set: tags.map((id: string) => ({ id })) };

		return data;
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
	const where = filters ? mapWildcardFiltersToPrisma(filters) : undefined;

	return {
		...rest,
		where,
		include: {
			_count: {
				select: {
					tags: true,
					images: true,
					characters: true,
					places: true,
					notes: true,
				},
			},
		},
	};
}

/**
 * 🔄 Mapea `WildcardFilters` a `Prisma.WildcardWhereInput`.
 */
function mapWildcardFiltersToPrisma(filters: NonNullable<WildcardSearchOptions['filters']>): Prisma.WildcardWhereInput {
	const where: Prisma.WildcardWhereInput = {};

	if (filters.searchQuery) {
		where.OR = [
			{ name: { contains: filters.searchQuery, mode: 'insensitive' } },
			{ description: { contains: filters.searchQuery, mode: 'insensitive' } },
		];
	}

	if (filters.categories && filters.categories.length > 0) {
		where.category = { in: filters.categories };
	}

	if (filters.onlyFavorites !== undefined) {
		where.isFavorite = filters.onlyFavorites;
	}

	if (filters.parentId !== undefined) {
		where.parentId = filters.parentId;
	}

	if (filters.hasChildren !== undefined) {
		where.childWildcards = filters.hasChildren ? { some: {} } : { none: {} };
	}

	return where;
}
