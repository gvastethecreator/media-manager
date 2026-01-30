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
	parsedTags?: string[];
	parsedParameters?: Record<string, any>;
	previewContent?: string;
	lastUpdated?: Date;
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
	search?: string;
	category?: string;
	tags?: string[];
	onlyFavorites?: boolean;
	startDate?: Date;
	endDate?: Date;
}

/**
 * Interfaz para respuesta paginada de prompts
 */
export interface PromptsPaginatedResponse {
	items: PromptExtended[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

/**
 * Interfaz para parámetros de ejecución de un prompt
 */
export interface PromptExecutionParams {
	promptId: string;
	variables?: Record<string, any>;
	context?: string;
	options?: {
		maxTokens?: number;
		temperature?: number;
		topP?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		model?: string;
	};
}

/**
 * Interfaz para resultado de ejecución de un prompt
 */
export interface PromptExecutionResult {
	promptId: string;
	content: string;
	tokens?: {
		prompt: number;
		completion: number;
		total: number;
	};
	model?: string;
	executionTime?: number;
	timestamp: Date;
}

/**
 * Estadísticas de uso de un prompt
 */
export interface PromptStats {
	usageCount: number;
	successRate: number;
	averageExecutionTime: number;
	lastExecuted?: Date;
	popularity: number;
	rating?: number;
}
