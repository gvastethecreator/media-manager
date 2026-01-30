/**
 * @file Transformadores para la entidad Wildcard.
 * @module transformers/wildcard/transformer
 * @description Contiene funciones para convertir objetos Wildcard entre diferentes formatos.
 */

import { clientLogger } from '../../lib/logger/client-logger';
import type { WildcardWithStats } from '../../types/entities/wildcard';
import { toWildcardWithStats } from './mappers';

const wildcardTransformerLogger = clientLogger.withContext('WildcardTransformer');

/**
 * Convierte un objeto Wildcard de Drizzle a WildcardWithStats.
 * Esta función es compatible con el sistema legacy que esperaba WildcardComplete.
 *
 * @param drizzleWildcard El objeto Wildcard de Drizzle
 * @returns Un objeto WildcardWithStats con estadísticas calculadas o null si el input es inválido
 */
export function fromDrizzleWildcard(drizzleWildcard: unknown): WildcardWithStats | null {
	if (!drizzleWildcard) {
		wildcardTransformerLogger.warn('⚠️ Wildcard de Drizzle nulo o indefinido');
		return null;
	}

	try {
		wildcardTransformerLogger.debug('🔄 Transformando wildcard');

		// Usar el mapper existente toWildcardWithStats
		return toWildcardWithStats(drizzleWildcard as never);
	} catch (error) {
		wildcardTransformerLogger.error('❌ Error transformando wildcard:', error);
		return null;
	}
}

// === NAMESPACE DE EXPORTACIÓN ===
// Esta estructura evita que Next.js detecte el archivo como Server Action

/**
 * WildcardTransformer - Namespace que contiene todas las funciones de transformación para wildcards
 */
export const WildcardTransformer = {
	fromDrizzleWildcard,
} as const;

export const transformWildcard = WildcardTransformer.fromDrizzleWildcard;

/**
 * Tipo de compatibilidad para código legacy que espera WildcardComplete.
 * @deprecated Usar WildcardWithStats directamente.
 */
export type WildcardComplete = WildcardWithStats;
