import { serverLogger } from '@/lib/logger/server-logger';
import { deserializeParameters, deserializeTags } from '@/transformers/prompt';
import type { PromptComplete, PromptExtended } from '@/types/entities/prompt/types';

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

// PromptExtended is now imported from types

/**
 * Convierte un prompt básico a un prompt extendido con propiedades serializadas
 * @param prompt Prompt básico
 * @returns Prompt extendido
 */
export function preparePromptForDisplay(prompt: PromptComplete): PromptExtended {
	try {
		// Extraer propiedades base sin notes
		const { notes: _, ...basePrompt } = prompt;

		return {
			...basePrompt,
			notes: prompt.notes ? JSON.stringify(prompt.notes) : null,
			parsedTags: Array.isArray(prompt.tags)
				? prompt.tags
				: typeof prompt.tags === 'string'
					? deserializeTags(prompt.tags)
					: [],
			parsedParameters:
				typeof prompt.parameters === 'string' && prompt.parameters !== null
					? deserializeParameters(prompt.parameters)
					: [],
			previewContent: prompt.content ? `${prompt.content.substring(0, 100)}...` : undefined,
			lastUpdated: prompt.updatedAt,
			notesEntities: prompt.notes,
		};
	} catch (error) {
		helpersLogger.error('❌ Error al preparar prompt para mostrar:', error);
		// Extraer propiedades base sin notes para el caso de error
		const { notes: _, ...basePrompt } = prompt;
		return {
			...basePrompt,
			notes: null,
			parsedTags: [],
			parsedParameters: [],
			notesEntities: [],
		};
	}
}

/**
 * Convierte un prompt extendido a formato para guardar en la base de datos
 * @param extendedPrompt Prompt extendido desde UI
 * @returns Prompt básico para guardar
 */
export function preparePromptForSaving(extendedPrompt: PromptExtended): PromptComplete {
	try {
		// Serializar parsedParameters y parsedTags
		const serializedParameters = JSON.stringify(extendedPrompt.parsedParameters || []);
		const serializedTags = JSON.stringify(extendedPrompt.parsedTags || []);

		// Destructurar para separar las propiedades extendidas de las base
		const { parsedTags, parsedParameters, previewContent, lastUpdated, notesEntities, ...basePrompt } = extendedPrompt;

		return {
			...basePrompt,
			tags: serializedTags,
			parameters: serializedParameters,
			notes: notesEntities,
		};
	} catch (error) {
		helpersLogger.error('❌ Error al preparar prompt para guardar:', error);
		// Crear un objeto mínimo válido para PromptComplete
		const baseFields = {
			id: extendedPrompt.id,
			name: extendedPrompt.name,
			description: extendedPrompt.description || null,
			emoji: extendedPrompt.emoji || null,
			color: extendedPrompt.color || null,
			category: extendedPrompt.category || null,
			isPublic: extendedPrompt.isPublic || false,
			isFavorite: extendedPrompt.isFavorite || false,
			totalImages: extendedPrompt.totalImages || 0,
			totalVideos: extendedPrompt.totalVideos || 0,
			type: extendedPrompt.type || null,
			content: extendedPrompt.content || null,
			parameters: extendedPrompt.parameters || null,
			style: extendedPrompt.style || null,
			mood: extendedPrompt.mood || null,
			lighting: extendedPrompt.lighting || null,
			composition: extendedPrompt.composition || null,
			technique: extendedPrompt.technique || null,
			inspiration: extendedPrompt.inspiration || null,
			featuredImage: extendedPrompt.featuredImage || null,
			parentId: extendedPrompt.parentId || null,
			purpose: extendedPrompt.purpose || null,
			createdAt: extendedPrompt.createdAt,
			updatedAt: extendedPrompt.updatedAt,
			tags: '[]',
		};
		return baseFields;
	}
}
