/**
 * @file Transformadores para la entidad Prompt
 * @module transformers/prompt/transformer
 */

import { Logger } from '@/lib/logger';
import type { PromptBase, PromptComplete, PromptWithRelations } from '@/types/entities/prompt';
import { PromptSchema } from '@/types/entities/prompt/schema';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prompt } from '@prisma/client';
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
 * 🔄 Transforma un objeto a PromptComplete, validando y deserializando campos
 * @param prompt Objeto a transformar
 * @param options Opciones de transformación
 * @returns PromptComplete transformado
 * @throws TransformerError si hay errores en la validación o transformación
 */
export function transformPrompt<T extends Partial<PromptBase> | Prompt | unknown>(
	prompt: T,
	options: TransformPromptOptions = {}
): PromptComplete {
	try {
		if (!prompt) {
			throw new Error('El objeto prompt es nulo o undefined');
		}

		// Opciones por defecto
		const { validateFields = true, deserializeFields = true } = options;

		// Validar el schema si está habilitado
		let validatedPrompt = prompt as PromptBase;
		if (validateFields) {
			const result = PromptSchema.safeParse(prompt);
			if (!result.success) {
				throw new Error(`Validación fallida: ${result.error.message}`);
			}
			validatedPrompt = result.data;
		}

		// Si deserializeFields está habilitado, convertir campos JSON
		if (deserializeFields) {
			// Deserializar parameters y tags
			return {
				...validatedPrompt,
				parameters: deserializeParameters(validatedPrompt.parameters),
				tags: deserializeTags(validatedPrompt.tags || '[]'),
			} as PromptComplete;
		}

		// Devolver sin deserializar
		return validatedPrompt as unknown as PromptComplete;
	} catch (error) {
		logger.error(`Error transformando prompt: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando prompt: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma un array de objetos a PromptComplete[]
 * @param prompts Array de objetos a transformar
 * @param options Opciones de transformación
 * @returns Array de PromptComplete transformados
 * @throws TransformerError si hay errores en la transformación de algún elemento
 */
export function transformPrompts<T extends Array<Partial<PromptBase> | Prompt | unknown>>(
	prompts: T,
	options: TransformPromptOptions = {}
): PromptComplete[] {
	try {
		if (!Array.isArray(prompts)) {
			throw new Error('El parámetro no es un array');
		}

		return prompts.map((prompt) => transformPrompt(prompt, options));
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
 * @returns PromptWithRelations con propiedades adicionales para UI
 * @throws TransformerError si hay errores en la transformación
 */
export function transformPromptToExtended<T extends Partial<PromptComplete> | Prompt | unknown>(
	prompt: T
): PromptWithRelations {
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
 * @returns PromptWithRelations con estadísticas calculadas
 * @throws TransformerError si hay errores en la transformación
 */
export function transformPromptToWithStats<T extends Partial<PromptComplete> | Prompt | unknown>(
	prompt: T
): PromptWithRelations {
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
				tagCount: promptComplete._count?.tagEntities ?? 0,
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
 * Calcula la importancia de un prompt basado en su uso y relaciones
 * @param prompt Prompt completo
 * @returns Valor de importancia (1-5)
 */
function calculateImportance(prompt: PromptComplete): number {
	// Implementación simple
	const relationsCount =
		(prompt._count?.images ?? 0) +
		(prompt._count?.videos ?? 0) +
		(prompt._count?.concepts ?? 0) +
		(prompt._count?.characters ?? 0);

	if (relationsCount > 50) return 5;
	if (relationsCount > 20) return 4;
	if (relationsCount > 10) return 3;
	if (relationsCount > 5) return 2;
	return 1;
}

/**
 * Calcula el total de contenido relacionado con un prompt
 * @param prompt Prompt completo
 * @returns Total de elementos de contenido
 */
function calculateTotalContent(prompt: PromptComplete): number {
	return (
		(prompt._count?.images ?? 0) +
		(prompt._count?.videos ?? 0) +
		(prompt._count?.concepts ?? 0) +
		(prompt._count?.notes ?? 0) +
		(prompt._count?.characters ?? 0) +
		(prompt._count?.places ?? 0) +
		(prompt._count?.worldItems ?? 0)
	);
}

/**
 * Determina la última fecha de uso de un prompt
 * @param prompt Prompt completo
 * @returns Última fecha de uso o fecha de actualización
 */
function calculateLastUsed(prompt: PromptComplete): Date {
	// Por ahora solo usamos la fecha de actualización
	// En futuras versiones, podríamos rastrear el uso real
	return prompt.updatedAt;
}
