import { createStoreFactory } from './store.factory';
import type { Character } from '@prisma/client';
import { logger } from '../lib/logger';
import {
  createCharacter,
  deleteCharacter,
  getCharacters,
  updateCharacter,
  type CharacterCreate,
  type CharacterUpdate
} from '../app/actions/character.actions';

// Estado extendido específico para Character
interface CharacterState {
  filters: {
    searchQuery: string;
    sortBy: 'name' | 'level' | 'class' | 'race' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
    class: string[];
    race: string[];
    alignment: string[];
    minLevel: number;
    maxLevel: number;
  };
}

export const useCharacterStore = createStoreFactory<Character, CharacterState, CharacterCreate, CharacterUpdate>(
  {
    name: 'characters',
    logger,
    actions: {
      beforeCreate: async (data) => {
        // Validar datos antes de crear
        if (!data.name?.trim()) {
          throw new Error('El nombre es requerido');
        }
        if (!data.class?.trim()) {
          throw new Error('La clase es requerida');
        }
        if (!data.race?.trim()) {
          throw new Error('La raza es requerida');
        }
        return data;
      },
      afterCreate: async (character) => {
        logger.info('Personaje creado exitosamente', { character });
      },
      beforeUpdate: async (id, data) => {
        // Validar datos antes de actualizar
        if (data.name !== undefined && !data.name.trim()) {
          throw new Error('El nombre no puede estar vacío');
        }
        return data;
      },
      afterUpdate: async (character) => {
        logger.info('Personaje actualizado exitosamente', { character });
      },
      beforeDelete: async (id) => {
        // Aquí podríamos verificar si el personaje tiene imágenes asociadas
        logger.info('Preparando eliminación de personaje', { id });
      },
      afterDelete: async (id) => {
        logger.info('Personaje eliminado exitosamente', { id });
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