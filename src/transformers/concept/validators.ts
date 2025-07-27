/**
 * @file Validadores para la entidad Concept.
 * @module transformers/concept/validators
 * @description Funciones de validación usando esquemas Zod para Concept.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
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
		return ConceptStatisticsSchema.parse(data);
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
		return ConceptWithStatsSchema.parse(transformedData);
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
	const conceptStats = {
		imageCount: data._count?.images ?? 0,
		videoCount: data._count?.videos ?? 0,
		noteCount: data._count?.notes ?? 0,
		albumCount: data._count?.albums ?? 0,
		collectionCount: data._count?.collections ?? 0,
		tagCount: data._count?.tags ?? 0,
		characterCount: data._count?.characters ?? 0,
		placeCount: data._count?.places ?? 0,
		worldItemCount: data._count?.worldItems ?? 0,
		propertyCount: data._count?.properties ?? 0,
		groupCount: data._count?.groups ?? 0,
		wildcardCount: data._count?.wildcards ?? 0,
		promptCount: data._count?.prompts ?? 0,
		totalAssociations:
			(data._count?.images ?? 0) +
			(data._count?.videos ?? 0) +
			(data._count?.notes ?? 0) +
			(data._count?.albums ?? 0) +
			(data._count?.collections ?? 0) +
			(data._count?.tags ?? 0) +
			(data._count?.characters ?? 0) +
			(data._count?.places ?? 0) +
			(data._count?.worldItems ?? 0) +
			(data._count?.properties ?? 0) +
			(data._count?.groups ?? 0) +
			(data._count?.wildcards ?? 0) +
			(data._count?.prompts ?? 0),
		lastUpdated: new Date(),
	};

	return {
		...data,
		entityType: 'concept' as const,
		statistics: conceptStats,
		stats: conceptStats,
		_count: data._count || {},
	};
}
