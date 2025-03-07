import {
	type CharacterCreate,
	type CharacterUpdate,
	type CharacterWithStats,
	addImageToCharacter as addImageToCharacterAction,
	createCharacter as createCharacterAction,
	deleteCharacter as deleteCharacterAction,
	getCharacters,
	updateCharacter as updateCharacterAction,
} from '@/app/actions/character.actions';
import { logger } from '@/lib/logger';
import type { Character } from '@prisma/client';
import { create } from 'zustand';

const charactersLogger = logger.withContext('CharactersStore');

interface CharactersStore {
	characters: CharacterWithStats[];
	isLoading: boolean;
	error: string | null;
	loadCharacters: () => Promise<void>;
	createCharacter: (character: CharacterCreate) => Promise<void>;
	updateCharacter: (id: string, character: CharacterUpdate) => Promise<void>;
	deleteCharacter: (id: string) => Promise<void>;
	addImageToCharacter: (characterId: string, imageId: string) => Promise<void>;
}

export const useCharactersStore = create<CharactersStore>((set) => ({
	characters: [],
	isLoading: false,
	error: null,
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
	createCharacter: async (character) => {
		try {
			set({ isLoading: true, error: null });
			charactersLogger.info('✨ Creando personaje:', character);
			await createCharacterAction(character);
			const characters = await getCharacters();
			set({ characters, isLoading: false });
			charactersLogger.info('✅ Personaje creado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear personaje';
			charactersLogger.error('❌ Error al crear personaje:', error);
			set({ error: message, isLoading: false });
		}
	},
	updateCharacter: async (id, character) => {
		try {
			set({ isLoading: true, error: null });
			charactersLogger.info('💾 Actualizando personaje:', character);
			await updateCharacterAction(id, { ...character, id });
			const characters = await getCharacters();
			set({ characters, isLoading: false });
			charactersLogger.info('✅ Personaje actualizado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar personaje';
			charactersLogger.error('❌ Error al actualizar personaje:', error);
			set({ error: message, isLoading: false });
		}
	},
	deleteCharacter: async (id) => {
		try {
			set({ isLoading: true, error: null });
			charactersLogger.info('🗑️ Eliminando personaje:', id);
			await deleteCharacterAction(id);
			const characters = await getCharacters();
			set({ characters, isLoading: false });
			charactersLogger.info('✅ Personaje eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar personaje';
			charactersLogger.error('❌ Error al eliminar personaje:', error);
			set({ error: message, isLoading: false });
		}
	},
	addImageToCharacter: async (characterId, imageId) => {
		try {
			set({ isLoading: true, error: null });
			charactersLogger.info('🖼️ Agregando imagen al personaje:', { characterId, imageId });
			await addImageToCharacterAction(characterId, imageId);
			const characters = await getCharacters();
			set({ characters, isLoading: false });
			charactersLogger.info('✅ Imagen agregada al personaje');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al agregar imagen al personaje';
			charactersLogger.error('❌ Error al agregar imagen al personaje:', error);
			set({ error: message, isLoading: false });
		}
	},
}));
