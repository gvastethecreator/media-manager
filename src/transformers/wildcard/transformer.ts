/**
 * @file Transformadores para la entidad Wildcard.
 * @module transformers/wildcard/transformer
 * @description Contiene funciones para convertir objetos Wildcard entre diferentes formatos.
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { WildcardWithStats } from '@/types/entities/wildcard';
import { toWildcardWithStats } from './mappers';

const wildcardTransformerLogger = clientLogger.withContext('WildcardTransformer');

/**
 * Convierte un objeto Wildcard de Prisma a WildcardWithStats.
 * Esta función es compatible con el sistema legacy que esperaba WildcardComplete.
 *
 * @param prismaWildcard El objeto Wildcard de Prisma
 * @returns Un objeto WildcardWithStats con estadísticas calculadas o null si el input es inválido
 */
export function fromPrismaWildcard(
	prismaWildcard: any | null
): WildcardWithStats | null {
	if (!prismaWildcard) {
		wildcardTransformerLogger.warn('⚠️ Wildcard de Prisma nulo o indefinido');
		return null;
	}

	try {
		wildcardTransformerLogger.debug(`🔄 Transformando wildcard: ${prismaWildcard.id}`);

		// Usar el mapper existente toWildcardWithStats
		return toWildcardWithStats(prismaWildcard);
	} catch (error) {
		wildcardTransformerLogger.error('❌ Error transformando wildcard:', error);
		return null;
	}
}

/**
 * Alias para compatibilidad con código legacy.
 * @deprecated Usar fromPrismaWildcard directamente.
 */
export const transformWildcard = fromPrismaWildcard;

/**
 * Tipo de compatibilidad para código legacy que espera WildcardComplete.
 * @deprecated Usar WildcardWithStats directamente.
 */
export type WildcardComplete = WildcardWithStats;
