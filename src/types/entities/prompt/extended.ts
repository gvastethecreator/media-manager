/**
 * @file Tipos extendidos para la entidad Prompt
 * @module types/entities/prompt/extended
 */

import type { PromptBase, PromptParameter } from './types';

/**
 * Interfaz extendida para prompt con propiedades adicionales para UI
 */
export interface PromptExtended extends PromptBase {
	parsedTags?: string[];
	parsedParameters?: Record<string, PromptParameter>;
	previewContent?: string;
	lastUpdated?: Date;
	stats?: PromptStats;
}

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
