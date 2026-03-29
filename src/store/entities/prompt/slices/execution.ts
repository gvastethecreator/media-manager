import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import { executePrompt as runPromptExecution } from '@/lib/utils/prompt/execution';
import type { PromptExecutionParams, PromptExecutionResult } from '@/types/entities/prompt/extended';
import type { PromptStore } from '../types';

const executionLogger = clientLogger.withContext('PromptStore:Execution');

export interface ExecutionSlice {
	clearExecutionResult: () => void;

	// Acciones
	executePrompt: (params: PromptExecutionParams) => Promise<PromptExecutionResult | null>;
	executionError: string | null;
	executionResult: PromptExecutionResult | null;
	// Estado
	isExecuting: boolean;
}

export const createExecutionSlice: StateCreator<PromptStore, [], [], ExecutionSlice> = (set, get) => ({
	// Estado inicial
	isExecuting: false,
	executionResult: null,
	executionError: null,

	// Acciones
	executePrompt: async (params) => {
		try {
			set({ isExecuting: true, executionError: null });
			executionLogger.info('🚀 Ejecutando prompt:', params);

			const state = get();
			const selectedPrompt =
				state.selectedPrompt ?? state.prompts.find((prompt) => prompt.id === params.promptId) ?? null;

			if (!selectedPrompt) {
				throw new Error(`No se encontró el prompt con id ${params.promptId}`);
			}

			const promptForExecution = params.context
				? {
						...selectedPrompt,
						content: [selectedPrompt.content ?? '', '', 'Contexto adicional:', params.context]
							.filter(Boolean)
							.join('\n'),
					}
				: selectedPrompt;

			const result = await runPromptExecution(promptForExecution, {
				model: params.options?.model,
				maxTokens: params.options?.maxTokens,
				temperature: params.options?.temperature,
				variables: params.variables,
				saveToHistory: true,
			});

			set({ executionResult: result, isExecuting: false });
			executionLogger.info('✅ Prompt ejecutado:', result);
			return result;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al ejecutar prompt';
			executionLogger.error('❌ Error al ejecutar prompt:', error);
			set({ executionError: message, isExecuting: false });
			return null;
		}
	},

	clearExecutionResult: () => {
		executionLogger.info('🧹 Limpiando resultado de ejecución');
		set({ executionResult: null, executionError: null });
	},
});
