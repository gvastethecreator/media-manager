import { serverLogger } from '@/lib/logger/server-logger';
import { toNoteWithStats } from '@/transformers/note';
import type { NoteBase, NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';
import type { StateCreator } from 'zustand';
import type { NoteStore } from '../types';

const coreLogger = serverLogger.withContext('NoteStore:Core');

export interface CoreSlice {
  // Estado
  notes: NoteWithStats[];
  selectedNote: NoteBase | null;
  isLoading: boolean;
  error: string | null;

  // Acciones
  loadNotes: () => Promise<void>;
  createNote: (note: NoteCreateInput) => Promise<void>;
  updateNote: (id: string, note: NoteUpdateInput) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (note: NoteBase | null) => void;
  reset: () => void;
}

// API mock para simular llamadas a server actions
// Esto sería reemplazado por llamadas reales a los server actions
const mockApi = {
  getNotes: async (): Promise<NoteWithStats[]> => {
    return new Promise(resolve => {
      setTimeout(() => resolve([]), 500);
    });
  },
  createNote: async (note: NoteCreateInput): Promise<NoteBase> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const newNote = {
          id: `note_${Date.now()}`,
          ...note,
          createdAt: new Date(),
          updatedAt: new Date()
        } as unknown as NoteBase;
        resolve(newNote);
      }, 500);
    });
  },
  updateNote: async (id: string, note: NoteUpdateInput): Promise<NoteBase> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const updatedNote = {
          id,
          ...note,
          updatedAt: new Date()
        } as unknown as NoteBase;
        resolve(updatedNote);
      }, 500);
    });
  },
  deleteNote: async (id: string): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(), 500);
    });
  }
};

export const createCoreSlice: StateCreator<
  NoteStore,
  [],
  [],
  CoreSlice
> = (set, get) => ({
  // Estado inicial
  notes: [],
  selectedNote: null,
  isLoading: false,
  error: null,

  // Acciones
  loadNotes: async () => {
    try {
      set({ isLoading: true, error: null });
      coreLogger.info('🔄 Cargando notas');

      // Llamar a server action para obtener notas
      const notes = await mockApi.getNotes();

      // Transformar resultados si es necesario
      const transformedNotes = notes.map(toNoteWithStats);

      set({ notes: transformedNotes, isLoading: false });
      coreLogger.info('✅ Notas cargadas:', { count: transformedNotes.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar notas';
      coreLogger.error('❌ Error al cargar notas:', error);
      set({ error: message, isLoading: false });
    }
  },

  createNote: async (note) => {
    try {
      set({ isLoading: true, error: null });
      coreLogger.info('✨ Creando nota:', note);

      // Llamar a server action para crear nota
      await mockApi.createNote(note);

      // Recargar notas para actualizar la lista
      await get().loadNotes();

      coreLogger.info('✅ Nota creada');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear nota';
      coreLogger.error('❌ Error al crear nota:', error);
      set({ error: message, isLoading: false });
    }
  },

  updateNote: async (id, note) => {
    try {
      set({ isLoading: true, error: null });
      coreLogger.info('🔄 Actualizando nota:', { id, ...note });

      // Llamar a server action para actualizar nota
      await mockApi.updateNote(id, note);

      // Recargar notas para actualizar la lista
      await get().loadNotes();

      coreLogger.info('✅ Nota actualizada');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar nota';
      coreLogger.error('❌ Error al actualizar nota:', error);
      set({ error: message, isLoading: false });
    }
  },

  deleteNote: async (id) => {
    try {
      set({ isLoading: true, error: null });
      coreLogger.info('🗑️ Eliminando nota:', id);

      // Llamar a server action para eliminar nota
      await mockApi.deleteNote(id);

      // Recargar notas para actualizar la lista
      await get().loadNotes();

      // Si la nota seleccionada es la que se eliminó, deseleccionarla
      if (get().selectedNote?.id === id) {
        set({ selectedNote: null });
      }

      coreLogger.info('✅ Nota eliminada');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar nota';
      coreLogger.error('❌ Error al eliminar nota:', error);
      set({ error: message, isLoading: false });
    }
  },

  selectNote: (note) => {
    set({ selectedNote: note });
  },

  reset: () => {
    set({
      notes: [],
      selectedNote: null,
      isLoading: false,
      error: null
    });
  }
});