/**
 * @file Validadores para la entidad Collection.
 * @module transformers/collection/validators
 * @description Funciones de validación usando esquemas Zod para Collection.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type { CollectionBase, CollectionStatistics, CollectionWithStats } from '@/types/entities/collection';
import {
	CollectionBaseSchema,
	CollectionCountsSchema,
	CollectionCreateSchema,
	CollectionStatisticsSchema,
	CollectionUpdateSchema,
	CollectionWithStatsSchema,
} from './schema';

const logger = serverLogger.withContext('CollectionValidators');

/**
 * 🛡️ Valida un objeto CollectionBase.
 *
 * @param data - Datos a validar.
 * @returns Los datos validados como CollectionBase.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateCollectionBase(data: unknown): CollectionBase {
	try {
		return CollectionBaseSchema.parse(data);
	} catch (error) {
		logger.error('Error validando CollectionBase', { error, data });
		throw new TransformerError('Los datos de Collection base no son válidos');
	}
}

/**
 * 📊 Valida un objeto CollectionStatistics.
 *
 * @param data - Datos a validar.
 * @returns Los datos validados como CollectionStatistics.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateCollectionStatistics(data: unknown): CollectionStatistics {
	try {
		return CollectionStatisticsSchema.parse(data);
	} catch (error) {
		logger.error('Error validando CollectionStatistics', { error, data });
		throw new TransformerError('Los datos de estadísticas de Collection no son válidos');
	}
}

/**
 * ✨ Valida un objeto CollectionWithStats.
 *
 * @param data - Datos a validar.
 * @returns Los datos validados como CollectionWithStats.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateCollectionWithStats(data: unknown): CollectionWithStats {
	try {
		return CollectionWithStatsSchema.parse(data);
	} catch (error) {
		logger.error('Error validando CollectionWithStats', { error, data });
		throw new TransformerError('Los datos de Collection con estadísticas no son válidos');
	}
}

/**
 * 🔢 Valida conteos de relaciones desde Drizzle.
 *
 * @param data - Datos de conteos a validar.
 * @returns Los datos validados con estructura de conteos.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateCollectionCounts(data: unknown) {
	try {
		return CollectionCountsSchema.parse(data);
	} catch (error) {
		logger.error('Error validando conteos de Collection', { error, data });
		throw new TransformerError('Los datos de conteos de Collection no son válidos');
	}
}

/**
 * 📝 Valida datos para crear una Collection.
 *
 * @param data - Datos de creación a validar.
 * @returns Los datos validados para crear.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateCollectionCreate(data: unknown) {
	try {
		return CollectionCreateSchema.parse(data);
	} catch (error) {
		logger.error('Error validando datos de creación de Collection', { error, data });
		throw new TransformerError('Los datos para crear Collection no son válidos');
	}
}

/**
 * ✏️ Valida datos para actualizar una Collection.
 *
 * @param data - Datos de actualización a validar.
 * @returns Los datos validados para actualizar.
 * @throws {TransformerError} Si la validación falla.
 */
export function validateCollectionUpdate(data: unknown) {
	try {
		return CollectionUpdateSchema.parse(data);
	} catch (error) {
		logger.error('Error validando datos de actualización de Collection', { error, data });
		throw new TransformerError('Los datos para actualizar Collection no son válidos');
	}
}

/**
 * 🔍 Valida y sanea datos de entrada, aplicando valores por defecto.
 *
 * @param data - Datos de entrada a sanear.
 * @returns Datos saneados y validados.
 */
export function sanitizeCollectionData(data: Partial<CollectionBase>): Partial<CollectionBase> {
	const sanitized: Partial<CollectionBase> = { ...data };

	// Sanear strings
	if (typeof sanitized.name === 'string') {
		sanitized.name = sanitized.name.trim();
	}
	if (typeof sanitized.description === 'string') {
		sanitized.description = sanitized.description.trim() || null;
	}
	if (typeof sanitized.emoji === 'string') {
		sanitized.emoji = sanitized.emoji.trim() || null;
	}
	if (typeof sanitized.color === 'string') {
		sanitized.color = sanitized.color.trim() || null;
	}

	// Valores por defecto para booleanos
	if (sanitized.isPublic === undefined) {
		sanitized.isPublic = false;
	}
	if (sanitized.isFavorite === undefined) {
		sanitized.isFavorite = false;
	}

	// Valores por defecto para números
	if (sanitized.totalImages === undefined) {
		sanitized.totalImages = 0;
	}
	if (sanitized.totalVideos === undefined) {
		sanitized.totalVideos = 0;
	}
	if (sanitized.totalSize === undefined) {
		sanitized.totalSize = 0;
	}

	return sanitized;
}
