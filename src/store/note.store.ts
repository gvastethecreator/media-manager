import { create } from "zustand";
import { Note } from "@prisma/client";
import { getNotes, createNote as createNoteAction, updateNote as updateNoteAction, deleteNote as deleteNoteAction, type NoteWithStats, type NoteCreate, type NoteUpdate } from "@/app/actions/note.actions";
import { logger } from "@/lib/logger";

const noteLogger = logger.withContext("NoteStore");

const mapToNoteWithStats = (note: Awaited<ReturnType<typeof getNotes>>[0]): NoteWithStats => ({
  ...note,
  totalSize: 0,
  lastUpdated: new Date(),
  recentImages: []
});

interface NoteStore {
  notes: NoteWithStats[];
  isLoading: boolean;
  error: string | null;
  loadNotes: () => Promise<void>;
  createNote: (note: NoteCreate) => Promise<void>;
  updateNote: (id: string, note: NoteUpdate) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,
  loadNotes: async () => {
    try {
      set({ isLoading: true, error: null });
      noteLogger.info("Cargando notas");
      const rawNotes = await getNotes();
      const notes = rawNotes.map(mapToNoteWithStats);
      set({ notes, isLoading: false });
      noteLogger.info("✅ Notas cargadas");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar notas";
      noteLogger.error("❌ Error al cargar notas:", error);
      set({ error: message, isLoading: false });
    }
  },
  createNote: async (note) => {
    try {
      set({ isLoading: true, error: null });
      noteLogger.info("✨ Creando nota:", note);
      await createNoteAction(note);
      const rawNotes = await getNotes();
      const notes = rawNotes.map(mapToNoteWithStats);
      set({ notes, isLoading: false });
      noteLogger.info("✅ Nota creada");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear nota";
      noteLogger.error("❌ Error al crear nota:", error);
      set({ error: message, isLoading: false });
    }
  },
  updateNote: async (id, note) => {
    try {
      set({ isLoading: true, error: null });
      noteLogger.info("💾 Actualizando nota:", note);
      await updateNoteAction(id, { ...note, id });
      const rawNotes = await getNotes();
      const notes = rawNotes.map(mapToNoteWithStats);
      set({ notes, isLoading: false });
      noteLogger.info("✅ Nota actualizada");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar nota";
      noteLogger.error("❌ Error al actualizar nota:", error);
      set({ error: message, isLoading: false });
    }
  },
  deleteNote: async (id) => {
    try {
      set({ isLoading: true, error: null });
      noteLogger.info("🗑️ Eliminando nota:", id);
      await deleteNoteAction(id);
      const rawNotes = await getNotes();
      const notes = rawNotes.map(mapToNoteWithStats);
      set({ notes, isLoading: false });
      noteLogger.info("✅ Nota eliminada");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar nota";
      noteLogger.error("❌ Error al eliminar nota:", error);
      set({ error: message, isLoading: false });
    }
  }
}));