import { create } from "zustand";
import { type Note } from "@/types/entities";
import { logger } from "@/lib/logger";

const noteLogger = logger.withContext("NoteStore");

export interface NoteFormData {
  name: string;
  description?: string;
  content: string;
  type?: string;
  tags: string[];
}

interface NoteStore {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  loadItems: () => Promise<void>;
  createNote: (data: NoteFormData) => Promise<void>;
  updateNote: (id: string, data: Partial<NoteFormData>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  isLoading: false,
  error: null,

  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      noteLogger.info("🔄 Cargando notas...");
      // TODO: Implementar carga desde API
      const notes: Note[] = [];
      set({ notes, isLoading: false });
    } catch (error) {
      noteLogger.error("❌ Error al cargar notas:", error);
      set({ error: "No se pudieron cargar las notas", isLoading: false });
    }
  },

  createNote: async (data) => {
    set({ isLoading: true, error: null });
    try {
      noteLogger.info("✨ Creando nota:", data);
      // TODO: Implementar creación en API
      const note: Note = {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description || null,
        content: data.content,
        type: data.type || "default",
        tags: data.tags,
        featuredImage: null,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({
        notes: [...state.notes, note],
        isLoading: false,
      }));
    } catch (error) {
      noteLogger.error("❌ Error al crear nota:", error);
      set({ error: "No se pudo crear la nota", isLoading: false });
    }
  },

  updateNote: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      noteLogger.info("💾 Actualizando nota:", { id, data });
      // TODO: Implementar actualización en API
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id
            ? {
              ...note,
              ...data,
              updatedAt: new Date(),
            }
            : note
        ),
        isLoading: false,
      }));
    } catch (error) {
      noteLogger.error("❌ Error al actualizar nota:", error);
      set({ error: "No se pudo actualizar la nota", isLoading: false });
    }
  },

  deleteNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      noteLogger.info("🗑️ Eliminando nota:", { id });
      // TODO: Implementar eliminación en API
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      noteLogger.error("❌ Error al eliminar nota:", error);
      set({ error: "No se pudo eliminar la nota", isLoading: false });
    }
  },
}));