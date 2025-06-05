import { useCallback } from 'react';
import { shallow } from 'zustand/shallow';

import { useNoteStore } from '@/store/entities/note';
import type { EntityType } from '@/types/entities/entities';

/**
 * Hook para gestionar relaciones entre notas y otras entidades
 * Proporciona funciones para añadir o eliminar relaciones
 */
export const useNoteRelations = () => {
	// Seleccionar solo las acciones relacionadas con relaciones
	const { addNoteToEntity, removeNoteFromEntity, isLoading, error } = useNoteStore(
		(state) => ({
			addNoteToEntity: state.addNoteToEntity,
			removeNoteFromEntity: state.removeNoteFromEntity,
			isLoading: state.isLoading,
			error: state.error,
		}),
		shallow
	);

	// Función para asociar una nota a una entidad
	const attachNoteToEntity = useCallback(
		async (noteId: string, entityId: string, entityType: EntityType) => {
			await addNoteToEntity(noteId, entityId, entityType);
			return true;
		},
		[addNoteToEntity]
	);

	// Función para desasociar una nota de una entidad
	const detachNoteFromEntity = useCallback(
		async (noteId: string, entityId: string, entityType: EntityType) => {
			await removeNoteFromEntity(noteId, entityId, entityType);
			return true;
		},
		[removeNoteFromEntity]
	);

	// Función para gestionar la relación (añadir o eliminar)
	const toggleNoteEntityRelation = useCallback(
		async (noteId: string, entityId: string, entityType: EntityType, isAttached: boolean) => {
			if (isAttached) {
				return detachNoteFromEntity(noteId, entityId, entityType);
			}
				return attachNoteToEntity(noteId, entityId, entityType);
		},
		[attachNoteToEntity, detachNoteFromEntity]
	);

	// Función para adjuntar varias notas a una entidad
	const attachNotesToEntity = useCallback(
		async (noteIds: string[], entityId: string, entityType: EntityType) => {
			const promises = noteIds.map((noteId) => addNoteToEntity(noteId, entityId, entityType));
			await Promise.all(promises);
			return true;
		},
		[addNoteToEntity]
	);

	// Función para desvincular varias notas de una entidad
	const detachNotesFromEntity = useCallback(
		async (noteIds: string[], entityId: string, entityType: EntityType) => {
			const promises = noteIds.map((noteId) => removeNoteFromEntity(noteId, entityId, entityType));
			await Promise.all(promises);
			return true;
		},
		[removeNoteFromEntity]
	);

	return {
		// Estado
		isLoading,
		error,

		// Acciones con una sola nota
		attachNoteToEntity,
		detachNoteFromEntity,
		toggleNoteEntityRelation,

		// Acciones con múltiples notas
		attachNotesToEntity,
		detachNotesFromEntity,

		// Acciones originales del store
		addNoteToEntity,
		removeNoteFromEntity,
	};
};
