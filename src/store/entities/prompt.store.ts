import {
	type PromptCreate,
	type PromptUpdate,
	type PromptWithStats,
	addPromptToImage,
	createPrompt as createPromptAction,
	deletePrompt as deletePromptAction,
	getPrompts,
	updatePrompt as updatePromptAction,
} from '@/app/actions/prompts/prompt.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Prompt } from '@prisma/client';
import { create } from 'zustand';

const promptLogger = serverLogger.withContext('PromptStore');

const mapToPromptWithStats = (prompt: Awaited<ReturnType<typeof getPrompts>>[0]): PromptWithStats => ({
	...prompt,
	_count: prompt._count,
	lastUpdated: new Date(),
});

interface PromptStore {
	prompts: PromptWithStats[];
	isLoading: boolean;
	error: string | null;
	selectedItem: Prompt | null;
	loadPrompts: () => Promise<void>;
	createPrompt: typeof createPromptAction;
	updatePrompt: typeof updatePromptAction;
	deletePrompt: (id: string) => Promise<void>;
	addPromptToImage: (imageId: string, promptId: string) => Promise<void>;
	selectItem: (prompt: Prompt) => void;
}

export const usePromptStore = create<PromptStore>((set, get) => ({
	prompts: [],
	isLoading: false,
	error: null,
	selectedItem: null,

	loadPrompts: async () => {
		try {
			set({ isLoading: true, error: null });
			promptLogger.info('Cargando prompts');
			const rawPrompts = await getPrompts();
			const prompts = rawPrompts.map(mapToPromptWithStats);
			set({ prompts, isLoading: false });
			promptLogger.info('✅ Prompts cargados');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar prompts';
			promptLogger.error('❌ Error al cargar prompts:', error);
			set({ error: message, isLoading: false });
		}
	},

	selectItem: (prompt) => {
		set({ selectedItem: prompt });
	},

	createPrompt: async (prompt) => {
		try {
			set({ isLoading: true, error: null });
			promptLogger.info('✨ Creando prompt:', prompt);
			const newPrompt = await createPromptAction(prompt);
			await get().loadPrompts();
			promptLogger.info('✅ Prompt creado');
			return newPrompt;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear prompt';
			promptLogger.error('❌ Error al crear prompt:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	updatePrompt: async (id, prompt) => {
		try {
			set({ isLoading: true, error: null });
			promptLogger.info('💾 Actualizando prompt:', prompt);
			const updatedPrompt = await updatePromptAction(id, { ...prompt, id });
			await get().loadPrompts();
			promptLogger.info('✅ Prompt actualizado');
			return updatedPrompt;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar prompt';
			promptLogger.error('❌ Error al actualizar prompt:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	deletePrompt: async (id) => {
		try {
			set({ isLoading: true, error: null });
			promptLogger.info('🗑️ Eliminando prompt:', id);
			await deletePromptAction(id);
			await get().loadPrompts();
			promptLogger.info('✅ Prompt eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar prompt';
			promptLogger.error('❌ Error al eliminar prompt:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	addPromptToImage: async (imageId, promptId) => {
		try {
			set({ isLoading: true, error: null });
			promptLogger.info('➕ Añadiendo prompt a imagen:', { promptId, imageId });
			await addPromptToImage(promptId, imageId);
			await get().loadPrompts();
			promptLogger.info('✅ Prompt añadido a imagen');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al añadir prompt a imagen';
			promptLogger.error('❌ Error al añadir prompt a imagen:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
}));
