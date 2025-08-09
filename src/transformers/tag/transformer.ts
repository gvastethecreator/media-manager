/**
 * @file Transformer principal para Tag
 * @module transformers/tag/transformer
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

import { TransformerError } from '../../lib/errors/transformer-error';
import { serverLogger } from '../../lib/logger/server-logger';
import { calculateCompleteness } from '../../lib/utils/transformers';
import type { TagBase, TagStatistics, TagWithStats } from '../../types/entities/tag';
import { fromStorageTag, normalizeTag, sanitizeTagForClient, toStorageTag } from './serializers';
import { safeValidateTag, validateTag } from './validators';
import { createDefaultEntityStats } from '@/lib/utils';

const logger = serverLogger.withContext('TagTransformer');

/**
 * Transforma datos de la base de datos a objeto Tag de la aplicación
 */
export function fromDatabase(dbData: unknown): TagBase {
	try {
		logger.debug('🔄 Transformando Tag desde DB', { dbData });

		if (!dbData) {
			throw new Error('Datos de DB requeridos para transformar Tag');
		}

		// Aplicar transformaciones de deserialización
		const processed = fromStorageTag(dbData);

		// Validar resultado
		const validated = validateTag(processed);

		logger.debug('✅ Tag transformado desde DB exitosamente', { validated });
		return validated;
	} catch (error) {
		logger.error('❌ Error transformando Tag desde DB:', error);
		throw TransformerError.wrap(error as Error, {
			operation: 'fromDatabase',
			message: 'Error transformando Tag desde DB',
		});
	}
}

/**
 * Prepara objeto Tag para insertar en la base de datos
 */
export function toDatabase(tag: TagBase): Record<string, unknown> {
	try {
		logger.debug('🔄 Transformando Tag para DB insert', { tag });

		if (!tag) {
			throw new Error('Objeto Tag requerido');
		}

		// Validar entrada
		const validated = validateTag(tag);

		// Aplicar transformaciones de serialización
		const serialized = toStorageTag(validated);

		logger.debug('✅ Tag transformado para DB exitosamente', { serialized });
		return serialized as unknown as Record<string, unknown>;
	} catch (error) {
		logger.error('❌ Error transformando Tag para DB:', error);
		throw TransformerError.wrap(error as Error, {
			operation: 'toDatabase',
			message: 'Error transformando Tag para DB',
		});
	}
}

/**
 * Normaliza Tag aplicando valores por defecto
 */
export function normalize(tag: Partial<TagBase>): TagBase {
	try {
		logger.debug('🔄 Normalizando Tag', { tag });

		const normalized = normalizeTag(tag);
		const validated = validateTag(normalized);

		logger.debug('✅ Tag normalizado exitosamente', { validated });
		return validated;
	} catch (error) {
		logger.error('❌ Error normalizando Tag:', error);
		throw TransformerError.wrap(error as Error, { operation: 'normalize', message: 'Error normalizando Tag' });
	}
}

/**
 * Prepara Tag para ser enviado al cliente (sanitizado)
 */
export function forClient(tag: TagBase): TagBase {
	try {
		logger.debug('🔄 Preparando Tag para cliente', { tag });

		// Validar entrada
		const validated = validateTag(tag);

		// Sanitizar datos
		const sanitized = sanitizeTagForClient(validated);

		logger.debug('✅ Tag preparado para cliente exitosamente', { sanitized });
		return sanitized;
	} catch (error) {
		logger.error('❌ Error preparando Tag para cliente:', error);
		throw TransformerError.wrap(error as Error, {
			operation: 'forClient',
			message: 'Error preparando Tag para cliente',
		});
	}
}

/**
 * Validación segura que devuelve éxito/error sin lanzar excepciones
 */
export function safeParse(data: unknown): { success: true; data: TagBase } | { success: false; error: string } {
	try {
		logger.debug('🔍 Validación segura de Tag', { data });

		return safeValidateTag(data);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.warn('⚠️ Error en validación segura de Tag:', { error: errorMessage });
		return { success: false, error: errorMessage };
	}
}

/**
 * Convierte un objeto Tag con conteos a TagWithStats (función legacy mantenida por compatibilidad)
 * @deprecated Usar las nuevas funciones de transformer en su lugar
 */
export function fromDrizzleTag(drizzleTag: Record<string, unknown> | null): TagWithStats | null {
	logger.warn('⚠️ Usando función legacy fromDrizzleTag, considerar migrar a nuevas funciones');

	if (!drizzleTag) {
		logger.warn('⚠️ Tag de Drizzle nulo o indefinido');
		return null;
	}

	try {
		logger.debug(`🔄 Transformando tag legacy: ${drizzleTag.id}`);

		const hasCounts = '_count' in drizzleTag && drizzleTag._count;
		const { _count, ...baseTag } = drizzleTag;

		if (hasCounts) {
			// Convertir conteos a números y calcular estadísticas
			const counts = _count as Record<string, number>;
			const totalRelations = Object.values(counts).reduce((sum: number, count: number) => sum + count, 0);
			const usageDiversity = Object.values(counts).filter((count: number) => count > 0).length;

			const diversityRatio = usageDiversity > 0 ? usageDiversity / Object.keys(counts).length : 0;
			const popularity = Math.log1p(totalRelations) * diversityRatio;

			const stats: TagStatistics = {
				...createDefaultEntityStats(),
				imageCount: counts.images || 0,
				videoCount: counts.videos || 0,
				albumCount: counts.albums || 0,
				collectionCount: counts.collections || 0,
				tagCount: 0,
				characterCount: counts.characters || 0,
				placeCount: counts.places || 0,
				worldItemCount: counts.worldItems || 0,
				conceptCount: counts.concepts || 0,
				promptCount: counts.prompts || 0,
				noteCount: counts.notes || 0,
				wildcardCount: counts.wildcards || 0,
				propertyCount: counts.properties || 0,
				groupCount: counts.groups || 0,
				totalItems: 0,
				totalAssociations: totalRelations,
				totalRelations,
				usageDiversity: diversityRatio,
				popularity,
				completenessScore: calculateCompleteness(baseTag, ['name', 'description', 'category']),
				lastUpdated: (baseTag as any).updatedAt || new Date(),
				isDirectory: false,
				isFile: true,
			} as TagStatistics;

			return {
				...baseTag,
				entityType: 'tag',
				statistics: stats,
			} as TagWithStats;
		}

		// Sin conteos, crear estadísticas vacías
		const stats: TagStatistics = {
			...createDefaultEntityStats(),
			imageCount: 0,
			videoCount: 0,
			albumCount: 0,
			collectionCount: 0,
			tagCount: 0,
			characterCount: 0,
			placeCount: 0,
			worldItemCount: 0,
			conceptCount: 0,
			promptCount: 0,
			noteCount: 0,
			wildcardCount: 0,
			propertyCount: 0,
			groupCount: 0,
			totalItems: 0,
			totalAssociations: 0,
			totalRelations: 0,
			usageDiversity: 0,
			popularity: 0,
			completenessScore: calculateCompleteness(baseTag, ['name', 'description', 'category']),
			lastUpdated: (baseTag as any).updatedAt || new Date(),
			isDirectory: false,
			isFile: true,
		} as TagStatistics;

		return {
			...baseTag,
			entityType: 'tag',
			statistics: stats,
		} as TagWithStats;
	} catch (error) {
		logger.error('❌ Error transformando tag legacy:', error);
		return null;
	}
}
