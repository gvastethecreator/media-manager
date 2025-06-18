/**
 * @file Serializadores para la entidad Prompt
 * @module transformers/prompt/serializers
 */

import { Logger } from '@/lib/logger';
import type { PromptBase, PromptWithRelations } from '@/types/entities/prompt';

const logger = new Logger('PromptSerializers');

/**
 * Deserializa el campo de parámetros de un prompt
 * @param parameters Campo parameters como string JSON
 * @returns Objeto de parámetros deserializado
 */
export function deserializeParameters(parameters: string): Record<string, any> {
	try {
		if (!parameters || parameters === 'null' || parameters === 'undefined') {
			return {};
		}

		return JSON.parse(parameters);
	} catch (error) {
		logger.warn('Error deserializando parámetros de prompt, devolviendo objeto vacío:', error);
		return {};
	}
}

/**
 * Deserializa el campo de etiquetas de un prompt
 * @param tags Campo tags como string JSON
 * @returns Array de etiquetas deserializado
 */
export function deserializeTags(tags: string | undefined): string[] {
	try {
		if (!tags || tags === 'null' || tags === 'undefined') {
			return [];
		}

		return JSON.parse(tags);
	} catch (error) {
		logger.warn('Error deserializando tags de prompt, devolviendo array vacío:', error);
		return [];
	}
}

/**
 * Serializa un objeto de parámetros a string JSON
 * @param parameters Objeto de parámetros
 * @returns String JSON
 */
export function serializeParameters(parameters: Record<string, any> | null | undefined): string {
	try {
		if (!parameters) {
			return '{}';
		}

		return JSON.stringify(parameters);
	} catch (error) {
		logger.warn('Error serializando parámetros de prompt, devolviendo objeto vacío:', error);
		return '{}';
	}
}

/**
 * Serializa un array de etiquetas a string JSON
 * @param tags Array de etiquetas
 * @returns String JSON
 */
export function serializeTags(tags: string[] | string | null | undefined): string {
	try {
		if (typeof tags === 'string') {
			// Si ya es un string, verificar si es JSON
			try {
				JSON.parse(tags);
				return tags; // Ya es un string JSON válido
			} catch {
				// No es JSON, considerarlo como una etiqueta individual
				return JSON.stringify([tags]);
			}
		}

		if (!tags || !Array.isArray(tags)) {
			return '[]';
		}

		return JSON.stringify(tags);
	} catch (error) {
		logger.warn('Error serializando tags de prompt, devolviendo array vacío:', error);
		return '[]';
	}
}

/**
 * Transforma un prompt base a un prompt extendido con propiedades para UI
 * Deserializa campos JSON almacenados como strings a sus tipos correspondientes
 *
 * @param prompt Prompt base
 * @returns Prompt extendido con campos parseados y propiedades adicionales
 */
export function toExtendedPrompt(prompt: PromptBase): PromptWithRelations {
	return {
		...prompt,
		parsedTags: serializeTags(prompt.tags),
		parsedParameters: serializeParameters(prompt.parameters),
		previewContent: prompt.content ? getPreviewContent(prompt.content) : undefined,
		lastUpdated: prompt.updatedAt instanceof Date ? prompt.updatedAt : new Date(prompt.updatedAt),
	};
}

/**
 * Genera un texto de previsualización para el contenido de un prompt
 * @param content Contenido completo del prompt
 * @param maxLength Longitud máxima del texto de previsualización
 * @returns Texto recortado para previsualización
 */
export function getPreviewContent(content: string, maxLength = 150): string {
	if (!content) {
		return '';
	}

	if (content.length <= maxLength) {
		return content;
	}

	// Buscar el último espacio antes del límite
	const cutPoint = content.substring(0, maxLength).lastIndexOf(' ');
	return `${content.substring(0, cutPoint > 0 ? cutPoint : maxLength)}...`;
}
