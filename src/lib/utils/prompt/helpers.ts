import { serverLogger } from '@/lib/logger/server-logger';
import { deserializeParameters, deserializeTags } from '@/transformers/prompt';
import type { PromptComplete, PromptParameter } from '@/types/entities/prompt/types';

const helpersLogger = serverLogger.withContext('PromptHelpers');

/**
 * Genera un contenido de ejemplo basado en los parámetros
 * @param params Parámetros del prompt
 * @returns Contenido de ejemplo
 */
export function generateExampleContent(params: Record<string, any>): string {
	try {
		// Template básico para un prompt de prueba
		const paramEntries = Object.entries(params);
		if (paramEntries.length === 0) {
			return 'Escribe aquí tu prompt...';
		}

		// Crear un ejemplo con placeholders para los parámetros
		let template = 'Escribe un prompt que utilice los siguientes parámetros:\n\n';

		for (const [key, value] of paramEntries) {
			// Mostrar el tipo esperado de valor
			let valueType = typeof value === 'object' ? 'objeto' : typeof value;
			if (Array.isArray(value)) valueType = 'array';

			template += `- {{${key}}}: ${valueType}\n`;
		}

		template += '\nEjemplo de uso:\n';
		template += 'Mi prompt con ';

		// Incluir algunos parámetros de ejemplo en el texto
		const exampleParams = paramEntries.slice(0, 3);
		for (let i = 0; i < exampleParams.length; i++) {
			const [key] = exampleParams[i];
			template += `{{${key}}}`;
			if (i < exampleParams.length - 1) {
				template += i === exampleParams.length - 2 ? ' y ' : ', ';
			}
		}

		return template;
	} catch (error) {
		helpersLogger.error('❌ Error al generar contenido de ejemplo:', error);
		return 'Escribe aquí tu prompt...';
	}
}

/**
 * Obtiene una lista de variables disponibles en un prompt
 * @param content Contenido del prompt
 * @returns Array con las variables encontradas
 */
export function extractVariablesFromContent(content: string): string[] {
	try {
		// Buscar patrones como {{variable}}
		const matches = content.match(/\{\{([^}]+)\}\}/g) || [];

		// Extraer solo los nombres de las variables y eliminar duplicados
		const variables = matches
			.map((match) => match.replace(/\{\{|\}\}/g, '').trim())
			.filter((value, index, self) => self.indexOf(value) === index);

		return variables;
	} catch (error) {
		helpersLogger.error('❌ Error al extraer variables del contenido:', error);
		return [];
	}
}

/**
 * Reemplaza las variables en un contenido con sus valores
 * @param content Contenido con variables {{variable}}
 * @param variables Objeto con valores para las variables
 * @returns Contenido con variables reemplazadas
 */
export function replaceVariablesInContent(content: string, variables: Record<string, any>): string {
	try {
		let result = content;

		// Reemplazar cada variable por su valor
		for (const [key, value] of Object.entries(variables)) {
			const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
			result = result.replace(regex, String(value));
		}

		return result;
	} catch (error) {
		helpersLogger.error('❌ Error al reemplazar variables en contenido:', error);
		return content;
	}
}

/**
 * Tipo extendido de PromptComplete para la UI con campos adicionales
 */
export interface PromptExtended extends PromptComplete {
	parsedTags: string[];
	parsedParameters: PromptParameter[];
	previewContent?: string;
	lastUpdated?: Date;
}

/**
 * Convierte un prompt básico a un prompt extendido con propiedades serializadas
 * @param prompt Prompt básico
 * @returns Prompt extendido
 */
export function preparePromptForDisplay(prompt: PromptComplete): PromptExtended {
	try {
		return {
			...prompt,
			parsedTags: Array.isArray(prompt.tags)
				? prompt.tags
				: typeof prompt.tags === 'string'
					? deserializeTags(prompt.tags)
					: [],
			parsedParameters:
				typeof prompt.parameters === 'object' && prompt.parameters !== null
					? Object.entries(prompt.parameters).map(([key, value]) => ({ key, value }))
					: typeof prompt.parameters === 'string'
						? deserializeParameters(prompt.parameters)
						: [],
			previewContent: prompt.content ? `${prompt.content.substring(0, 100)}...` : undefined,
			lastUpdated: prompt.updatedAt,
		};
	} catch (error) {
		helpersLogger.error('❌ Error al preparar prompt para mostrar:', error);
		return {
			...prompt,
			parsedTags: [],
			parsedParameters: [],
		};
	}
}

/**
 * Convierte un prompt extendido a formato para guardar en la base de datos
 * @param prompt Prompt extendido desde UI
 * @returns Prompt básico para guardar
 */
export function preparePromptForSaving(prompt: PromptExtended): PromptComplete {
	try {
		return {
			...prompt,
			tags: prompt.parsedTags || [],
			parameters: prompt.parsedParameters || [],
		};
	} catch (error) {
		helpersLogger.error('❌ Error al preparar prompt para guardar:', error);
		return prompt;
	}
}
