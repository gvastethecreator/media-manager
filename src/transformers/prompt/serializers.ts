import { serverLogger } from '@/lib/logger/server-logger';
import type { PromptBase, PromptExtended } from '@/types/entities/prompt';

const serializersLogger = serverLogger.withContext('PromptSerializers');

/**
 * Serializa un array de tags desde un string JSON
 * En la base de datos, los tags pueden almacenarse como un string JSON que representa un array
 *
 * @param tagsString String JSON con tags o "empty_array"
 * @returns Array de strings con los tags correctamente tipado
 */
export function serializeTags(tagsString?: string | null): string[] {
	if (!tagsString) return [];

	try {
		if (tagsString === 'empty_array') return [];
		const parsed = JSON.parse(tagsString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		serializersLogger.error('❌ Error al serializar tags:', error);
		return [];
	}
}

/**
 * Deserializa un array de tags a string JSON para almacenamiento en BD
 * Si el array está vacío, retorna "empty_array" como convención
 *
 * @param tags Array de tags
 * @returns String JSON o "empty_array" si está vacío
 */
export function deserializeTags(tags: string[]): string {
	try {
		return tags && tags.length > 0 ? JSON.stringify(tags) : 'empty_array';
	} catch (error) {
		serializersLogger.error('❌ Error al deserializar tags:', error);
		return 'empty_array';
	}
}

/**
 * Serializa parámetros desde un string JSON a un objeto JavaScript
 * En la base de datos, los parámetros se almacenan como un string JSON que representa un objeto
 *
 * @param parametersString String JSON con parámetros o "{}"
 * @returns Objeto con los parámetros correctamente tipado
 */
export function serializeParameters(parametersString?: string | null): Record<string, any> {
	if (!parametersString) return {};

	try {
		if (parametersString === '{}') return {};
		const parsed = JSON.parse(parametersString);
		return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
	} catch (error) {
		serializersLogger.error('❌ Error al serializar parámetros:', error);
		return {};
	}
}

/**
 * Deserializa un objeto de parámetros a string JSON para almacenamiento en BD
 * Si el objeto está vacío, retorna "{}" como convención
 *
 * @param parameters Objeto con parámetros
 * @returns String JSON o "{}" si está vacío
 */
export function deserializeParameters(parameters: Record<string, any>): string {
	try {
		return Object.keys(parameters).length > 0 ? JSON.stringify(parameters) : '{}';
	} catch (error) {
		serializersLogger.error('❌ Error al deserializar parámetros:', error);
		return '{}';
	}
}

/**
 * Transforma un prompt base a un prompt extendido con propiedades para UI
 * Deserializa campos JSON almacenados como strings a sus tipos correspondientes
 *
 * @param prompt Prompt base
 * @returns Prompt extendido con campos parseados y propiedades adicionales
 */
export function toExtendedPrompt(prompt: PromptBase): PromptExtended {
	return {
		...prompt,
		parsedTags: serializeTags(prompt.tags),
		parsedParameters: serializeParameters(prompt.parameters),
		previewContent: prompt.content ? getPreviewContent(prompt.content) : undefined,
		lastUpdated: prompt.updatedAt instanceof Date ? prompt.updatedAt : new Date(prompt.updatedAt),
	};
}

/**
 * Genera un preview del contenido para mostrar en UI
 * @param content Contenido completo
 * @param maxLength Longitud máxima del preview
 * @returns Preview del contenido
 */
function getPreviewContent(content: string, maxLength = 150): string {
	if (!content) return '';
	if (content.length <= maxLength) return content;

	return `${content.substring(0, maxLength)}...`;
}
