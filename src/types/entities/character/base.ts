/**
 * @file Tipos base para la entidad Character derivados directamente de Prisma
 * @module types/entities/character/base
 */

import type { Character as PrismaCharacter } from '@prisma/client';

/**
 * Tipo base para Character, extendido directamente del tipo Prisma
 */
export type CharacterBase = PrismaCharacter;

/**
 * Datos mínimos requeridos para crear un personaje
 */
export interface CreateCharacterData {
  name: string;
  emoji?: string;
  color?: string;
  description?: string;
  class?: string;
  race?: string;
  alignment?: string;
  level?: number;
  presetId?: string | null;
  category?: string;
}

/**
 * Datos para actualizar un personaje
 */
export interface UpdateCharacterData {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string;
  shortcut?: string;
  level?: number;
  class?: string;
  race?: string;
  alignment?: string;
  backstory?: string;
  stats?: string;
  sortBy?: string;
  filters?: string;
  psychologicalProfile?: string;
  socialProfile?: string;
  relationships?: string;
  goals?: string;
  fears?: string;
  beliefs?: string;
  personality?: string;
  featuredImage?: string;
  isFavorite?: boolean;
  presetId?: string | null;
  category?: string;
}

/**
 * Resumen básico de un personaje para listados
 */
export interface CharacterSummary {
  id: string;
  name: string;
  emoji: string;
  color: string;
  class: string;
  race: string;
  level: number;
  imageCount: number;
  category?: string;
}

/**
 * Estadísticas básicas de un personaje
 */
export interface CharacterStats {
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  [key: string]: number | undefined;
}

/**
 * Estructura para la configuración de filtros
 */
export interface CharacterFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean | Date;
}

/**
 * Relación entre personajes
 */
export interface CharacterRelationship {
  characterId: string;
  name: string;
  type: string;
  description?: string;
  strength?: 'weak' | 'moderate' | 'strong';
}