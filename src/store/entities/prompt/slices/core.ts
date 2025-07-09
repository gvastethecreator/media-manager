import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import { getPrompts, createPrompt, updatePrompt, deletePromptFromApi } from '@/lib/api/client/prompt.client';
import type { PromptBase, PromptCreateInput, PromptUpdateInput, PromptWithStats } from '@/types/entities/prompt';
import type { PromptStore } from '../types';

const coreLogger = clientLogger.withContext('PromptStore:Core');

export interface CoreSlice {
	// Estado
	prompts: PromptWithStats[];
	selectedPrompt: PromptBase | null;
	isLoading: boolean;
	error: string | null;

	// Acciones
	loadPrompts: () => Promise<void>;
	setPrompts: (prompts: PromptWithStats[]) => void;
	createPrompt: (prompt: PromptCreateInput) => Promise<void>;
	updatePrompt: (id: string, prompt: PromptUpdateInput) => Promise<void>;
	deletePrompt: (id: string) => Promise<void>;
	selectPrompt: (prompt: PromptBase | null) => void;
	reset: () => void;
}

// Importar las server actions reales

export const createCoreSlice: StateCreator<PromptStore, [], [], CoreSlice> = (set, get) => ({
	// Estado inicial
	prompts: [],
	selectedPrompt: null,
	isLoading: false,
	error: null,

	// Acciones
	loadPrompts: async () => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('🔄 Cargando prompts');

			// Llamar a server action para obtener prompts
			const prompts = await getPrompts();

			// Los prompts ya vienen transformados desde la server action
			const transformedPrompts = prompts;

			set({ prompts: transformedPrompts, isLoading: false });
			coreLogger.info('✅ Prompts cargados:', { count: transformedPrompts.length });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar prompts';
			coreLogger.error('❌ Error al cargar prompts:', error);
			set({ error: message, isLoading: false });
		}
	},

	setPrompts: (prompts) => {
		coreLogger.info('📥 Estableciendo prompts manualmente:', { count: prompts.length });
		set({ prompts, isLoading: false });
	},

	createPrompt: async (prompt) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('✨ Creando prompt:', prompt);

			// Llamar a server action para crear prompt
			await createPrompt(prompt);

			// Recargar prompts para actualizar la lista
			await get().loadPrompts();

			coreLogger.info('✅ Prompt creado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear prompt';
			coreLogger.error('❌ Error al crear prompt:', error);
			set({ error: message, isLoading: false });
		}
	},

	updatePrompt: async (id, prompt) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('🔄 Actualizando prompt:', prompt);

			// Llamar a server action para actualizar prompt
			await updatePrompt(id, prompt);

			// Recargar prompts para actualizar la lista
			await get().loadPrompts();

			coreLogger.info('✅ Prompt actualizado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar prompt';
			coreLogger.error('❌ Error al actualizar prompt:', error);
			set({ error: message, isLoading: false });
		}
	},

	deletePrompt: async (id) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('🗑️ Eliminando prompt:', id);

			// Llamar a server action para eliminar prompt
			await deletePromptFromApi(id);

			// Recargar prompts para actualizar la lista
			await get().loadPrompts();

			// Si el prompt seleccionado es el que se eliminó, deseleccionarlo
			if (get().selectedPrompt?.id === id) {
				set({ selectedPrompt: null });
			}

			coreLogger.info('✅ Prompt eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar prompt';
			coreLogger.error('❌ Error al eliminar prompt:', error);
			set({ error: message, isLoading: false });
		}
	},

	selectPrompt: (prompt) => {
		set({ selectedPrompt: prompt });
	},

	reset: () => {
		set({
			prompts: [],
			selectedPrompt: null,
			isLoading: false,
			error: null,
		});
	},
});
