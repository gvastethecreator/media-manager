import { serverLogger } from '@/lib/logger/server-logger';
import type { PromptBase, PromptExtended } from '@/types/entities/prompt';
import { PromptCategory, PromptModel } from '@/types/entities/prompt/enums';

const validatorsLogger = serverLogger.withContext('PromptValidators');

/**
 * Comprueba si un título de prompt es válido
 * @param title Título del prompt a validar
 * @returns Booleano indicando si es válido
 */
export function isValidPromptTitle(title: string): boolean {
	try {
		// El título debe tener entre 3 y 100 caracteres
		return title.trim().length >= 3 && title.trim().length <= 100;
	} catch (error) {
		validatorsLogger.error('❌ Error al validar título de prompt:', error);
		return false;
	}
}

/**
 * Comprueba si el contenido de un prompt es válido
 * @param content Contenido del prompt a validar
 * @returns Booleano indicando si es válido
 */
export function isValidPromptContent(content: string): boolean {
	try {
		// El contenido debe tener al menos 5 caracteres
		return content.trim().length >= 5;
	} catch (error) {
		validatorsLogger.error('❌ Error al validar contenido de prompt:', error);
		return false;
	}
}

/**
 * Comprueba si la categoría del prompt es válida
 * @param category Categoría a validar
 * @returns Booleano indicando si es válida
 */
export function isValidPromptCategory(category: string): boolean {
	try {
		// Verificar que sea una de las categorías válidas
		return Object.values(PromptCategory).includes(category as PromptCategory);
	} catch (error) {
		validatorsLogger.error('❌ Error al validar categoría de prompt:', error);
		return false;
	}
}

/**
 * Comprueba si el modelo del prompt es válido
 * @param model Modelo a validar
 * @returns Booleano indicando si es válido
 */
export function isValidPromptModel(model: string): boolean {
	try {
		// Verificar que sea uno de los modelos válidos
		return Object.values(PromptModel).includes(model as PromptModel);
	} catch (error) {
		validatorsLogger.error('❌ Error al validar modelo de prompt:', error);
		return false;
	}
}

/**
 * Comprueba si los parámetros del prompt son válidos
 * @param parameters Parámetros a validar (como string JSON o objeto)
 * @returns Booleano indicando si son válidos
 */
export function isValidPromptParameters(parameters: string | Record<string, any>): boolean {
	try {
		// Si es string, intentar parsearlo
		const paramsObject =
			typeof parameters === 'string'
				? parameters === '{}' || parameters === 'empty_object'
					? {}
					: JSON.parse(parameters)
				: parameters;

		// Verificar que sea un objeto
		if (typeof paramsObject !== 'object' || paramsObject === null) {
			return false;
		}

		// Verificación adicional para cada parámetro si es necesario
		return true;
	} catch (error) {
		validatorsLogger.error('❌ Error al validar parámetros de prompt:', error);
		return false;
	}
}

/**
 * Comprueba si los tags del prompt son válidos
 * @param tags Tags a validar (como string JSON o array)
 * @returns Booleano indicando si son válidos
 */
export function isValidPromptTags(tags: string | string[]): boolean {
	try {
		// Si es string, intentar parsearlo
		const tagsArray =
			typeof tags === 'string' ? (tags === '[]' ? [] : JSON.parse(tags)) : tags;

		// Verificar que sea un array
		if (!Array.isArray(tagsArray)) {
			return false;
		}

		// Verificar que cada tag sea un string no vacío
		return tagsArray.every((tag) => typeof tag === 'string' && tag.trim().length > 0);
	} catch (error) {
		validatorsLogger.error('❌ Error al validar tags de prompt:', error);
		return false;
	}
}

/**
 * Valida completamente un prompt
 * @param prompt Prompt a validar
 * @returns Objeto con resultado de validación y errores
 */
export function validatePrompt(prompt: PromptBase | PromptExtended): {
	isValid: boolean;
	errors: Record<string, string>;
} {
	try {
		const errors: Record<string, string> = {};

		// Validar título
		if (!isValidPromptTitle(prompt.title)) {
			errors.title = 'El título debe tener entre 3 y 100 caracteres';
		}

		// Validar contenido
		if (!isValidPromptContent(prompt.content)) {
			errors.content = 'El contenido debe tener al menos 5 caracteres';
		}

		// Validar categoría
		if (!isValidPromptCategory(prompt.category)) {
			errors.category = 'La categoría seleccionada no es válida';
		}

		// Validar modelo
		if (!isValidPromptModel(prompt.model)) {
			errors.model = 'El modelo seleccionado no es válido';
		}

		// Validar parámetros
		const params = 'parsedParameters' in prompt ? prompt.parsedParameters : prompt.parameters;

		if (!isValidPromptParameters(params)) {
			errors.parameters = 'Los parámetros tienen un formato inválido';
		}

		// Validar tags
		const tags = 'parsedTags' in prompt ? prompt.parsedTags : prompt.tags;

		if (!isValidPromptTags(tags)) {
			errors.tags = 'Los tags tienen un formato inválido';
		}

		return {
			isValid: Object.keys(errors).length === 0,
			errors,
		};
	} catch (error) {
		validatorsLogger.error('❌ Error al validar prompt completo:', error);
		return {
			isValid: false,
			errors: {
				general: 'Error al validar el prompt',
			},
		};
	}
}
