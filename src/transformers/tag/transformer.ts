/**
 * @file Transformer principal para Tag
 * @module transformers/tag/transformer
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

import { createDefaultEntityStats } from '@/lib/utils';
import { TransformerError } from '../../lib/errors/transformer-error';
import { serverLogger } from '../../lib/logger/server-logger';
import { calculateCompleteness } from '../../lib/utils/transformers';
import type { TagBase, TagStatistics, TagWithStats } from '../../types/entities/tag';
import { fromStorageTag, normalizeTag, sanitizeTagForClient, toStorageTag } from './serializers';
import { safeValidateTag, validateTag } from './validators';

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
