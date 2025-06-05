/**
 * @file Transformadores para la entidad Wildcard
 * @module transformers/wildcard/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { WildcardSchema } from '@/types/entities/wildcard/schema';
import type { WildcardComplete, WildcardExtended, WildcardWithStats } from '@/types/entities/wildcard/types';
import { TransformerError } from '@/utils/transformers/errors';
import type { Wildcard } from '@prisma/client';
import { parseWildcardChildren } from './serializers';

/**
 * Opciones para la transformación de wildcards
 */
export interface TransformWildcardOptions {
	/** Habilita la validación de campos */
	validateFields?: boolean;
	/** Deserializa campos JSON */
	deserializeFields?: boolean;
	/** Incluye relaciones */
	includeRelations?: boolean;
	/** Incluye propiedades UI */
	includeUI?: boolean;
	/** Incluye estadísticas calculadas */
	includeStats?: boolean;
}

/**
 * 🔄 Transforma un objeto a Wildcard
 * @param input Objeto a transformar a Wildcard
 * @param options Opciones de transformación
 * @returns Wildcard transformado
 * @throws TransformerError si hay errores en la validación o transformación
 */
export function transformWildcard<T extends Partial<WildcardComplete> | Wildcard | unknown>(
	input: T,
	options: TransformWildcardOptions = {}
): WildcardComplete {
	try {
		// Validar que input no sea nulo o indefinido
		if (input === null || input === undefined) {
			throw new TransformerError('El objeto a transformar es nulo o indefinido');
		}

		// Si el input es un objeto con propiedades, lo procesamos
		if (typeof input === 'object' && 'id' in input && 'name' in input) {
			const wildcard = input as any;

			// Copia de propiedades básicas
			const result: Partial<WildcardComplete> = {
				...wildcard,
			};

			// Deserializar campos JSON si es necesario
			if (options.deserializeFields) {
				result.parsedChildren = parseWildcardChildren(wildcard.children);
			}

			// Incluir propiedades UI si es necesario
			if (options.includeUI) {
				result._ui = {
					hasParent: !!wildcard.parentId,
					hasChildren: (result.parsedChildren?.length || 0) > 0,
					itemCount: calculateItemCount(wildcard as any),
					parsedChildren: result.parsedChildren || [],
					lastUpdated: wildcard.updatedAt,
				};
			}

			return result as WildcardComplete;
		}

		// Validar con Zod si es necesario
		if (options.validateFields) {
			const parsed = WildcardSchema.safeParse(input);
			if (!parsed.success) {
				throw new TransformerError(`Validación fallida: ${parsed.error.message}`);
			}
		}

		// Si llegamos aquí, devolvemos el input tal cual (asumiendo que ya es un WildcardComplete)
		return input as WildcardComplete;
	} catch (error) {
		serverLogger.error(`Error transformando wildcard: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando wildcard: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una array de objetos a Wildcards
 * @param inputs Array de objetos a transformar
 * @param options Opciones de transformación
 * @returns Array de Wildcards transformados
 * @throws TransformerError si hay errores en la validación o transformación
 */
export function transformWildcards<T extends Partial<WildcardComplete> | Wildcard | unknown>(
	inputs: T[],
	options: TransformWildcardOptions = {}
): WildcardComplete[] {
	try {
		// Validar que sea un array
		if (!Array.isArray(inputs)) {
			throw new TransformerError('El valor proporcionado no es un array');
		}

		// Transformar cada elemento
		return inputs.map((input) => transformWildcard(input, options));
	} catch (error) {
		serverLogger.error(`Error transformando array de wildcards: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando array de wildcards: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma un Wildcard a su versión extendida para UI
 * @param wildcard Wildcard a transformar
 * @returns WildcardExtended con propiedades adicionales para UI
 * @throws TransformerError si hay errores en la transformación
 */
export function transformWildcardToExtended<T extends Partial<WildcardComplete> | Wildcard | unknown>(
	wildcard: T
): WildcardExtended {
	try {
		// Primero transformamos a WildcardComplete
		const wildcardComplete = transformWildcard(wildcard, {
			deserializeFields: true,
			includeUI: true,
		});

		// Calculamos propiedades extendidas
		return {
			...wildcardComplete,
			isSelected: false,
			isHighlighted: false,
			displayName: `${wildcardComplete.emoji} ${wildcardComplete.name}`,
			isExpandable: (wildcardComplete.parsedChildren?.length || 0) > 0,
			isExpanded: false,
			shortcutDisplay: wildcardComplete.shortcut ? `[${wildcardComplete.shortcut}]` : '',
			lastUpdated: wildcardComplete.updatedAt,
		};
	} catch (error) {
		serverLogger.error(`Error transformando wildcard a extendido: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando wildcard a extendido: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma un Wildcard a su versión con estadísticas
 * @param wildcard Wildcard a transformar
 * @returns WildcardWithStats con estadísticas calculadas
 * @throws TransformerError si hay errores en la transformación
 */
export function transformWildcardToWithStats<T extends Partial<WildcardComplete> | Wildcard | unknown>(
	wildcard: T
): WildcardWithStats {
	try {
		// Primero transformamos a WildcardComplete
		const wildcardComplete = transformWildcard(wildcard, {
			deserializeFields: true,
			includeRelations: true,
			includeUI: true,
		});

		// Calculamos estadísticas
		return {
			...wildcardComplete,
			stats: {
				childCount: wildcardComplete.parsedChildren?.length || 0,
				imageCount: wildcardComplete._count?.images || 0,
				videoCount: wildcardComplete._count?.videos || 0,
				promptCount: wildcardComplete._count?.prompts || 0,
				totalContentItems: calculateTotalContent(wildcardComplete),
				depth: calculateDepth(wildcardComplete),
				usageCount: calculateUsageCount(wildcardComplete),
				lastUpdated: wildcardComplete.updatedAt,
			},
		};
	} catch (error) {
		serverLogger.error(`Error transformando wildcard con estadísticas: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando wildcard con estadísticas: ${(error as Error).message}`);
	}
}

/**
 * Calcula la cantidad total de elementos para un wildcard
 * @param wildcard Wildcard a analizar
 * @returns Cantidad total de elementos
 */
function calculateItemCount(wildcard: WildcardComplete): number {
	// Si tiene hijos, los contamos
	const childCount = wildcard.parsedChildren?.length || 0;

	// Contamos relaciones si están disponibles
	const relationCount = wildcard._count
		? Object.values(wildcard._count).reduce((sum, count) => sum + (count || 0), 0)
		: 0;

	return childCount + relationCount;
}

/**
 * Calcula el total de elementos de contenido relacionados con el wildcard
 * @param wildcard Wildcard a analizar
 * @returns Total de elementos de contenido
 */
function calculateTotalContent(wildcard: WildcardComplete): number {
	return (
		(wildcard._count?.images || 0) +
		(wildcard._count?.videos || 0) +
		(wildcard._count?.prompts || 0) +
		(wildcard._count?.notes || 0) +
		(wildcard._count?.properties || 0)
	);
}

/**
 * Calcula la profundidad del wildcard en la jerarquía
 * @param wildcard Wildcard a analizar
 * @returns Profundidad del wildcard
 */
function calculateDepth(wildcard: WildcardComplete): number {
	// Si no tiene padre, su profundidad es 0
	if (!wildcard.parentId) {
		return 0;
	}

	// Si no tenemos información del padre, asumimos profundidad 1
	if (!wildcard._relations?.parent) {
		return 1;
	}

	// Si tenemos el padre, calculamos recursivamente
	const parent = wildcard._relations.parent;
	return 1 + calculateDepth(parent as WildcardComplete);
}

/**
 * Calcula la cantidad de veces que se ha usado este wildcard
 * @param wildcard Wildcard a analizar
 * @returns Cantidad de usos
 */
function calculateUsageCount(wildcard: WildcardComplete): number {
	// Por ahora es una estimación basada en relaciones
	return (
		(wildcard._count?.prompts || 0) * 2 + // Uso en prompts vale doble
		(wildcard._count?.images || 0) +
		(wildcard._count?.videos || 0)
	);
}
