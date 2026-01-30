import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import { EntityType } from '@/types/entities/entities';
import type { ConceptStore } from '../types';

const relationsLogger = clientLogger.withContext('ConceptStore:Relations');

export interface RelationsSlice {
	// Acciones para gestionar relaciones entre conceptos y otras entidades
	addConceptToEntity: (conceptId: string, entityId: string, entityType: EntityType) => Promise<void>;
	removeConceptFromEntity: (conceptId: string, entityId: string, entityType: EntityType) => Promise<void>;
}

// Acciones mock para desarrollo (se reemplazarán con server actions)
const mockRelationsApi = {
	addConceptToEntity: async (_conceptId: string, _entityId: string, _entityType: EntityType): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	removeConceptFromEntity: async (_conceptId: string, _entityId: string, _entityType: EntityType): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},
};

export const createRelationsSlice: StateCreator<ConceptStore, [], [], RelationsSlice> = (set, get) => ({
	addConceptToEntity: async (conceptId, entityId, entityType) => {
		try {
			relationsLogger.info('🔗 Vinculando concepto a entidad:', {
				conceptId,
				entityId,
				entityType,
			});

			// Llamar a server action para añadir relación
			await mockRelationsApi.addConceptToEntity(conceptId, entityId, entityType);

			// Recargar conceptos para actualizar relaciones
			await get().loadConcepts();

			relationsLogger.info('✅ Concepto vinculado correctamente');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al vincular concepto';
			relationsLogger.error('❌ Error al vincular concepto a entidad:', error);
			set({ error: message });
		}
	},

	removeConceptFromEntity: async (conceptId, entityId, entityType) => {
		try {
			relationsLogger.info('✂️ Desvinculando concepto de entidad:', {
				conceptId,
				entityId,
				entityType,
			});

			// Llamar a server action para eliminar relación
			await mockRelationsApi.removeConceptFromEntity(conceptId, entityId, entityType);

			// Recargar conceptos para actualizar relaciones
			await get().loadConcepts();

			relationsLogger.info('✅ Concepto desvinculado correctamente');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al desvincular concepto';
			relationsLogger.error('❌ Error al desvincular concepto de entidad:', error);
			set({ error: message });
		}
	},
});
