/**
 * @file Exportaciones principales de tipos para la entidad Character
 * @module types/entities/character
 */

export * from './base';
export * from './character-types';
export * from './enums';
export * from './extended';

// Alias común para el tipo principal
export type { CharacterWithRelations as Character } from './character-types';

