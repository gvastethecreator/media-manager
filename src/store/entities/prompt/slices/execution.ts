import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { PromptExecutionParams, PromptExecutionResult } from '@/types/entities/prompt';
import type { PromptStore } from '../types';

const executionLogger = clientLogger.withContext('PromptStore:Execution');

export interface ExecutionSlice {
	// Estado
	isExecuting: boolean;
	executionResult: PromptExecutionResult | null;
	executionError: string | null;

	// Acciones
	executePrompt: (params: PromptExecutionParams) => Promise<PromptExecutionResult | null>;
	clearExecutionResult: () => void;
}

// Acción mock para desarrollo (se reemplazará con server action real)
const mockExecutePrompt = async (params: PromptExecutionParams): Promise<PromptExecutionResult> => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	return {
		promptId: params.promptId,
		content: `Respuesta simulada para prompt: ${params.promptId}\nContexto: ${params.context || 'No proporcionado'}\nVariables: ${JSON.stringify(params.variables || {})}`,
		tokens: {
			prompt: 50,
			completion: 100,
			total: 150,
		},
		model: params.options?.model || 'mock-model',
		executionTime: 1.2,
		timestamp: new Date(),
	};
};

export const createExecutionSlice: StateCreator<PromptStore, [], [], ExecutionSlice> = (set) => ({
	// Estado inicial
	isExecuting: false,
	executionResult: null,
	executionError: null,

	// Acciones
	executePrompt: async (params) => {
		try {
			set({ isExecuting: true, executionError: null });
			executionLogger.info('🚀 Ejecutando prompt:', params);

			// Llamar a server action para ejecutar prompt
			const result = await mockExecutePrompt(params);

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
