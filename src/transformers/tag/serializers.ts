/**
 * @file Serializers para Tag - Transformación de datos para almacenamiento
 * @module transformers/tag/serializers
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

import { serverLogger } from '../../lib/logger/server-logger';
import type { TagBase } from '../../types/entities/tag';

const logger = serverLogger.withContext('TagSerializers');

/**
 * Transforma datos de Tag desde formato de almacenamiento a formato de aplicación
 */
export function fromStorageTag<T>(tagData: T): T {
	logger.debug('🔄 Transformando Tag desde almacenamiento a aplicación', { tagData });

	if (!tagData) {
		return tagData;
	}

	try {
		const data = { ...(tagData as object) } as Record<string, unknown>;

		// Procesar campos específicos si es necesario
		// Por ejemplo, deserializar metadata JSON
		if ('metadata' in data && typeof data.metadata === 'string') {
			try {
				data.metadata = JSON.parse(data.metadata as string);
			} catch (error) {
				logger.warn('⚠️ Error parseando metadata de tag, usando valor original', { error, metadata: data.metadata });
			}
		}

		return data as unknown as T;
	} catch (error) {
		logger.error('❌ Error transformando Tag desde almacenamiento:', error);
		return tagData;
	}
}

/**
 * Transforma datos de Tag desde formato de aplicación a formato de almacenamiento
 */
export function toStorageTag<T>(tagData: T): T {
	logger.debug('🔄 Transformando Tag desde aplicación a almacenamiento', { tagData });

	if (!tagData) {
		return tagData;
	}

	try {
		const data = { ...(tagData as object) } as Record<string, unknown>;

		// Serializar campos específicos si es necesario
		// Por ejemplo, serializar metadata a JSON string
		if ('metadata' in data && typeof data.metadata === 'object' && data.metadata !== null) {
			data.metadata = JSON.stringify(data.metadata);
		}

		return data as unknown as T;
	} catch (error) {
		logger.error('❌ Error transformando Tag desde aplicación a almacenamiento:', error);
		return tagData;
	}
}

/**
 * Normaliza un objeto Tag aplicando valores por defecto para campos faltantes
 */
export function normalizeTag(tagData: Partial<TagBase>): TagBase {
	logger.debug('🔄 Normalizando datos de Tag', { tagData });

	const normalized: TagBase = {
		id: tagData.id || '',
		name: tagData.name || '',
		description: tagData.description || null,
		emoji: tagData.emoji || null,
		color: tagData.color || 'var(--dt-neutral-500)',
		category: tagData.category || null,
		shortcut: tagData.shortcut || null,
		featuredImage: tagData.featuredImage || null,
		isFavorite: tagData.isFavorite ?? false,
		createdAt: tagData.createdAt || new Date(),
		updatedAt: tagData.updatedAt || new Date(),
	};

	logger.debug('✅ Tag normalizado exitosamente', { normalized });
	return normalized;
}

/**
 * Prepara un objeto Tag para ser enviado al cliente (sanitización)
 */
export function sanitizeTagForClient(tag: TagBase): TagBase {
	logger.debug('🔄 Sanitizando Tag para cliente', { tag });

	// Para tags, generalmente no hay información sensible que ocultar
	// pero mantenemos la función por consistencia y por si se necesita en el futuro
	const sanitized = { ...tag };

	logger.debug('✅ Tag sanitizado para cliente', { sanitized });
	return sanitized;
}

/**
 * Combina dos objetos Tag, aplicando los valores del segundo sobre el primero
 */
export function mergeTagData(base: Partial<TagBase>, override: Partial<TagBase>): TagBase {
	logger.debug('🔄 Combinando datos de Tag', { base, override });

	const merged = normalizeTag({
		...base,
		...override,
		// Asegurar que campos importantes se preserven correctamente
		id: override.id || base.id,
		createdAt: base.createdAt || override.createdAt,
		updatedAt: override.updatedAt || new Date(),
	});

	logger.debug('✅ Datos de Tag combinados exitosamente', { merged });
	return merged;
}
