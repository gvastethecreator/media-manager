/**
 * @file Transformador principal para la entidad Wildcard.
 * @module transformers/wildcard/transformer
 * @description Convierte objetos Wildcard de la base de datos a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { WildcardComplete } from '@/types/entities/wildcard';
import { TransformerError } from '@/utils/transformers/errors';
import { deserializeWildcardChildren } from './serializers';

const logger = serverLogger.withContext('WildcardTransformer');

// Tipo genérico proveniente de la BD ✅
type WildcardFromPrisma = Record<string, any>;

/**
 * 🔄 Transforma un registro Wildcard de la BD a `WildcardComplete`.
 *
 * @param prismaWildcard - El objeto Wildcard obtenido de la BD.
 * @returns Un objeto WildcardComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaWildcard(prismaWildcard: WildcardFromPrisma | null): WildcardComplete {
	if (!prismaWildcard) {
                throw new TransformerError('El objeto de wildcard no puede ser nulo.');
	}

	try {
		const { _count, childWildcards, ...baseData } = prismaWildcard;

		return {
			...baseData,
			// Deserializar el campo `children` que es un string JSON
			children: deserializeWildcardChildren(baseData.children),
			// Asegurarse de que las relaciones opcionales no sean undefined
			parent: baseData.parent ?? null,
			childWildcards: childWildcards ?? [],
			// Asignar el conteo de forma segura
			_count: {
				childWildcards: _count?.childWildcards ?? 0,
			},
		};
	} catch (error) {
                logger.error('Error transformando wildcard desde la BD', {
			error,
			wildcardId: prismaWildcard.id,
		});
		throw new TransformerError(`Error al transformar el wildcard: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de registros de Wildcard a `WildcardComplete`.
 *
 * @param prismaWildcards - Un array de objetos Wildcard obtenidos de la BD.
 * @returns Un array de objetos WildcardComplete.
 */
export function fromPrismaWildcards(prismaWildcards: WildcardFromPrisma[]): WildcardComplete[] {
	return prismaWildcards.map(fromPrismaWildcard);
}
