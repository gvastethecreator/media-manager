import { create } from "zustand";
import { characterService } from "@/services/character.service";
import type { CharacterCreate, CharacterUpdate } from "@/services/character.service";
import { logger } from "@/lib/logger";
import type { FileItem } from "@/types/file-item";
import { Character } from "@prisma/client";

const charactersLogger = logger.withContext("CharactersStore");

interface CharactersState {
  characters: Character[];
  currentCharacter: Character | null;
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
      const characters = await characterService.getCharacters();
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
      set({ isLoading: true, error: null });
      const character = await characterService.createCharacter(data);
      set((state) => ({
        characters: [...state.characters, character],
        isLoading: false,
      }));
      charactersLogger.info("✨ Personaje creado:", { character });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      charactersLogger.error("❌ Error al crear personaje:", { error });
    }
  },

  updateCharacter: async (id: string, data: CharacterUpdate) => {
    try {
      set({ isLoading: true, error: null });
      const updatedCharacter = await characterService.updateCharacter(id, data);
      set((state) => ({
        characters: state.characters.map((c) =>
          c.id === id ? updatedCharacter : c
        ),
        currentCharacter: state.currentCharacter?.id === id ? updatedCharacter : state.currentCharacter,
        isLoading: false,
      }));
      charactersLogger.info("📝 Personaje actualizado:", { id, data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      charactersLogger.error("❌ Error al actualizar personaje:", { id, error });
    }
  },

  deleteCharacter: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await characterService.deleteCharacter(id);
      set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
        currentCharacter: state.currentCharacter?.id === id ? null : state.currentCharacter,
        currentItems: state.currentCharacter?.id === id ? [] : state.currentItems,
        isLoading: false,
      }));
      charactersLogger.info("🗑️ Personaje eliminado:", { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      charactersLogger.error("❌ Error al eliminar personaje:", { id, error });
    }
  },

  addImageToCharacter: async (characterId: string, imageId: string) => {
    try {
      await characterService.addImageToCharacter(characterId, imageId);
      charactersLogger.info("📸 Imagen agregada a personaje:", { characterId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage });
      charactersLogger.error("❌ Error al agregar imagen a personaje:", { characterId, imageId, error });
    }
  },

  removeImageFromCharacter: async (characterId: string, imageId: string) => {
    try {
      await characterService.removeImageFromCharacter(characterId, imageId);
      set((state) => ({
        currentItems: state.currentItems.filter((item) => item.id !== imageId),
      }));
      charactersLogger.info("🗑️ Imagen eliminada de personaje:", { characterId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage });
      charactersLogger.error("❌ Error al eliminar imagen de personaje:", { characterId, imageId, error });
    }
  },

  loadCharacterContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const character = await characterService.getCharacter(id);
      if (!character) {
        throw new Error("Personaje no encontrado");
      }
      const images = await characterService.getCharacterImages(id);
      set({
        currentCharacter: character,
        currentItems: images,
        isLoading: false,
      });
      charactersLogger.info("📂 Contenido de personaje cargado:", { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      charactersLogger.error("❌ Error al cargar contenido de personaje:", { id, error });
    }
  },
}));