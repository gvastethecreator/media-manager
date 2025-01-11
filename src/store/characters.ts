import { create } from "zustand";
import type { CharacterCreate, CharacterUpdate, CharacterWithStats } from "@/services/character.service";
import { logger } from "@/lib/logger";
import type { FileItem } from "@/types/file-item";
import * as CharacterActions from "@/app/actions/characters";

const charactersLogger = logger.withContext("CharactersStore");

interface CharactersState {
  characters: CharacterWithStats[];
  currentCharacter: CharacterWithStats | null;
  currentItems: FileItem[];
  isLoading: boolean;
  error: string | null;
  // Acciones
  loadCharacters: () => Promise<void>;
  createCharacter: (data: CharacterCreate) => Promise<void>;
  updateCharacter: (id: string, data: CharacterUpdate) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  addImageToCharacter: (characterId: string, imageId: string) => Promise<void>;
  removeImageFromCharacter: (characterId: string, imageId: string) => Promise<void>;
  loadCharacterContent: (id: string) => Promise<void>;
}

export const useCharactersStore = create<CharactersState>((set, get) => ({
  characters: [],
  currentCharacter: null,
  currentItems: [],
  isLoading: false,
  error: null,

  loadCharacters: async () => {
    try {
      set({ isLoading: true, error: null });
      const characters = await CharacterActions.getCharacters();
      set({ characters, isLoading: false });
      charactersLogger.info("📥 Personajes cargados:", { count: characters.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      charactersLogger.error("❌ Error al cargar personajes:", { error });
    }
  },

  createCharacter: async (data: CharacterCreate) => {
    try {
      charactersLogger.info("✨ Creando personaje...", data);
      await CharacterActions.createCharacter(data);
      await get().loadCharacters();
    } catch (error) {
      charactersLogger.error("❌ Error al crear personaje:", error);
      throw error;
    }
  },

  updateCharacter: async (id: string, data: CharacterUpdate) => {
    try {
      charactersLogger.info("📝 Actualizando personaje...", { id, data });
      await CharacterActions.updateCharacter(id, data);
      await get().loadCharacters();
    } catch (error) {
      charactersLogger.error("❌ Error al actualizar personaje:", error);
      throw error;
    }
  },

  deleteCharacter: async (id: string) => {
    try {
      charactersLogger.info("🗑️ Eliminando personaje...", id);
      await CharacterActions.deleteCharacter(id);
      await get().loadCharacters();
    } catch (error) {
      charactersLogger.error("❌ Error al eliminar personaje:", error);
      throw error;
    }
  },

  addImageToCharacter: async (characterId: string, imageId: string) => {
    try {
      charactersLogger.info("➕ Agregando imagen a personaje:", { characterId, imageId });
      await CharacterActions.addImageToCharacter(characterId, imageId);
      await get().loadCharacters();
    } catch (error) {
      charactersLogger.error("❌ Error al agregar imagen a personaje:", error);
      throw error;
    }
  },

  removeImageFromCharacter: async (characterId: string, imageId: string) => {
    try {
      charactersLogger.info("🗑️ Eliminando imagen de personaje:", { characterId, imageId });
      await CharacterActions.removeImageFromCharacter(characterId, imageId);
      await get().loadCharacters();
    } catch (error) {
      charactersLogger.error("❌ Error al eliminar imagen de personaje:", error);
      throw error;
    }
  },

  loadCharacterContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const character = await CharacterActions.getCharacter(id);
      if (!character) throw new Error("Personaje no encontrado");
      const images = await CharacterActions.getCharacterImages(id);
      set({
        currentCharacter: character,
        currentItems: images,
        isLoading: false,
      });
      charactersLogger.info("📥 Contenido del personaje cargado:", {
        characterId: id,
        imageCount: images.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      charactersLogger.error("❌ Error al cargar contenido del personaje:", { error });
    }
  },
}));