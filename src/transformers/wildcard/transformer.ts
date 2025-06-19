/**
 * @file Transformador principal para la entidad Wildcard.
 * @module transformers/wildcard/transformer
 * @description Contiene la lógica para convertir un objeto Wildcard de Prisma a nuestro tipo canónico.
 */

import type { Prisma } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import type { WildcardComplete } from '@/types/entities/wildcard';
import { TransformerError } from '@/utils/transformers/errors';
import { deserializeWildcardChildren } from './serializers';

const logger = serverLogger.withContext('WildcardTransformer');

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones y conteos.
type WildcardFromPrisma = Prisma.WildcardGetPayload<{
	include: {
		parent: true;
		childWildcards: true;
		_count: {
			select: {
				childWildcards: true;
			};
		};
	};
}>;

/**
 * 🔄 Transforma un objeto Wildcard de Prisma a nuestro tipo canónico WildcardComplete.
 *
 * @param prismaWildcard - El objeto Wildcard obtenido de Prisma.
 * @returns Un objeto WildcardComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaWildcard(prismaWildcard: WildcardFromPrisma | null): WildcardComplete {
	if (!prismaWildcard) {
		throw new TransformerError('El objeto de wildcard de Prisma no puede ser nulo.');
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
		logger.error('Error transformando wildcard desde Prisma', {
			error,
			wildcardId: prismaWildcard.id,
		});
		throw new TransformerError(`Error al transformar el wildcard: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de wildcards de Prisma a una lista de WildcardComplete.
 *
 * @param prismaWildcards - Un array de objetos Wildcard de Prisma.
 * @returns Un array de objetos WildcardComplete.
 */
export function fromPrismaWildcards(prismaWildcards: WildcardFromPrisma[]): WildcardComplete[] {
	return prismaWildcards.map(fromPrismaWildcard);
}
