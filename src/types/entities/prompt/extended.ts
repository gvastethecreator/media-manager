/**
 * @file Tipos extendidos para la entidad Prompt
 * @module types/entities/prompt/extended
 */

import type { PromptBase } from './base';

/**
 * Interfaz extendida para prompt con propiedades adicionales para UI
 */
export interface PromptExtended extends PromptBase {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
	lastUpdated?: Date;
	parsedParameters?: Record<string, any>;
	parsedTags?: string[];
	previewContent?: string;
	stats?: PromptStats;
}

/**
 * Alias para compatibilidad
 */
export type ExtendedPrompt = PromptExtended;

/**
 * Interfaz para filtros de prompts
 */
export interface PromptFilters {
	category?: string;
	endDate?: Date;
	onlyFavorites?: boolean;
	search?: string;
	startDate?: Date;
	tags?: string[];
}

/**
 * Interfaz para respuesta paginada de prompts
 */
export interface PromptsPaginatedResponse {
	items: PromptExtended[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

/**
 * Interfaz para parámetros de ejecución de un prompt
 */
export interface PromptExecutionParams {
	context?: string;
	options?: {
		maxTokens?: number;
		temperature?: number;
		topP?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		model?: string;
	};
	promptId: string;
	variables?: Record<string, any>;
}

/**
 * Interfaz para resultado de ejecución de un prompt
 */
export interface PromptExecutionResult {
	content: string;
	executionTime?: number;
	model?: string;
	promptId: string;
	timestamp: Date;
	tokens?: {
		prompt: number;
		completion: number;
		total: number;
	};
}

/**
 * Estadísticas de uso de un prompt
 */
export interface PromptStats {
	averageExecutionTime: number;
	lastExecuted?: Date;
	popularity: number;
	rating?: number;
	successRate: number;
	usageCount: number;
}
