import type { StateCreator } from 'zustand';
import { apiClient } from '@/lib/api/client';
import { clientLogger } from '@/lib/logger/client-logger';
import { EntityType } from '@/types/entities/entities';
import type { NoteStore } from '../types';

const relationsLogger = clientLogger.withContext('NoteStore:Relations');

export interface RelationsSlice {
	// Acciones para gestionar relaciones
	addNoteToEntity: (noteId: string, entityId: string, entityType: EntityType) => Promise<void>;
	removeNoteFromEntity: (noteId: string, entityId: string, entityType: EntityType) => Promise<void>;
}

function getNoteRelationEndpoint(noteId: string, entityId: string, entityType: EntityType): string {
	switch (entityType) {
		case EntityType.IMAGE:
			return `/notes/${noteId}/images/${entityId}`;
		case EntityType.VIDEO:
			return `/notes/${noteId}/videos/${entityId}`;
		default:
			throw new Error(
				`Las relaciones de notas sólo están soportadas para imágenes y videos. Tipo recibido: ${entityType}`
			);
	}
}

export const createRelationsSlice: StateCreator<NoteStore, [], [], RelationsSlice> = (set, get) => ({
	addNoteToEntity: async (noteId, entityId, entityType) => {
		try {
			set((_state) => ({ isLoading: true, error: null }));
			relationsLogger.info('🔄 Añadiendo nota a entidad', {
				noteId,
				entityId,
				entityType,
			});

			await apiClient.post(getNoteRelationEndpoint(noteId, entityId, entityType));

			// Recargar notas para actualizar la lista con las nuevas relaciones
			await get().loadNotes();

			relationsLogger.info('✅ Nota añadida a entidad', {
				noteId,
				entityId,
				entityType,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al añadir nota a entidad';
			relationsLogger.error('❌ Error al añadir nota a entidad:', error);
			set({ error: message, isLoading: false });
		}
	},

	removeNoteFromEntity: async (noteId, entityId, entityType) => {
		try {
			set((_state) => ({ isLoading: true, error: null }));
			relationsLogger.info('🔄 Eliminando nota de entidad', {
				noteId,
				entityId,
				entityType,
			});

			await apiClient.delete(getNoteRelationEndpoint(noteId, entityId, entityType));

			// Recargar notas para actualizar la lista
			await get().loadNotes();

			relationsLogger.info('✅ Nota eliminada de entidad', {
				noteId,
				entityId,
				entityType,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Could not delete note de entidad';
			relationsLogger.error('❌ Could not delete note de entidad:', error);
			set({ error: message, isLoading: false });
		}
	},
});
