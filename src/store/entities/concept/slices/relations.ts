import type { StateCreator } from 'zustand';
import { apiClient } from '@/lib/api/client';
import { clientLogger } from '@/lib/logger/client-logger';
import { EntityType } from '@/types/entities/entities';
import type { ConceptStore } from '../types';

const relationsLogger = clientLogger.withContext('ConceptStore:Relations');

export interface RelationsSlice {
	// Acciones para gestionar relaciones entre conceptos y otras entidades
	addConceptToEntity: (conceptId: string, entityId: string, entityType: EntityType) => Promise<void>;
	removeConceptFromEntity: (conceptId: string, entityId: string, entityType: EntityType) => Promise<void>;
}

function getConceptRelationEndpoint(conceptId: string, entityId: string, entityType: EntityType): string {
	switch (entityType) {
		case EntityType.IMAGE:
			return `/concepts/${conceptId}/images/${entityId}`;
		case EntityType.VIDEO:
			return `/concepts/${conceptId}/videos/${entityId}`;
		default:
			throw new Error(
				`Las relaciones de conceptos sólo están soportadas para imágenes y videos. Tipo recibido: ${entityType}`
			);
	}
}

export const createRelationsSlice: StateCreator<ConceptStore, [], [], RelationsSlice> = (set, get) => ({
	addConceptToEntity: async (conceptId, entityId, entityType) => {
		try {
			relationsLogger.info('🔗 Vinculando concepto a entidad:', {
				conceptId,
				entityId,
				entityType,
			});

			await apiClient.post(getConceptRelationEndpoint(conceptId, entityId, entityType));

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

			await apiClient.delete(getConceptRelationEndpoint(conceptId, entityId, entityType));

			// Recargar conceptos para actualizar relaciones
			await get().loadConcepts();

			relationsLogger.info('✅ Concepto desvinculado correctamente');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al desvincular concepto';
			relationsLogger.error('❌ Could not unlink concept from entity:', error);
			set({ error: message });
		}
	},
});
