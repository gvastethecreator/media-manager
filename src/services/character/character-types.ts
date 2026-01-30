/**
 * @file Tipos compartidos para operaciones de personajes
 * @module services/character/character-types
 */

import type { CharacterWithStats } from '@/types/entities/character';

/**
 * Resultado de obtener personajes
 */
export interface GetCharactersResult {
	characters: CharacterWithStats[];
	total: number;
}

// Re-export tipos principales
export type { CharacterWithStats };
