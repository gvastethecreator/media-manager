/**
 * @file Transformadores para la entidad Concept
 * @module transformers/concept/transformer
 */

import type { Concept } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import { ConceptSchema } from '@/types/entities/concept/schema';
import type { ConceptComplete, ConceptExtended, ConceptWithStats } from '@/types/entities/concept/types';
import { TransformerError } from '@/utils/transformers/errors';
import { fromPrismaConcept } from './serializers';

/**
 * Opciones para la transformación de conceptos
 */
export interface TransformConceptOptions {
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
 * 🔄 Transforma un objeto a Concept
 * @param input Objeto a transformar a Concept
 * @param options Opciones de transformación
 * @returns Concept transformado
 * @throws TransformerError si hay errores en la validación o transformación
 */
export function transformConcept<T extends Partial<ConceptComplete> | Concept | unknown>(
	input: T,
	options: TransformConceptOptions = {}
): ConceptComplete {
	try {
		// Validar que input no sea nulo o indefinido
		if (input === null || input === undefined) {
			throw new TransformerError('El objeto a transformar es nulo o indefinido');
		}

		// Si el input es un objeto Prisma, usamos el serializador existente
		if (typeof input === 'object' && 'id' in input && 'name' in input) {
			return fromPrismaConcept(input as Concept, {
				validateFields: options.validateFields ?? true,
				deserializeFields: options.deserializeFields ?? true,
				includeRelations: options.includeRelations ?? false,
				includeUI: options.includeUI ?? true,
				includeStats: options.includeStats ?? false,
			});
		}

		// Validar con Zod si es necesario
		if (options.validateFields) {
			const parsed = ConceptSchema.safeParse(input);
			if (!parsed.success) {
				throw new TransformerError(`Validación fallida: ${parsed.error.message}`);
			}
		}

		// Convertir a ConceptComplete
		return fromPrismaConcept(input as Concept, {
			validateFields: options.validateFields ?? true,
			deserializeFields: options.deserializeFields ?? true,
			includeRelations: options.includeRelations ?? false,
			includeUI: options.includeUI ?? true,
			includeStats: options.includeStats ?? false,
		});
	} catch (error) {
		serverLogger.error(`Error transformando concept: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando concept: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una array de objetos a Concepts
 * @param inputs Array de objetos a transformar
 * @param options Opciones de transformación
 * @returns Array de Concepts transformados
 * @throws TransformerError si hay errores en la validación o transformación
 */
export function transformConcepts<T extends Partial<ConceptComplete> | Concept | unknown>(
	inputs: T[],
	options: TransformConceptOptions = {}
): ConceptComplete[] {
	try {
		// Validar que sea un array
		if (!Array.isArray(inputs)) {
			throw new TransformerError('El valor proporcionado no es un array');
		}

		// Transformar cada elemento
		return inputs.map((input) => transformConcept(input, options));
	} catch (error) {
		serverLogger.error(`Error transformando array de concepts: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando array de concepts: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma un Concept a su versión extendida para UI
 * @param concept Concept a transformar
 * @returns ConceptExtended con propiedades adicionales para UI
 * @throws TransformerError si hay errores en la transformación
 */
export function transformConceptToExtended<T extends Partial<ConceptComplete> | Concept | unknown>(
	concept: T
): ConceptExtended {
	try {
		// Primero transformamos a ConceptComplete
		const conceptComplete = transformConcept(concept);

		// Calculamos propiedades extendidas
		return {
			...conceptComplete,
			isSelected: false,
			isHighlighted: false,
			previewContent: conceptComplete.content?.substring(0, 100) ?? '',
			lastUpdated: conceptComplete.updatedAt,
			importance: calculateImportance(conceptComplete),
		};
	} catch (error) {
		serverLogger.error(`Error transformando concept a extendido: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando concept a extendido: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma un Concept a su versión con estadísticas
 * @param concept Concept a transformar
 * @returns ConceptWithStats con estadísticas calculadas
 * @throws TransformerError si hay errores en la transformación
 */
export function transformConceptToWithStats<T extends Partial<ConceptComplete> | Concept | unknown>(
	concept: T
): ConceptWithStats {
	try {
		// Primero transformamos a ConceptComplete
		const conceptComplete = transformConcept(concept, { includeRelations: true });

		// Calculamos estadísticas
		return {
			...conceptComplete,
			stats: {
				imageCount: conceptComplete._count?.images ?? 0,
				videoCount: conceptComplete._count?.videos ?? 0,
				albumCount: conceptComplete._count?.albums ?? 0,
				tagCount: conceptComplete._count?.tags ?? 0,
				noteCount: conceptComplete._count?.notes ?? 0,
				relatedCharacters: conceptComplete._count?.characters ?? 0,
				relatedPlaces: conceptComplete._count?.places ?? 0,
				relatedWorldItems: conceptComplete._count?.worldItems ?? 0,
				totalContentItems: calculateTotalContent(conceptComplete),
				lastUpdated: conceptComplete.updatedAt,
			},
		};
	} catch (error) {
		serverLogger.error(`Error transformando concept con estadísticas: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando concept con estadísticas: ${(error as Error).message}`);
	}
}

/**
 * Calcula el nivel de importancia de un concepto basado en sus relaciones y contenido
 * @param concept Concepto a analizar
 * @returns Valor numérico de importancia (1-10)
 */
function calculateImportance(concept: ConceptComplete): number {
	let importance = 5; // Valor base

	// Si tiene contenido extenso
	if (concept.content && concept.content.length > 500) {
		importance += 1;
	}

	// Si tiene descripción
	if (concept.description) {
		importance += 1;
	}

	// Si tiene imagen destacada
	if (concept.featuredImage) {
		importance += 1;
	}

	// Si es favorito
	if (concept.isFavorite) {
		importance += 2;
	}

	// Límites
	return Math.max(1, Math.min(10, importance));
}

/**
 * Calcula el total de elementos de contenido relacionados con el concepto
 * @param concept Concepto a analizar
 * @returns Total de elementos de contenido
 */
function calculateTotalContent(concept: ConceptComplete): number {
	return (
		(concept._count?.images ?? 0) +
		(concept._count?.videos ?? 0) +
		(concept._count?.albums ?? 0) +
		(concept._count?.collections ?? 0) +
		(concept._count?.notes ?? 0)
	);
}
