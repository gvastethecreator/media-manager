import { useCallback } from 'react';
import { useConceptStore } from '@/store/entities/concept';
import type { ConceptBase } from '@/types/entities/concept/base';
import type { EntityType } from '@/types/entities/entities';

/**
 * Hook que proporciona acciones para gestionar conceptos
 */
export function useConceptActions() {
	// Obtener acciones del store
	const {
		loadConcepts,
		createConcept,
		updateConcept,
		deleteConcept,
		selectConcept,
		reset,
		addConceptToEntity,
		removeConceptFromEntity,
	} = useConceptStore();

	// Acción para cargar conceptos (con manejo de errores)
	const handleLoadConcepts = useCallback(async () => {
		try {
			await loadConcepts();
			return true;
		} catch (error) {
			console.error('Error al cargar conceptos:', error);
			return false;
		}
	}, [loadConcepts]);

	// Acción para crear un concepto
	const handleCreateConcept = useCallback(
		async (data: Omit<ConceptBase, 'id'>) => {
			try {
				await createConcept(data);
				return true;
			} catch (error) {
				console.error('Error al crear concepto:', error);
				return false;
			}
		},
		[createConcept]
	);

	// Acción para actualizar un concepto
	const handleUpdateConcept = useCallback(
		async (id: string, data: Partial<ConceptBase>) => {
			try {
				await updateConcept(id, data);
				return true;
			} catch (error) {
				console.error('Error al actualizar concepto:', error);
				return false;
			}
		},
		[updateConcept]
	);

	// Acción para eliminar un concepto
	const handleDeleteConcept = useCallback(
		async (id: string) => {
			try {
				await deleteConcept(id);
				return true;
			} catch (error) {
				console.error('Error al eliminar concepto:', error);
				return false;
			}
		},
		[deleteConcept]
	);

	// Acción para añadir un concepto a una entidad
	const handleAddConceptToEntity = useCallback(
		async (conceptId: string, entityId: string, entityType: EntityType) => {
			try {
				await addConceptToEntity(conceptId, entityId, entityType);
				return true;
			} catch (error) {
				console.error('Error al vincular concepto a entidad:', error);
				return false;
			}
		},
		[addConceptToEntity]
	);

	// Acción para eliminar un concepto de una entidad
	const handleRemoveConceptFromEntity = useCallback(
		async (conceptId: string, entityId: string, entityType: EntityType) => {
			try {
				await removeConceptFromEntity(conceptId, entityId, entityType);
				return true;
			} catch (error) {
				console.error('Error al desvincular concepto de entidad:', error);
				return false;
			}
		},
		[removeConceptFromEntity]
	);

	return {
		loadConcepts: handleLoadConcepts,
		createConcept: handleCreateConcept,
		updateConcept: handleUpdateConcept,
		deleteConcept: handleDeleteConcept,
		selectConcept,
		reset,
		addConceptToEntity: handleAddConceptToEntity,
		removeConceptFromEntity: handleRemoveConceptFromEntity,
	};
}
