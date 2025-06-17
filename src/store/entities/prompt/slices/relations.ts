import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { EntityType } from '@/types/entities/entities';
import type { PromptStore } from '../types';

const relationsLogger = clientLogger.withContext('PromptStore:Relations');

export interface RelationsSlice {
	// Acciones generales
	addPromptToEntity: (promptId: string, entityId: string, entityType: EntityType) => Promise<void>;
	removePromptFromEntity: (promptId: string, entityId: string, entityType: EntityType) => Promise<void>;

	// Acciones específicas para nuevas relaciones
	addGroupToPrompt: (promptId: string, groupId: string) => Promise<void>;
	removeGroupFromPrompt: (promptId: string, groupId: string) => Promise<void>;
	addPropertyToPrompt: (promptId: string, propertyId: string) => Promise<void>;
	removePropertyFromPrompt: (promptId: string, propertyId: string) => Promise<void>;
	addWildcardToPrompt: (promptId: string, wildcardId: string) => Promise<void>;
	removeWildcardFromPrompt: (promptId: string, wildcardId: string) => Promise<void>;
	updatePromptRelations: (
		promptId: string,
		data: { groupIds?: string[]; propertyIds?: string[]; wildcardIds?: string[] }
	) => Promise<void>;
}

// Acciones mock para desarrollo (se reemplazarán con server actions)
const mockApi = {
	addPromptToEntity: async (_promptId: string, _entityId: string, _entityType: EntityType): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	removePromptFromEntity: async (_promptId: string, _entityId: string, _entityType: EntityType): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	addGroupToPrompt: async (_promptId: string, _groupId: string): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	removeGroupFromPrompt: async (_promptId: string, _groupId: string): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	addPropertyToPrompt: async (_promptId: string, _propertyId: string): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	removePropertyFromPrompt: async (_promptId: string, _propertyId: string): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	addWildcardToPrompt: async (_promptId: string, _wildcardId: string): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	removeWildcardFromPrompt: async (_promptId: string, _wildcardId: string): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	updatePromptRelations: async (
		_promptId: string,
		_data: { groupIds?: string[]; propertyIds?: string[]; wildcardIds?: string[] }
	): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},
};

export const createRelationsSlice: StateCreator<PromptStore, [], [], RelationsSlice> = (set, get) => ({
	// Acciones generales
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

	// Implementación de las acciones específicas para nuevas relaciones
	addGroupToPrompt: async (promptId, groupId) => {
		try {
			relationsLogger.info('🔗 Asociando grupo a prompt:', { promptId, groupId });

			// Llamar a server action para asociar grupo a prompt
			await mockApi.addGroupToPrompt(promptId, groupId);

			// Recargar prompts para actualizar las relaciones
			await get().loadPrompts();

			relationsLogger.info('✅ Grupo asociado correctamente al prompt');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al asociar grupo al prompt';
			relationsLogger.error('❌ Error al asociar grupo al prompt:', error);
			set({ error: message });
		}
	},

	removeGroupFromPrompt: async (promptId, groupId) => {
		try {
			relationsLogger.info('🔓 Desasociando grupo de prompt:', { promptId, groupId });

			// Llamar a server action para desasociar grupo de prompt
			await mockApi.removeGroupFromPrompt(promptId, groupId);

			// Recargar prompts para actualizar las relaciones
			await get().loadPrompts();

			relationsLogger.info('✅ Grupo desasociado correctamente del prompt');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al desasociar grupo del prompt';
			relationsLogger.error('❌ Error al desasociar grupo del prompt:', error);
			set({ error: message });
		}
	},

	addPropertyToPrompt: async (promptId, propertyId) => {
		try {
			relationsLogger.info('🔗 Asociando propiedad a prompt:', { promptId, propertyId });

			// Llamar a server action para asociar propiedad a prompt
			await mockApi.addPropertyToPrompt(promptId, propertyId);

			// Recargar prompts para actualizar las relaciones
			await get().loadPrompts();

			relationsLogger.info('✅ Propiedad asociada correctamente al prompt');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al asociar propiedad al prompt';
			relationsLogger.error('❌ Error al asociar propiedad al prompt:', error);
			set({ error: message });
		}
	},

	removePropertyFromPrompt: async (promptId, propertyId) => {
		try {
			relationsLogger.info('🔓 Desasociando propiedad de prompt:', { promptId, propertyId });

			// Llamar a server action para desasociar propiedad de prompt
			await mockApi.removePropertyFromPrompt(promptId, propertyId);

			// Recargar prompts para actualizar las relaciones
			await get().loadPrompts();

			relationsLogger.info('✅ Propiedad desasociada correctamente del prompt');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al desasociar propiedad del prompt';
			relationsLogger.error('❌ Error al desasociar propiedad del prompt:', error);
			set({ error: message });
		}
	},

	addWildcardToPrompt: async (promptId, wildcardId) => {
		try {
			relationsLogger.info('🔗 Asociando comodín a prompt:', { promptId, wildcardId });

			// Llamar a server action para asociar comodín a prompt
			await mockApi.addWildcardToPrompt(promptId, wildcardId);

			// Recargar prompts para actualizar las relaciones
			await get().loadPrompts();

			relationsLogger.info('✅ Comodín asociado correctamente al prompt');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al asociar comodín al prompt';
			relationsLogger.error('❌ Error al asociar comodín al prompt:', error);
			set({ error: message });
		}
	},

	removeWildcardFromPrompt: async (promptId, wildcardId) => {
		try {
			relationsLogger.info('🔓 Desasociando comodín de prompt:', { promptId, wildcardId });

			// Llamar a server action para desasociar comodín de prompt
			await mockApi.removeWildcardFromPrompt(promptId, wildcardId);

			// Recargar prompts para actualizar las relaciones
			await get().loadPrompts();

			relationsLogger.info('✅ Comodín desasociado correctamente del prompt');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al desasociar comodín del prompt';
			relationsLogger.error('❌ Error al desasociar comodín del prompt:', error);
			set({ error: message });
		}
	},

	updatePromptRelations: async (promptId, data) => {
		try {
			relationsLogger.info('🔄 Actualizando relaciones del prompt:', { promptId, ...data });

			// Llamar a server action para actualizar relaciones
			await mockApi.updatePromptRelations(promptId, data);

			// Recargar prompts para actualizar las relaciones
			await get().loadPrompts();

			relationsLogger.info('✅ Relaciones del prompt actualizadas correctamente');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar relaciones del prompt';
			relationsLogger.error('❌ Error al actualizar relaciones del prompt:', error);
			set({ error: message });
		}
	},
});
