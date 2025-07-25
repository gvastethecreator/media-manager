/**
 * @file Funciones para mapear y transformar datos de la entidad Wildcard.
 * @module transformers/wildcard/mappers
 * @description Contiene funciones para:
 *              1. Transformar la entrada de la app a tipos locales de Drizzle.
 *              2. Transformar los datos de Drizzle a tipos enriquecidos de la app (WildcardWithStats).
 
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { safeJsonParse } from '@/lib/utils/json';
import { calculateCompleteness } from '@/lib/utils/transformers/calculate-completeness';
import { TransformerError } from '@/lib/utils/transformers/errors';
import {
	WildcardCreateInput,
	WildcardStatistics,
	WildcardUpdateInput,
	WildcardWithCounts,
	WildcardWithStats,
} from '@/types/entities/wildcard';

const logger = serverLogger.withContext('WildcardMappers');

/**
 * 🃏 Transforma un objeto Wildcard de Drizzle a un objeto WildcardWithStats enriquecido.
 *
 * @param wildcard - El objeto de la base de datos, incluyendo los `_count` de relaciones.
 * @returns Un objeto WildcardWithStats con campos JSON parseados y estadísticas calculadas.
 */
export function toWildcardWithStats(wildcard: WildcardWithCounts): WildcardWithStats {
	const { _count, ...rest } = wildcard;

	const completenessFields = [rest.description, rest.category];
	const relationCounts = [
		_count?.images ?? 0,
		_count?.notes ?? 0,
		_count?.characters ?? 0,
		_count?.places ?? 0,
		_count?.tags ?? 0,
	];

	const popularity = relationCounts.reduce((sum, count) => sum + count, 0);
	const usageDiversity = relationCounts.filter((count) => count > 0).length;

	const statistics: WildcardStatistics = {
		popularity,
		usageDiversity,
		completenessScore: calculateCompleteness(completenessFields),
		// Lógica de adaptabilidad basada en diversidad de uso
		adaptabilityScore: (usageDiversity / 5) * 100,
	};

	const result: WildcardWithStats = {
		...rest,
		entityType: 'wildcard' as const,
		statistics,
		_count,
	};

	return result;
}

/**
 * 🔄 Mapea un `WildcardCreateInput` a datos para inserción en Drizzle.
 */
export function mapCreateWildcardData(input: WildcardCreateInput): WildcardCreateInput {
	try {
		return {
			...input,
			children: input.children ? JSON.stringify(input.children) : null,
			// Asegurar valores por defecto
			description: input.description ?? null,
			emoji: input.emoji ?? null,
			color: input.color ?? null,
			category: input.category ?? null,
			shortcut: input.shortcut ?? null,
			featuredImage: input.featuredImage ?? null,
			isFavorite: input.isFavorite ?? false,
			parentId: input.parentId ?? null,
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación de wildcard.', { error, input });
		throw new TransformerError('No se pudieron mapear los datos para crear el wildcard.');
	}
}

/**
 * 🔄 Mapea un `WildcardUpdateInput` a datos para actualización en Drizzle.
 */
export function mapUpdateWildcardData(input: WildcardUpdateInput): WildcardUpdateInput {
	try {
		const data: WildcardUpdateInput = { ...input };

		// Convertir children a JSON si está presente
		if (input.children !== undefined) {
			data.children = input.children ? JSON.stringify(input.children) : null;
		}

		return data;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de wildcard.', { error, input });
		throw new TransformerError('No se pudieron mapear los datos para actualizar el wildcard.');
	}
}

/**
 * 🔄 Mapea filtros de búsqueda a condiciones WHERE de Drizzle.
 */
export function mapWildcardFilters(filters: {
	searchQuery?: string;
	categories?: string[];
	onlyFavorites?: boolean;
	parentId?: string | null;
	hasChildren?: boolean;
}) {
	const conditions: any[] = [];

	if (filters.searchQuery) {
		// En Drizzle, esto se manejará con like() en el servicio
		return { searchQuery: filters.searchQuery };
	}

	if (filters.categories && filters.categories.length > 0) {
		return { categories: filters.categories };
	}

	if (filters.onlyFavorites !== undefined) {
		return { onlyFavorites: filters.onlyFavorites };
	}

	if (filters.parentId !== undefined) {
		return { parentId: filters.parentId };
	}

	if (filters.hasChildren !== undefined) {
		return { hasChildren: filters.hasChildren };
	}

	return filters;
}
