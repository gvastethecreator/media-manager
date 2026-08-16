import { serverLogger } from '@/lib/logger/server-logger';
import { PromptModel } from '@/types/entities/prompt/enums';
import type { PromptBase, PromptExtended } from '@/types/entities/prompt/types';
import { extractVariablesFromContent } from './helpers';

const formattersLogger = serverLogger.withContext('PromptFormatters');

/**
 * Formatea una fecha para mostrar en la UI
 * @param date Fecha a formatear
 * @returns Fecha formateada
 */
export function formatPromptDate(date: string | Date): string {
	try {
		const dateObj = typeof date === 'string' ? new Date(date) : date;

		return new Intl.DateTimeFormat('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(dateObj);
	} catch (error) {
		formattersLogger.error('❌ Could not format prompt date:', error);
		return 'Fecha desconocida';
	}
}

/**
 * Formatea el modelo para mostrar en la UI
 * @param model Modelo del prompt
 * @returns Nombre del modelo formateado
 */
export function formatPromptModel(model: PromptModel | string): string {
	try {
		switch (model) {
			case PromptModel.GPT_3_5:
				return 'GPT-3.5 Turbo';
			case PromptModel.GPT_4:
				return 'GPT-4';
			case PromptModel.GPT_4_TURBO:
				return 'GPT-4 Turbo';
			case PromptModel.CLAUDE_INSTANT:
				return 'Claude Instant';
			case PromptModel.CLAUDE_2:
				return 'Claude 2';
			case PromptModel.CLAUDE_3_OPUS:
				return 'Claude 3 Opus';
			case PromptModel.CLAUDE_3_SONNET:
				return 'Claude 3 Sonnet';
			case PromptModel.CLAUDE_3_HAIKU:
				return 'Claude 3 Haiku';
			case PromptModel.LLAMA_3_8B:
				return 'Llama 3 (8B)';
			case PromptModel.LLAMA_3_70B:
				return 'Llama 3 (70B)';
			case PromptModel.GEMINI_PRO:
				return 'Gemini Pro';
			case PromptModel.GEMINI_FLASH:
				return 'Gemini Flash';
			case PromptModel.MISTRAL_7B:
				return 'Mistral (7B)';
			case PromptModel.CUSTOM:
				return 'Personalizado';
			default:
				return String(model);
		}
	} catch (error) {
		formattersLogger.error('❌ Error al formatear modelo de prompt:', error);
		return String(model);
	}
}

/**
 * Trunca el contenido del prompt para mostrar una vista previa
 * @param content Contenido completo del prompt
 * @param maxLength Longitud máxima para la vista previa
 * @returns Contenido truncado
 */
export function truncatePromptContent(content: string, maxLength = 150): string {
	try {
		if (content.length <= maxLength) {
			return content;
		}

		// Truncar y añadir elipsis
		return `${content.substring(0, maxLength).trim()}...`;
	} catch (error) {
		formattersLogger.error('❌ Error al truncar contenido de prompt:', error);
		return content;
	}
}

/**
 * Genera una vista previa para un prompt
 * @param prompt Prompt base o extendido
 * @returns Texto de vista previa
 */
export function generatePromptPreview(prompt: PromptBase | PromptExtended): string {
	try {
		// Extraer variables del contenido
		const variables = extractVariablesFromContent(prompt.content || '');

		// Crear vista previa
		let preview = truncatePromptContent(prompt.content || '');

		// Añadir información sobre variables
		if (variables.length > 0) {
			preview += `\n\nVariables: ${variables.join(', ')}`;
		}

		return preview;
	} catch (error) {
		formattersLogger.error('❌ Could not generate prompt preview:', error);
		return truncatePromptContent(prompt.content || '');
	}
}

/**
 * Formatea los tokens para mostrarlos con separador de miles
 * @param tokens Número de tokens
 * @returns Texto formateado
 */
export function formatTokenCount(tokens: number): string {
	try {
		return new Intl.NumberFormat('es-ES').format(tokens);
	} catch (error) {
		formattersLogger.error('❌ Error al formatear conteo de tokens:', error);
		return String(tokens);
	}
}

/**
 * Formatea el tiempo de ejecución para mostrar en milisegundos o segundos
 * @param executionTime Tiempo en milisegundos
 * @returns Texto formateado
 */
export function formatExecutionTime(executionTime: number): string {
	try {
		if (executionTime < 1000) {
			return `${executionTime}ms`;
		}

		const seconds = executionTime / 1000;
		return `${seconds.toFixed(2)}s`;
	} catch (error) {
		formattersLogger.error('❌ Could not format execution time:', error);
		return `${executionTime}ms`;
	}
}

/**
 * Formatea los parámetros para mostrar en la UI
 * @param parameters Parámetros como objeto o string JSON
 * @returns Texto formateado para UI
 */
export function formatParametersForDisplay(parameters: Record<string, any> | string): string {
	try {
		// Si es string, intentar parsearlo
		const paramsObject =
			typeof parameters === 'string'
				? parameters === '{}' || parameters === 'empty_object'
					? {}
					: JSON.parse(parameters)
				: parameters;

		// Si no hay parámetros, mostrar mensaje
		if (Object.keys(paramsObject).length === 0) {
			return 'Sin parámetros';
		}

		// Formatear cada parámetro
		return Object.entries(paramsObject)
			.map(([key, value]) => {
				// Formatear el valor dependiendo de su tipo
				let formattedValue = '';

				if (typeof value === 'object' && value !== null) {
					formattedValue = JSON.stringify(value);
				} else {
					formattedValue = String(value);
				}

				// Truncar valores muy largos
				if (formattedValue.length > 50) {
					formattedValue = `${formattedValue.substring(0, 47)}...`;
				}

				return `${key}: ${formattedValue}`;
			})
			.join(', ');
	} catch (error) {
		formattersLogger.error('❌ Could not format parameters for display:', error);
		return 'Parámetros inválidos';
	}
}
