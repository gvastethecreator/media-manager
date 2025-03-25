import { serverLogger } from '@/lib/logger/server-logger';
import type { EntityType } from '@/types/entities/entities';
import type { StateCreator } from 'zustand';
import type { NoteStore } from '../types';

const relationsLogger = serverLogger.withContext('NoteStore:Relations');

export interface RelationsSlice {
  // Acciones para gestionar relaciones
  addNoteToEntity: (noteId: string, entityId: string, entityType: EntityType) => Promise<void>;
  removeNoteFromEntity: (noteId: string, entityId: string, entityType: EntityType) => Promise<void>;
}

// API mock para simular llamadas a server actions
const mockRelationsApi = {
  addNoteToEntity: async (noteId: string, entityId: string, entityType: EntityType): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(), 500);
    });
  },
  removeNoteFromEntity: async (noteId: string, entityId: string, entityType: EntityType): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(), 500);
    });
  }
};

export const createRelationsSlice: StateCreator<
  NoteStore,
  [],
  [],
  RelationsSlice
> = (set, get) => ({
  addNoteToEntity: async (noteId, entityId, entityType) => {
    try {
      set(state => ({ isLoading: true, error: null }));
      relationsLogger.info('🔄 Añadiendo nota a entidad', {
        noteId,
        entityId,
        entityType
      });

      // Llamar a server action para crear relación
      await mockRelationsApi.addNoteToEntity(noteId, entityId, entityType);

      // Recargar notas para actualizar la lista con las nuevas relaciones
      await get().loadNotes();

      relationsLogger.info('✅ Nota añadida a entidad', {
        noteId,
        entityId,
        entityType
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al añadir nota a entidad';
      relationsLogger.error('❌ Error al añadir nota a entidad:', error);
      set({ error: message, isLoading: false });
    }
  },

  removeNoteFromEntity: async (noteId, entityId, entityType) => {
    try {
      set(state => ({ isLoading: true, error: null }));
      relationsLogger.info('🔄 Eliminando nota de entidad', {
        noteId,
        entityId,
        entityType
      });

      // Llamar a server action para eliminar relación
      await mockRelationsApi.removeNoteFromEntity(noteId, entityId, entityType);

      // Recargar notas para actualizar la lista
      await get().loadNotes();

      relationsLogger.info('✅ Nota eliminada de entidad', {
        noteId,
        entityId,
        entityType
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar nota de entidad';
      relationsLogger.error('❌ Error al eliminar nota de entidad:', error);
      set({ error: message, isLoading: false });
    }
  }
});