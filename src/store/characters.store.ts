import { createStoreFactory } from './store.factory';
import type { Character } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createCharacter,
  deleteCharacter,
  getCharacters,
  updateCharacter,
  addImageToCharacter as addImageToCharacterAction,
  type CharacterCreate,
  type CharacterUpdate
} from '../app/actions/character.actions';

interface CharacterState {
  searchQuery: string;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

const baseCharacterStore = createStoreFactory<Character, CharacterState, CharacterCreate, CharacterUpdate>(
  {
    name: 'characters',
    logger,
    actions: {
      beforeCreate: async (data) => {
        // Aquí podríamos hacer validaciones o transformaciones antes de crear
        return data;
      },
      afterCreate: async (character) => {
        // Aquí podríamos hacer acciones después de crear, como notificaciones
        logger.info('Personaje creado exitosamente', { character });
      }
    }
  },
  {
    getItems: getCharacters,
    createItem: createCharacter,
    updateItem: updateCharacter,
    deleteItem: deleteCharacter
  }
);

// Exportar el hook con funcionalidad extendida
export const useCharacterStore = () => {
  const store = baseCharacterStore();
  return {
    ...store,
    addImageToCharacter: async (characterId: string, imageId: string) => {
      try {
        await addImageToCharacterAction(characterId, imageId);
        await store.loadItems();
      } catch (error) {
        logger.error('Error adding image to character:', error);
        throw error;
      }
    }
  };
};