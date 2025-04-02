'use server';

/**
 * @file Exporta todas las acciones relacionadas con personajes
 * @module app/actions/characters
 */

import * as CharacterActions from './character.actions';

// Re-exportar funciones individuales
export async function getCharacters() {
  return CharacterActions.getCharacters();
}

export async function getCharacterById(id: string) {
  return CharacterActions.getCharacterById(id);
}

export async function createCharacter(data: any) {
  return CharacterActions.createCharacter(data);
}

export async function updateCharacter(id: string, data: any) {
  return CharacterActions.updateCharacter(id, data);
}

export async function deleteCharacter(id: string) {
  return CharacterActions.deleteCharacter(id);
}

export async function getCharacterImages(id: string) {
  return CharacterActions.getCharacterImages(id);
}

export async function addCharacterImage(characterId: string, imageId: string) {
  return CharacterActions.addCharacterImage(characterId, imageId);
}

export async function removeCharacterImage(characterId: string, imageId: string) {
  return CharacterActions.removeCharacterImage(characterId, imageId);
}

export async function getCharacterStats(id: string) {
  return CharacterActions.getCharacterStats(id);
}

