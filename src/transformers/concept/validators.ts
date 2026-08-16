/**
 * @file Validadores para la entidad Concept.
 * @module transformers/concept/validators
 * @description Funciones de validación usando esquemas Zod para Concept.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import { createDefaultEntityStats } from '@/lib/utils';
import { normalizeCounts, sumCounts, STANDARD_COUNT_KEYS } from '../common/counts';
import type { ConceptBase, ConceptStats, ConceptWithStats } from '@/types/entities/concept';
import {
	ConceptBaseSchema,
	ConceptCountsSchema,
	ConceptCreateSchema,
	ConceptFiltersSchema,
	ConceptSortOptionsSchema,
	ConceptStatisticsSchema,
	ConceptUpdateSchema,
	ConceptWithStatsSchema,
} from './schema';

const logger = serverLogger.withContext('ConceptValidators');

/**
 * 🛡️ Valida un objeto ConceptBase.
 *
 * @param data - Datos a validar.
 * @returns Los datos validados como ConceptBase.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateConceptBase(data: unknown): ConceptBase {
	try {
		return ConceptBaseSchema.parse(data);
	} catch (error) {
		logger.error('Error validando ConceptBase', { error, data });
		throw new TransformerError('Los datos de Concept base no son válidos');
	}
}

/**
 * 📊 Valida un objeto ConceptStatistics.
 *
 * @param data - Datos a validar.
 * @returns Los datos validados como ConceptStatistics.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateConceptStatistics(data: unknown): ConceptStats {
	try {
		const d = data as any;
		const withDefaults = {
			...createDefaultEntityStats({ type: 'concept' }),
			isDirectory: false,
			isFile: true,
			...d,
		};
		ConceptStatisticsSchema.parse(withDefaults);
		return withDefaults as ConceptStats;
	} catch (error) {
		logger.error('Error validando ConceptStatistics', { error, data });
		throw new TransformerError('Los datos de estadísticas de Concept no son válidos');
	}
}

/**
 * ✨ Valida un objeto ConceptWithStats.
 *
 * @param data - Datos a validar.
 * @returns Los datos validados como ConceptWithStats.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateConceptWithStats(data: unknown): ConceptWithStats {
	try {
		// Primero transformar los datos para agregar statistics
		const transformedData = transformConceptWithStats(data);
		// El schema valida forma mínima; mantener stats completos hacia fuera
		const parsed = ConceptWithStatsSchema.parse(transformedData);
		return { ...(parsed as any), stats: transformedData.stats } as ConceptWithStats;
	} catch (error) {
		logger.error('Error validando ConceptWithStats', { error, data });
		throw new TransformerError('Los datos de Concept con estadísticas no son válidos');
	}
}

/**
 * 🔢 Valida conteos de relaciones desde Drizzle.
 *
 * @param data - Datos de conteos a validar.
 * @returns Los datos validados con estructura de conteos.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateConceptCounts(data: unknown) {
	try {
		return ConceptCountsSchema.parse(data);
	} catch (error) {
		logger.error('Error validando conteos de Concept', { error, data });
		throw new TransformerError('Los datos de conteos de Concept no son válidos');
	}
}

/**
 * 📝 Valida datos para crear un Concept.
 *
 * @param data - Datos de creación a validar.
 * @returns Los datos validados para crear.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateConceptCreate(data: unknown) {
	try {
		return ConceptCreateSchema.parse(data);
	} catch (error) {
		logger.error('Error validando datos de creación de Concept', { error, data });
		throw new TransformerError('Los datos para crear Concept no son válidos');
	}
}

/**
 * ✏️ Valida datos para actualizar un Concept.
 *
 * @param data - Datos de actualización a validar.
 * @returns Los datos validados para actualizar.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateConceptUpdate(data: unknown) {
	try {
		return ConceptUpdateSchema.parse(data);
	} catch (error) {
		logger.error('Error validando datos de actualización de Concept', { error, data });
		throw new TransformerError('Los datos para actualizar Concept no son válidos');
	}
}

/**
 * 🔍 Valida filtros de búsqueda para Concept.
 *
 * @param data - Filtros a validar.
 * @returns Los filtros validados.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateConceptFilters(data: unknown) {
	try {
		return ConceptFiltersSchema.parse(data);
	} catch (error) {
		logger.error('Error validando filtros de Concept', { error, data });
		throw new TransformerError('Los filtros de Concept no son válidos');
	}
}

/**
 * 📋 Valida opciones de ordenamiento para Concept.
 *
 * @param data - Opciones de ordenamiento a validar.
 * @returns Las opciones validadas.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateConceptSortOptions(data: unknown) {
	try {
		return ConceptSortOptionsSchema.parse(data);
	} catch (error) {
		logger.error('Error validando opciones de ordenamiento de Concept', { error, data });
		throw new TransformerError('Las opciones de ordenamiento de Concept no son válidas');
	}
}

/**
 * 🔍 Valida y sanea datos de entrada, aplicando valores por defecto.
 *
 * @param data - Datos de entrada a sanear.
 * @returns Datos saneados y validados.
 */
export function sanitizeConceptData(data: Partial<ConceptBase>): Partial<ConceptBase> {
	const sanitized: Partial<ConceptBase> = { ...data };

	// Sanear strings
	if (typeof sanitized.name === 'string') {
		sanitized.name = sanitized.name.trim();
	}
	if (typeof sanitized.description === 'string') {
		sanitized.description = sanitized.description.trim() || null;
	}
	if (typeof sanitized.color === 'string') {
		sanitized.color = sanitized.color.trim();
	}
	if (typeof sanitized.emoji === 'string') {
		sanitized.emoji = sanitized.emoji.trim();
	}

	// Valores por defecto para booleanos
	if (sanitized.isFavorite === undefined) {
		sanitized.isFavorite = false;
	}

	return sanitized;
}

/**
 * 📊 Transforma datos de Drizzle con conteos a ConceptWithStats.
 *
 * @param data - Datos de Concept con conteos de Drizzle.
 * @returns Concept con estadísticas estructuradas.
 */
export function transformConceptWithStats(data: any): ConceptWithStats {
	const counts = normalizeCounts(data._count);
	const conceptStats = {
		imageCount: counts.images,
		videoCount: counts.videos,
		noteCount: counts.notes,
		albumCount: counts.albums,
		collectionCount: counts.collections,
		tagCount: counts.tags,
		characterCount: counts.characters,
		placeCount: counts.places,
		worldItemCount: counts.worldItems,
		propertyCount: counts.properties,
		groupCount: counts.groups,
		wildcardCount: counts.wildcards,
		promptCount: counts.prompts,
		totalAssociations: sumCounts(data._count, STANDARD_COUNT_KEYS),
		lastUpdated: new Date(),
	};

	const mergedStats = {
		...createDefaultEntityStats({ type: 'concept' }),
		isDirectory: false,
		isFile: true,
		...conceptStats,
	} as ConceptStats;
	// Validar estructura conocida pero permitir extras
	ConceptStatisticsSchema.parse(mergedStats);

	return {
		...data,
		entityType: 'concept' as const,
		statistics: mergedStats,
		stats: mergedStats,
		_count: data._count || {},
	};
}
