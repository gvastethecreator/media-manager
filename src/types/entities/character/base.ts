/**
 * @file Tipos base para la entidad Character
 * @module types/entities/character/base
 */
import { z } from 'zod';

/**
 * 🧑‍🎤 Tipo base para Character, solo campos canónicos y serializables
 */
export interface CharacterBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	sortBy: string;
	filters: string;
	level: number;
	class: string;
	race: string;
	type?: string | null;
	alignment: string;
	backstory: string;
	stats: string;
	psychologicalProfile: string;
	socialProfile: string;
	relationships: string;
	goals: string;
	fears: string;
	beliefs: string;
	personality: string;
	skills: string;
	abilities: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	presetId?: string | null;
}

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
	class?: string;
	race?: string;
	alignment?: string;
	level?: number;
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

// 🛡️ Esquema principal para Character (Zod)
// ⚠️ Mantener sincronía con CharacterBase y reglas de dominio
export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional().nullable(),
  shortcut: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  sortBy: z.string().optional(),
  filters: z.string().optional(),
  level: z.number().optional(),
  class: z.string().optional(),
  race: z.string().optional(),
  type: z.string().optional().nullable(),
  alignment: z.string().optional(),
  backstory: z.string().optional(),
  stats: z.string().optional(),
  psychologicalProfile: z.string().optional(),
  socialProfile: z.string().optional(),
  relationships: z.string().optional(),
  goals: z.string().optional(),
  fears: z.string().optional(),
  beliefs: z.string().optional(),
  personality: z.string().optional(),
  skills: z.string().optional(),
  abilities: z.string().optional(),
  featuredImage: z.string().optional().nullable(),
  isFavorite: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  presetId: z.string().optional().nullable(),
});

// 👥 Esquema para relaciones de personaje
export const CharacterRelationsSchema = z.object({
  characterId: z.string(),
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  strength: z.enum(['weak', 'moderate', 'strong']).optional(),
});

// 🆕 Esquema para crear personaje (omite campos de sistema)
export const CreateCharacterSchema = CharacterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 📝 Esquema para actualizar personaje (parcial)
export const UpdateCharacterSchema = CreateCharacterSchema.partial();

// 🔍 Esquema para filtros de personaje
export const CharacterFiltersSchema = z.object({
  search: z.string().optional(),
  class: z.string().optional(),
  race: z.string().optional(),
  alignment: z.string().optional(),
  isFavorite: z.boolean().optional(),
  minLevel: z.number().optional(),
  maxLevel: z.number().optional(),
});

// ⚠️ Si modificas los tipos, actualiza también los esquemas y la documentación (README.md)

/**
 * Enum de categorías de personaje
 * @see docs/entities.md
 */
export enum CharacterCategory {
  HERO = 'hero',
  VILLAIN = 'villain',
  SUPPORT = 'support',
  NPC = 'npc',
  OTHER = 'other',
}

/**
 * Enum de clases de personaje
 * @see docs/entities.md
 */
export enum CharacterClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ROGUE = 'rogue',
  CLERIC = 'cleric',
  RANGER = 'ranger',
  BARD = 'bard',
  PALADIN = 'paladin',
  OTHER = 'other',
}

/**
 * Enum de razas de personaje
 * @see docs/entities.md
 */
export enum CharacterRace {
  HUMAN = 'human',
  ELF = 'elf',
  DWARF = 'dwarf',
  ORC = 'orc',
  HALFLING = 'halfling',
  TIEFLING = 'tiefling',
  DRAGONBORN = 'dragonborn',
  OTHER = 'other',
}
