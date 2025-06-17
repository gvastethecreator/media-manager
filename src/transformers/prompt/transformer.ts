/**
 * @file Transformadores para la entidad Prompt
 * @module transformers/prompt/transformer
 */

import type { Prompt } from '@prisma/client';
import { Logger } from '@/lib/logger';
import { PromptSchema } from '@/types/entities/prompt/schema';
import type { PromptComplete, PromptExtended, PromptWithStats } from '@/types/entities/prompt/types';
import { TransformerError } from '@/utils/transformers/errors';
import { deserializeParameters, deserializeTags, toExtendedPrompt } from './serializers';

const logger = new Logger('PromptTransformer');

/**
 * Opciones para la transformación de prompts
 */
export interface TransformPromptOptions {
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
 * 🔄 Transforma un objeto a Prompt
 * @param input Objeto a transformar a Prompt
 * @param options Opciones de transformación
 * @returns Prompt transformado
 * @throws TransformerError si hay errores en la validación o transformación
 */
export function transformPrompt<T extends Partial<PromptComplete> | Prompt | unknown>(
	input: T,
	options: TransformPromptOptions = {}
): PromptComplete {
	try {
		// Validar que input no sea nulo o indefinido
		if (input === null || input === undefined) {
			throw new TransformerError('El objeto a transformar es nulo o indefinido');
		}

		// Si el input es un objeto Prisma, transformamos sus campos JSON
		if (typeof input === 'object' && 'id' in input && 'name' in input) {
			const prompt = input as any;

			// Deserializar campos JSON si es necesario
			if (options.deserializeFields) {
				return {
					...prompt,
					parameters: deserializeParameters(prompt.parameters),
					tags: deserializeTags(prompt.tags),
				} as PromptComplete;
			}

			return prompt as PromptComplete;
		}

		// Validar con Zod si es necesario
		if (options.validateFields) {
			const parsed = PromptSchema.safeParse(input);
			if (!parsed.success) {
				throw new TransformerError(`Validación fallida: ${parsed.error.message}`);
			}
		}

		// Convertir a PromptComplete
		const basePrompt = input as Prompt;

		// Deserializar campos JSON si es necesario
		if (options.deserializeFields) {
			return {
				...basePrompt,
				parameters: deserializeParameters(basePrompt.parameters),
				tags: deserializeTags(basePrompt.tags),
			} as PromptComplete;
		}

		return basePrompt as PromptComplete;
	} catch (error) {
		logger.error(`Error transformando prompt: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando prompt: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una array de objetos a Prompts
 * @param inputs Array de objetos a transformar
 * @param options Opciones de transformación
 * @returns Array de Prompts transformados
 * @throws TransformerError si hay errores en la validación o transformación
 */
export function transformPrompts<T extends Partial<PromptComplete> | Prompt | unknown>(
	inputs: T[],
	options: TransformPromptOptions = {}
): PromptComplete[] {
	try {
		// Validar que sea un array
		if (!Array.isArray(inputs)) {
			throw new TransformerError('El valor proporcionado no es un array');
		}

		// Transformar cada elemento
		return inputs.map((input) => transformPrompt(input, options));
	} catch (error) {
		logger.error(`Error transformando array de prompts: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando array de prompts: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma un Prompt a su versión extendida para UI
 * @param prompt Prompt a transformar
 * @returns PromptExtended con propiedades adicionales para UI
 * @throws TransformerError si hay errores en la transformación
 */
export function transformPromptToExtended<T extends Partial<PromptComplete> | Prompt | unknown>(
	prompt: T
): PromptExtended {
	try {
		// Primero transformamos a PromptComplete
		const promptComplete = transformPrompt(prompt, { deserializeFields: true });

		// Utilizamos la función existente para extender el prompt
		const extendedPrompt = toExtendedPrompt(promptComplete);

		// Añadimos propiedades adicionales para UI
		return {
			...extendedPrompt,
			isSelected: false,
			isHighlighted: false,
			importance: calculateImportance(promptComplete),
		};
	} catch (error) {
		logger.error(`Error transformando prompt a extendido: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando prompt a extendido: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma un Prompt a su versión con estadísticas
 * @param prompt Prompt a transformar
 * @returns PromptWithStats con estadísticas calculadas
 * @throws TransformerError si hay errores en la transformación
 */
export function transformPromptToWithStats<T extends Partial<PromptComplete> | Prompt | unknown>(
	prompt: T
): PromptWithStats {
	try {
		// Primero transformamos a PromptComplete
		const promptComplete = transformPrompt(prompt, { includeRelations: true });

		// Calculamos estadísticas
		return {
			...promptComplete,
			stats: {
				imageCount: promptComplete._count?.images ?? 0,
				videoCount: promptComplete._count?.videos ?? 0,
				albumCount: promptComplete._count?.albums ?? 0,
				tagCount: promptComplete._count?.tags ?? 0,
				noteCount: promptComplete._count?.notes ?? 0,
				conceptCount: promptComplete._count?.concepts ?? 0,
				characterCount: promptComplete._count?.characters ?? 0,
				placeCount: promptComplete._count?.places ?? 0,
				worldItemCount: promptComplete._count?.worldItems ?? 0,
				wildcardCount: promptComplete._count?.wildcards ?? 0,
				totalContentItems: calculateTotalContent(promptComplete),
				lastUpdated: promptComplete.updatedAt,
				lastUsed: calculateLastUsed(promptComplete),
			},
		};
	} catch (error) {
		logger.error(`Error transformando prompt con estadísticas: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando prompt con estadísticas: ${(error as Error).message}`);
	}
}

/**
 * Calcula el nivel de importancia de un prompt basado en su uso y relaciones
 * @param prompt Prompt a analizar
 * @returns Valor numérico de importancia (1-10)
 */
function calculateImportance(prompt: PromptComplete): number {
	let importance = 5; // Valor base

	// Si tiene contenido extenso
	if (prompt.content && prompt.content.length > 500) {
		importance += 1;
	}

	// Si tiene descripción
	if (prompt.description) {
		importance += 1;
	}

	// Si tiene imagen destacada
	if (prompt.featuredImage) {
		importance += 1;
	}

	// Si es favorito
	if (prompt.isFavorite) {
		importance += 2;
	}

	// Si tiene propósito definido
	if (prompt.purpose && prompt.purpose.length > 100) {
		importance += 1;
	}

	// Si tiene parámetros configurados
	if (prompt.parameters && prompt.parameters !== '{}' && prompt.parameters !== 'empty_object') {
		importance += 1;
	}

	// Límites
	return Math.max(1, Math.min(10, importance));
}

/**
 * Calcula el total de elementos de contenido relacionados con el prompt
 * @param prompt Prompt a analizar
 * @returns Total de elementos de contenido
 */
function calculateTotalContent(prompt: PromptComplete): number {
	return (
		(prompt._count?.images ?? 0) +
		(prompt._count?.videos ?? 0) +
		(prompt._count?.albums ?? 0) +
		(prompt._count?.collections ?? 0) +
		(prompt._count?.notes ?? 0)
	);
}

/**
 * Determina la última vez que se usó el prompt basado en contenido relacionado
 * @param prompt Prompt a analizar
 * @returns Fecha de último uso o la fecha de actualización si no hay uso
 */
function calculateLastUsed(prompt: PromptComplete): Date {
	// En una implementación real, se buscaría la fecha más reciente de contenido generado
	// usando este prompt. Para este ejemplo, usamos updatedAt como aproximación.
	return prompt.updatedAt;
}
