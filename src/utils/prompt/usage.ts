import { serverLogger } from '@/lib/logger/server-logger';
import type { PromptBase, PromptExecutionResult } from '@/types/entities/prompt';
import { PromptModel } from '@/types/entities/prompt/enums';

const usageLogger = serverLogger.withContext('PromptUsage');

/**
 * Configuración de tokens por modelo
 */
interface TokenRates {
  inputTokenRate: number;  // Costo por 1000 tokens de entrada
  outputTokenRate: number; // Costo por 1000 tokens de salida
}

/**
 * Mapa de costos aproximados por modelo (en USD por 1000 tokens)
 * Estos valores son aproximados y deben actualizarse según cambios de precios
 */
const MODEL_TOKEN_RATES: Record<PromptModel, TokenRates> = {
  [PromptModel.GPT_3_5]: { inputTokenRate: 0.0005, outputTokenRate: 0.0015 },
  [PromptModel.GPT_4]: { inputTokenRate: 0.03, outputTokenRate: 0.06 },
  [PromptModel.GPT_4_TURBO]: { inputTokenRate: 0.01, outputTokenRate: 0.03 },
  [PromptModel.CLAUDE_INSTANT]: { inputTokenRate: 0.0008, outputTokenRate: 0.0024 },
  [PromptModel.CLAUDE_2]: { inputTokenRate: 0.008, outputTokenRate: 0.024 },
  [PromptModel.CLAUDE_3_OPUS]: { inputTokenRate: 0.015, outputTokenRate: 0.075 },
  [PromptModel.CLAUDE_3_SONNET]: { inputTokenRate: 0.003, outputTokenRate: 0.015 },
  [PromptModel.CLAUDE_3_HAIKU]: { inputTokenRate: 0.00025, outputTokenRate: 0.00125 },
  [PromptModel.LLAMA_3_8B]: { inputTokenRate: 0.0001, outputTokenRate: 0.0002 },
  [PromptModel.LLAMA_3_70B]: { inputTokenRate: 0.0007, outputTokenRate: 0.0014 },
  [PromptModel.GEMINI_PRO]: { inputTokenRate: 0.0005, outputTokenRate: 0.0015 },
  [PromptModel.GEMINI_FLASH]: { inputTokenRate: 0.00035, outputTokenRate: 0.00105 },
  [PromptModel.MISTRAL_7B]: { inputTokenRate: 0.0002, outputTokenRate: 0.0006 },
  [PromptModel.CUSTOM]: { inputTokenRate: 0.001, outputTokenRate: 0.002 },
};

/**
 * Estimación aproximada de tokens por carácter
 * Varía según el modelo, pero usamos 4 caracteres = 1 token como aproximación
 */
const CHARS_PER_TOKEN = 4;

/**
 * Estima el número de tokens basado en cantidad de caracteres
 * @param text Texto a estimar
 * @returns Número estimado de tokens
 */
export function estimateTokenCount(text: string): number {
  try {
    if (!text) return 0;
    return Math.ceil(text.length / CHARS_PER_TOKEN);
  } catch (error) {
    usageLogger.error('❌ Error al estimar tokens:', error);
    return 0;
  }
}

/**
 * Calcula el costo aproximado de una ejecución
 * @param model Modelo utilizado
 * @param inputTokens Tokens de entrada
 * @param outputTokens Tokens de salida
 * @returns Costo aproximado en USD
 */
export function calculateCost(
  model: PromptModel | string,
  inputTokens: number,
  outputTokens: number
): number {
  try {
    // Si el modelo no está en nuestro mapa, usar GPT-3.5 como referencia
    const rates = MODEL_TOKEN_RATES[model as PromptModel] || MODEL_TOKEN_RATES[PromptModel.GPT_3_5];

    const inputCost = (inputTokens / 1000) * rates.inputTokenRate;
    const outputCost = (outputTokens / 1000) * rates.outputTokenRate;

    return inputCost + outputCost;
  } catch (error) {
    usageLogger.error('❌ Error al calcular costo:', error);
    return 0;
  }
}

/**
 * Calcula estadísticas de uso para un prompt
 * @param prompt Prompt base
 * @param executions Array de resultados de ejecución
 * @returns Estadísticas calculadas
 */
export function calculatePromptStats(
  prompt: PromptBase,
  executions: PromptExecutionResult[]
): {
  totalExecutions: number;
  totalTokens: number;
  averageTokensPerExecution: number;
  totalCost: number;
  averageExecutionTime: number;
} {
  try {
    // Si no hay ejecuciones, devolver valores por defecto
    if (!executions || executions.length === 0) {
      return {
        totalExecutions: 0,
        totalTokens: 0,
        averageTokensPerExecution: 0,
        totalCost: 0,
        averageExecutionTime: 0,
      };
    }

    // Calcular estadísticas
    const totalExecutions = executions.length;

    let totalTokens = 0;
    let totalCost = 0;
    let totalExecutionTime = 0;

    executions.forEach(execution => {
      // Sumar tokens
      const executionTokens = execution.tokens?.total || 0;
      totalTokens += executionTokens;

      // Sumar costo
      const inputTokens = execution.tokens?.prompt || 0;
      const outputTokens = execution.tokens?.completion || 0;
      totalCost += calculateCost(
        execution.model || prompt.model,
        inputTokens,
        outputTokens
      );

      // Sumar tiempo de ejecución
      totalExecutionTime += execution.executionTime || 0;
    });

    // Calcular promedios
    const averageTokensPerExecution = totalExecutions > 0 ? totalTokens / totalExecutions : 0;
    const averageExecutionTime = totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0;

    return {
      totalExecutions,
      totalTokens,
      averageTokensPerExecution,
      totalCost,
      averageExecutionTime,
    };
  } catch (error) {
    usageLogger.error('❌ Error al calcular estadísticas de prompt:', error);
    return {
      totalExecutions: 0,
      totalTokens: 0,
      averageTokensPerExecution: 0,
      totalCost: 0,
      averageExecutionTime: 0,
    };
  }
}

/**
 * Genera un informe completo de uso de prompts
 * @param prompts Lista de prompts
 * @param executions Mapa de ejecuciones por promptId
 * @returns Informe de uso
 */
export function generateUsageReport(
  prompts: PromptBase[],
  executions: Record<string, PromptExecutionResult[]>
): {
  totalPrompts: number;
  totalExecutions: number;
  totalTokens: number;
  totalCost: number;
  averageExecutionTime: number;
  promptStats: Record<string, ReturnType<typeof calculatePromptStats>>;
} {
  try {
    // Inicializar datos totales
    let totalExecutions = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let totalExecutionTime = 0;
    const promptStats: Record<string, ReturnType<typeof calculatePromptStats>> = {};

    // Calcular estadísticas para cada prompt
    prompts.forEach(prompt => {
      const promptExecutions = executions[prompt.id] || [];
      const stats = calculatePromptStats(prompt, promptExecutions);

      // Guardar estadísticas individuales
      promptStats[prompt.id] = stats;

      // Acumular totales
      totalExecutions += stats.totalExecutions;
      totalTokens += stats.totalTokens;
      totalCost += stats.totalCost;
      totalExecutionTime += stats.totalExecutions * stats.averageExecutionTime;
    });

    // Calcular promedio global
    const averageExecutionTime = totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0;

    return {
      totalPrompts: prompts.length,
      totalExecutions,
      totalTokens,
      totalCost,
      averageExecutionTime,
      promptStats,
    };
  } catch (error) {
    usageLogger.error('❌ Error al generar informe de uso:', error);
    return {
      totalPrompts: 0,
      totalExecutions: 0,
      totalTokens: 0,
      totalCost: 0,
      averageExecutionTime: 0,
      promptStats: {},
    };
  }
}