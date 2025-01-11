import { create } from "zustand";
import type { CharacterCreate, CharacterUpdate, CharacterWithStats } from "@/services/character.service";
import { logger } from "@/lib/logger";

const characterLogger = logger.withContext("CharactersStore");

interface CharactersState {
  characters: CharacterWithStats[];
  isLoading: boolean;
  error: Error | null;
  loadCharacters: () => Promise<void>;
  createCharacter: (data: CharacterCreate) => Promise<void>;
  updateCharacter: (id: string, data: CharacterUpdate) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
}

export const useCharactersStore = create<CharactersState>((set, get) => ({
  characters: [],
  isLoading: false,
  error: null,

  loadCharacters: async () => {
    try {
      set({ isLoading: true, error: null });
      characterLogger.info("🔄 Cargando personajes...");
      const response = await fetch("/api/characters");
      if (!response.ok) throw new Error("Error al cargar personajes");
      const characters = await response.json();
      set({ characters, isLoading: false });
      characterLogger.info("✅ Personajes cargados:", { count: characters.length });
    } catch (error) {
      characterLogger.error("❌ Error al cargar personajes:", error);
      set({ error: error as Error, isLoading: false });
    }
  },

  createCharacter: async (data: CharacterCreate) => {
    try {
      characterLogger.info("✨ Creando personaje...", data);
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Error al crear personaje");
      const character = await response.json();
      set(state => ({
        characters: [character, ...state.characters]
      }));
      characterLogger.info("✅ Personaje creado:", character);
    } catch (error) {
      characterLogger.error("❌ Error al crear personaje:", error);
      throw error;
    }
  },

  updateCharacter: async (id: string, data: CharacterUpdate) => {
    try {
      characterLogger.info("📝 Actualizando personaje...", { id, data });
      const response = await fetch(`/api/characters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Error al actualizar personaje");
      const updatedCharacter = await response.json();
      set(state => ({
        characters: state.characters.map(char =>
          char.id === id ? updatedCharacter : char
        )
      }));
      characterLogger.info("✅ Personaje actualizado:", updatedCharacter);
    } catch (error) {
      characterLogger.error("❌ Error al actualizar personaje:", error);
      throw error;
    }
  },

  deleteCharacter: async (id: string) => {
    try {
      characterLogger.info("🗑️ Eliminando personaje...", id);
      const response = await fetch(`/api/characters/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Error al eliminar personaje");
      set(state => ({
        characters: state.characters.filter(char => char.id !== id)
      }));
      characterLogger.info("✅ Personaje eliminado:", id);
    } catch (error) {
      characterLogger.error("❌ Error al eliminar personaje:", error);
      throw error;
    }
  }
}));