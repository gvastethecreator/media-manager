import { serverLogger } from '@/lib/logger/server-logger';
import { PromptModel } from '@/types/entities/prompt/enums';
import type { PromptExecutionResult } from '@/types/entities/prompt/extended';
import type { PromptBase } from '@/types/entities/prompt/types';
import { replaceVariablesInContent } from './helpers';
import { estimateTokenCount } from './usage';

const executionLogger = serverLogger.withContext('PromptExecution');

/**
 * Configuración para la ejecución de un prompt
 */
export interface PromptExecutionConfig {
	/**
	 * Número máximo de tokens en la respuesta
	 */
	maxTokens?: number;
	/**
	 * Modelo a utilizar (si se omite, se usa el definido en el prompt)
	 */
	model?: PromptModel | string;

	/**
	 * Opciones adicionales específicas del modelo
	 */
	modelOptions?: Record<string, any>;

	/**
	 * Si se debe registrar esta ejecución en el historial
	 */
	saveToHistory?: boolean;

	/**
	 * Temperatura para la generación (0-1)
	 */
	temperature?: number;

	/**
	 * Timeout para la ejecución en milisegundos
	 */
	timeoutMs?: number;

	/**
	 * Variables para reemplazar en el contenido
	 */
	variables?: Record<string, any>;
}

/**
 * Respuesta básica de un modelo de IA
 */
interface AIModelResponse {
	content: string;
	executionTime: number;
	model: string;
	tokens?: {
		prompt: number;
		completion: number;
		total: number;
	};
}

/**
 * Estado de la ejecución de un prompt
 */

/**
 * Prepara el contenido del prompt reemplazando variables
 * @param prompt Prompt a preparar
 * @param variables Variables para reemplazar
 * @returns Contenido preparado
 */
function preparePromptContent(prompt: PromptBase, variables?: Record<string, any>): string {
	try {
		// Si no hay variables, devolver el contenido original
		if (!variables || Object.keys(variables).length === 0) {
			return prompt.content || '';
		}

		// Reemplazar variables en el contenido
		return replaceVariablesInContent(prompt.content || '', variables);
	} catch (error) {
		executionLogger.error('❌ Error al preparar contenido del prompt:', error);
		return prompt.content || '';
	}
}

function createLocalPromptExecution(content: string, config: PromptExecutionConfig): AIModelResponse {
	const promptTokens = estimateTokenCount(content);
	const completionTokens = Math.max(48, Math.min(config.maxTokens ?? 1000, Math.round(promptTokens * 0.35) + 64));
	const executionTime = Math.max(40, Math.min(1800, promptTokens * 2));
	const compactContent = content.trim();
	const previewContent =
		compactContent.length > 1200 ? `${compactContent.slice(0, 1200)}\n\n[…contenido truncado…]` : compactContent;
	const variablesBlock =
		config.variables && Object.keys(config.variables).length > 0
			? JSON.stringify(config.variables, null, 2)
			: 'Sin variables';

	return {
		content: [
			'[Ejecución local del prompt]',
			`Modelo: ${config.model || 'local-preview'}`,
			`Temperatura: ${config.temperature ?? 0.7}`,
			`Máx. tokens: ${config.maxTokens ?? 1000}`,
			'',
			'Variables:',
			variablesBlock,
			'',
			'Contenido preparado:',
			previewContent || '(sin contenido)',
		].join('\n'),
		tokens: {
			prompt: promptTokens,
			completion: completionTokens,
			total: promptTokens + completionTokens,
		},
		model: config.model || 'local-preview',
		executionTime,
	};
}

/**
 * Ejecuta un prompt con un modelo de IA
 * @param prompt Prompt a ejecutar
 * @param config Configuración de ejecución
 * @returns Resultado de la ejecución
 */
export async function executePrompt(
	prompt: PromptBase,
	config: PromptExecutionConfig = {}
): Promise<PromptExecutionResult> {
	const startTime = Date.now();

	try {
		// Configuración por defecto
		const defaultConfig: PromptExecutionConfig = {
			model: prompt.type || 'default',
			temperature: 0.7,
			maxTokens: 1000,
			saveToHistory: true,
			timeoutMs: 30_000,
		}; // Combinar configuración por defecto con la proporcionada
		const finalConfig = { ...defaultConfig, ...config };

		// Preparar contenido reemplazando variables
		const preparedContent = preparePromptContent(prompt, finalConfig.variables);

		executionLogger.info(`🚀 Ejecutando prompt: ${prompt.name}`);

		const response = createLocalPromptExecution(preparedContent, finalConfig);

		// Calcular tiempo de ejecución
		const executionTime = Date.now() - startTime;

		// Crear resultado
		const result: PromptExecutionResult = {
			promptId: prompt.id,
			content: response.content,
			model: finalConfig.model as string,
			tokens: response.tokens,
			executionTime,
			timestamp: new Date(),
		};

		if (finalConfig.saveToHistory) {
			PromptExecutionHistory.getInstance().addExecution(result);
			executionLogger.info(`📝 Ejecución almacenada en historial para prompt: ${prompt.id}`);
		}

		executionLogger.info(`✅ Prompt ejecutado correctamente en ${executionTime}ms`);
		return result;
	} catch (error) {
		// Capturar error y devolver resultado con estado fallido
		const executionTime = Date.now() - startTime;
		executionLogger.error('❌ Error al ejecutar prompt:', error);

		return {
			promptId: prompt.id,
			content: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			model: (config.model as string) || prompt.type || 'default',
			executionTime,
			timestamp: new Date(),
		};
	}
}

/**
 * Gestiona el historial de ejecuciones de prompts
 */
export class PromptExecutionHistory {
	private static instance: PromptExecutionHistory;
	private readonly executions: Map<string, PromptExecutionResult[]> = new Map();
	private maxHistoryPerPrompt = 10;

	private constructor() {
		// Singleton
	}

	/**
	 * Obtiene la instancia singleton
	 */
	public static getInstance(): PromptExecutionHistory {
		if (!PromptExecutionHistory.instance) {
			PromptExecutionHistory.instance = new PromptExecutionHistory();
		}
		return PromptExecutionHistory.instance;
	}

	/**
	 * Añade un resultado de ejecución al historial
	 */
	public addExecution(execution: PromptExecutionResult): void {
		try {
			const promptId = execution.promptId;

			// Obtener historial actual o crear uno nuevo
			const promptHistory = this.executions.get(promptId) || [];

			// Añadir la nueva ejecución al principio
			promptHistory.unshift(execution);

			// Limitar el número de entradas en el historial
			if (promptHistory.length > this.maxHistoryPerPrompt) {
				promptHistory.pop();
			}

			// Actualizar el historial
			this.executions.set(promptId, promptHistory);
		} catch (error) {
			executionLogger.error('❌ Could not add execution to history:', error);
		}
	}

	/**
	 * Obtiene el historial de ejecuciones para un prompt
	 */
	public getExecutionHistory(promptId: string): PromptExecutionResult[] {
		return this.executions.get(promptId) || [];
	}

	/**
	 * Limpia el historial de ejecuciones para un prompt
	 */
	public clearHistory(promptId: string): void {
		this.executions.delete(promptId);
	}

	/**
	 * Limpia todo el historial de ejecuciones
	 */
	public clearAllHistory(): void {
		this.executions.clear();
	}

	/**
	 * Configura el número máximo de ejecuciones a guardar por prompt
	 */
	public setMaxHistorySize(size: number): void {
		if (size < 1) {
			throw new Error('The maximum history size must be at least 1');
		}
		this.maxHistoryPerPrompt = size;

		// Ajustar los historiales existentes
		for (const [promptId, history] of this.executions.entries()) {
			if (history.length > size) {
				this.executions.set(promptId, history.slice(0, size));
			}
		}
	}

	/**
	 * Obtiene el número máximo de ejecuciones a guardar por prompt
	 */
	public getMaxHistorySize(): number {
		return this.maxHistoryPerPrompt;
	}

	/**
	 * Obtiene todas las ejecuciones
	 */
	public getAllExecutions(): Record<string, PromptExecutionResult[]> {
		const result: Record<string, PromptExecutionResult[]> = {};
		for (const [promptId, history] of this.executions.entries()) {
			result[promptId] = [...history];
		}
		return result;
	}
}
