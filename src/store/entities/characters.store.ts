import {
	type CharacterCreate,
	type CharacterUpdate,
	type CharacterWithStats,
	addImageToCharacter as addImageToCharacterAction,
	createCharacter as createCharacterAction,
	deleteCharacter as deleteCharacterAction,
	getCharacters,
	updateCharacter as updateCharacterAction,
} from '@/app/actions/characters/character.actions';
import { logger } from '@/lib/logger/logger';
import type { Character } from '@prisma/client';
import { create } from 'zustand';

const charactersLogger = logger.withContext('CharactersStore');

interface CharactersStore {
	characters: CharacterWithStats[];
	isLoading: boolean;
	error: string | null;
	selectedItem: Character | null;
	loadCharacters: () => Promise<void>;
	createCharacter: (character: CharacterCreate) => Promise<Character>;
	updateCharacter: (id: string, character: CharacterUpdate) => Promise<Character>;
	deleteCharacter: (id: string) => Promise<void>;
	addImageToCharacter: (imageId: string, characterId: string) => Promise<void>;
	selectItem: (character: Character) => void;
}

export const useCharactersStore = create<CharactersStore>((set, get) => ({
	characters: [],
	isLoading: false,
	error: null,
	selectedItem: null,

	loadCharacters: async () => {
		try {
			set({ isLoading: true, error: null });
			charactersLogger.info('🔄 Cargando personajes...');
			const characters = await getCharacters();
			set({ characters, isLoading: false });
			charactersLogger.info(`✅ ${characters.length} personajes cargados`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar personajes';
			charactersLogger.error('❌ Error al cargar personajes:', error);
			set({ error: message, isLoading: false });
		}
	},

	selectItem: (character) => {
		set({ selectedItem: character });
	},

	createCharacter: async (character) => {
		try {
			set({ isLoading: true, error: null });
			charactersLogger.info('✨ Creando personaje:', character);
			const newCharacter = await createCharacterAction(character);
			await get().loadCharacters();
			charactersLogger.info('✅ Personaje creado');
			return newCharacter;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear personaje';
			charactersLogger.error('❌ Error al crear personaje:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	updateCharacter: async (id, character) => {
		try {
			set({ isLoading: true, error: null });
			charactersLogger.info('💾 Actualizando personaje:', character);
			const updatedCharacter = await updateCharacterAction(id, { ...character, id });
			await get().loadCharacters();
			charactersLogger.info('✅ Personaje actualizado');
			return updatedCharacter;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar personaje';
			charactersLogger.error('❌ Error al actualizar personaje:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	deleteCharacter: async (id) => {
		try {
			set({ isLoading: true, error: null });
			charactersLogger.info('🗑️ Eliminando personaje:', id);
			await deleteCharacterAction(id);
			await get().loadCharacters();
			charactersLogger.info('✅ Personaje eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar personaje';
			charactersLogger.error('❌ Error al eliminar personaje:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	addImageToCharacter: async (imageId, characterId) => {
		try {
			set({ isLoading: true, error: null });
			charactersLogger.info('🖼️ Agregando imagen al personaje:', { characterId, imageId });
			await addImageToCharacterAction(characterId, imageId);
			await get().loadCharacters();
			charactersLogger.info('✅ Imagen agregada al personaje');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al agregar imagen al personaje';
			charactersLogger.error('❌ Error al agregar imagen al personaje:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
}));
