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

/**
 * Simula la ejecución de un prompt (para desarrollo/pruebas)
 * @param content Contenido del prompt
 * @param config Configuración de ejecución
 * @returns Respuesta simulada
 */
async function simulatePromptExecution(content: string, config: PromptExecutionConfig): Promise<AIModelResponse> {
	// Calcular tiempo de ejecución simulado (entre 1 y 3 segundos)
	const executionTime = Math.floor(Math.random() * 2000) + 1000;

	// Esperar el tiempo de ejecución simulado
	await new Promise((resolve) => setTimeout(resolve, executionTime));

	// Contar tokens aproximados
	const promptTokens = estimateTokenCount(content);

	// Generar un número aleatorio de tokens para la respuesta (entre 100 y 500)
	const completionTokens = Math.floor(Math.random() * 400) + 100;

	// Generar respuesta simulada
	return {
		content: `[Respuesta simulada para desarrollo]\n\nPrompt recibido con ${promptTokens} tokens aproximados.\n\nEste es un texto generado automáticamente para simular una respuesta de IA. La simulación se ejecutó con la configuración:\n- Modelo: ${config.model}\n- Temperatura: ${config.temperature}\n- Max tokens: ${config.maxTokens}\n\nEsta respuesta tiene aproximadamente ${completionTokens} tokens simulados.`,
		tokens: {
			prompt: promptTokens,
			completion: completionTokens,
			total: promptTokens + completionTokens,
		},
		model: config.model || 'simulation',
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

		// Por ahora, simulamos la ejecución para desarrollo
		// En producción, aquí se conectaría con la API del modelo específico
		let response: AIModelResponse;

		if (process.env.NODE_ENV === 'development') {
			response = await simulatePromptExecution(preparedContent, finalConfig);
		} else {
			// TODO: Implementar integración con APIs reales
			throw new Error('Ejecución real de prompts no implementada');
		}

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

		// Si se debe guardar en el historial, hacerlo
		if (finalConfig.saveToHistory) {
			// TODO: Implementar guardado en historial
			executionLogger.info(`📝 Guardando ejecución en historial para prompt: ${prompt.id}`);
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
			executionLogger.error('❌ Error al añadir ejecución al historial:', error);
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
			throw new Error('El tamaño máximo del historial debe ser al menos 1');
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
