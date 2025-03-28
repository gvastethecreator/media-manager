import { serverLogger } from '@/lib/logger/server-logger';
import type { EntityType } from '@/types/entities/entities';
import type { StateCreator } from 'zustand';
import type { PromptStore } from '../types';

const relationsLogger = serverLogger.withContext('PromptStore:Relations');

export interface RelationsSlice {
	// Acciones
	addPromptToEntity: (promptId: string, entityId: string, entityType: EntityType) => Promise<void>;
	removePromptFromEntity: (promptId: string, entityId: string, entityType: EntityType) => Promise<void>;
}

// Acciones mock para desarrollo (se reemplazarán con server actions)
const mockApi = {
	addPromptToEntity: async (promptId: string, entityId: string, entityType: EntityType): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	removePromptFromEntity: async (promptId: string, entityId: string, entityType: EntityType): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},
};

export const createRelationsSlice: StateCreator<PromptStore, [], [], RelationsSlice> = (set, get) => ({
	// Acciones
	addPromptToEntity: async (promptId, entityId, entityType) => {
		try {
			relationsLogger.info('🔗 Asociando prompt a entidad:', { promptId, entityId, entityType });

			// Llamar a server action para asociar prompt a entidad
			await mockApi.addPromptToEntity(promptId, entityId, entityType);

			// Recargar prompts para actualizar las relaciones
			await get().loadPrompts();

			relationsLogger.info('✅ Prompt asociado correctamente');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al asociar prompt';
			relationsLogger.error('❌ Error al asociar prompt:', error);
			set({ error: message });
		}
	},

	removePromptFromEntity: async (promptId, entityId, entityType) => {
		try {
			relationsLogger.info('🔓 Desasociando prompt de entidad:', { promptId, entityId, entityType });

			// Llamar a server action para desasociar prompt de entidad
			await mockApi.removePromptFromEntity(promptId, entityId, entityType);

			// Recargar prompts para actualizar las relaciones
			await get().loadPrompts();

			relationsLogger.info('✅ Prompt desasociado correctamente');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al desasociar prompt';
			relationsLogger.error('❌ Error al desasociar prompt:', error);
			set({ error: message });
		}
	},
});
