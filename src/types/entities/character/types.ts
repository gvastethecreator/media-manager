/**
 * @file Tipos canónicos para la entidad Character
 * @module types/entities/character/types
 * @description Estructura unificada y validada para Character, siguiendo las mejores prácticas.
 */

import type { AlbumWithStats } from '../album';
import type { CollectionWithStats } from '../collection';
import type { ConceptWithStats } from '../concept';
import type { EntityBase } from '../entity.types';
import type { GroupWithStats } from '../group';
import type { ImageWithStats } from '../image';
import type { NoteWithStats } from '../note';
import type { PlaceWithStats } from '../place';
import type { PromptWithStats } from '../prompt';
import type { PropertyWithStats } from '../property';
import type { TagWithStats } from '../tag';
import type { VideoWithStats } from '../video';
import type { WildcardWithStats } from '../wildcard';
import type { WorldItemWithStats } from '../world-item';

/**
 * 🧑‍🎤 Tipo base para un personaje.
 * Contiene todos los campos primitivos y datos serializados en JSON.
 */
export interface CharacterBase extends EntityBase {
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;

	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	age: string | null;
	gender: string | null;
	species: string | null;
	occupation: string | null;
	personality: string | null;
	background: string | null;
	relationships: string | null;
	skills: string | null;
	equipment: string | null;
	notes: string | null;
	featuredImage: string | null;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
	// Additional properties used in the codebase but stored as JSON strings
	level?: number;
	class?: string;
	race?: string;
	alignment?: string;
	backstory?: string;
	psychologicalProfile?: string | null;
	socialProfile?: string | null;
	goals?: string; // JSON string
	fears?: string; // JSON string
	beliefs?: string; // JSON string
	abilities?: string; // JSON string
	stats?: string; // JSON string
	statistics?: CharacterStats;
}

/**
 * 🧑‍🎤 Tipo principal de Character con estadísticas pre-calculadas.
 * Optimizado para rendimiento con conteos en lugar de relaciones completas.
 */
export interface CharacterWithStats extends CharacterBase {
	entityType: 'character';
	_count?: {
		images?: number;
		videos?: number;
	};
	images?: ImageWithStats[];
	videos?: VideoWithStats[];
	// Estadísticas principales
	statistics?: CharacterStats;
	// stats is inherited from CharacterBase as string (JSON)
}

/**
 * 🧑‍🎤 Input para crear un nuevo personaje.
 * Las relaciones se especifican mediante arrays de IDs.
 * Campos opcionales para facilitar la creación desde formularios.
 */
export interface CharacterCreateInput {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;

	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	age?: string | null;
	gender?: string | null;
	species?: string | null;
	occupation?: string | null;
	personality?: string | null;
	background?: string | null;
	relationships?: string | null;
	skills?: string | null;
	equipment?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
	// Additional properties
	level?: number;
	class?: string | null;
	race?: string | null;
	alignment?: string | null;
	backstory?: string | null;
	psychologicalProfile?: string | null;
	socialProfile?: string | null;
	goals?: string | null;
	fears?: string | null;
	beliefs?: string | null;
	abilities?: string | null;
	stats?: string | null;
	statistics?: CharacterStats;
}

/**
 * 🧑‍🎤 Input para actualizar un personaje existente.
 * Todos los campos son opcionales.
 */
export interface CharacterUpdateInput extends Partial<CharacterCreateInput> {}

// Aliases para compatibilidad y migración gradual
export type CreateCharacterData = CharacterCreateInput;
export type UpdateCharacterData = CharacterUpdateInput;

// Enums para tipos de personajes
export enum CharacterClass {
	WARRIOR = 'warrior',
	MAGE = 'mage',
	ROGUE = 'rogue',
	CLERIC = 'cleric',
	RANGER = 'ranger',
	PALADIN = 'paladin',
	BARBARIAN = 'barbarian',
	BARD = 'bard',
	DRUID = 'druid',
	MONK = 'monk',
	SORCERER = 'sorcerer',
	WARLOCK = 'warlock',
	WIZARD = 'wizard'
}

export enum CharacterRace {
	HUMAN = 'human',
	ELF = 'elf',
	DWARF = 'dwarf',
	HALFLING = 'halfling',
	ORC = 'orc',
	GNOME = 'gnome',
	TIEFLING = 'tiefling',
	DRAGONBORN = 'dragonborn',
	HALF_ELF = 'half-elf',
	HALF_ORC = 'half-orc'
}

export enum CharacterAlignment {
	LAWFUL_GOOD = 'lawful-good',
	NEUTRAL_GOOD = 'neutral-good',
	CHAOTIC_GOOD = 'chaotic-good',
	LAWFUL_NEUTRAL = 'lawful-neutral',
	TRUE_NEUTRAL = 'true-neutral',
	CHAOTIC_NEUTRAL = 'chaotic-neutral',
	LAWFUL_EVIL = 'lawful-evil',
	NEUTRAL_EVIL = 'neutral-evil',
	CHAOTIC_EVIL = 'chaotic-evil'
}

export enum CharacterCategory {
	PLAYER = 'player',
	NPC = 'npc',
	VILLAIN = 'villain',
	HERO = 'hero',
	COMPANION = 'companion',
	MERCHANT = 'merchant',
	GUARD = 'guard',
	NOBLE = 'noble',
	COMMONER = 'commoner'
}

/**
 * 🧑‍🎤 Filtros para buscar personajes.
 */
export interface CharacterFilters {
	search?: string;
	level?: { min?: number; max?: number };
	class?: string[];
	race?: string[];
	alignment?: string[];
	category?: string[];
	isFavorite?: boolean;
	tagIds?: string[];
}

/**
 * 🧑‍🎤 Configuración de visualización para personajes.
 */
export interface CharacterViewConfig {
	viewType: 'grid' | 'list' | 'table';
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	showImages: boolean;
	imageCount: number;
	enableAnimations: boolean;
	groupBy: string | null;
	showStats: boolean;
	compactView: boolean;
	gridColumns: number;
	cardSize: 'small' | 'medium' | 'large';
}

/**
 * 🧑‍🎤 Opciones para las consultas de búsqueda de personajes.
 */
export interface CharacterSearchOptions {
	skip?: number;
	take?: number;
	// Ordenamiento - se pueden usar propiedades básicas
	orderBy?: Record<string, 'asc' | 'desc'>;
	filters?: CharacterFilters;
	// Inclusión - se pueden especificar relaciones a incluir
	include?: Record<string, boolean>;
}

/**
 * 🧑‍🎤 Estructura de una relación entre personajes.
 */
export interface CharacterRelationship {
	id: string;
	targetId: string;
	targetName: string;
	type: string;
	strength: number;
	description?: string;
}

/**
 * 🧑‍🎤 Estadísticas de un personaje.
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
 * 🧑‍🎤 Item de filtro para el store de personajes.
 */
export interface CharacterFilterItem {
	query: string;
	value: any;
}

/**
 * ⚡ Esquema Zod para validación
 */
import { z } from 'zod';

export const CharacterSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	emoji: z.string().nullable(),
	color: z.string().nullable(),
	shortcut: z.string().nullable(),
	category: z.string().nullable(),
	level: z.number().nullable(),
	class: z.string().nullable(),
	race: z.string().nullable(),
	type: z.string().nullable(),
	alignment: z.string().nullable(),
	backstory: z.string().nullable(),
	stats: z.string().nullable(),
	psychologicalProfile: z.string().nullable(),
	socialProfile: z.string().nullable(),
	relationships: z.string().nullable(),
	goals: z.string().nullable(),
	fears: z.string().nullable(),
	beliefs: z.string().nullable(),
	personality: z.string().nullable(),
	skills: z.string().nullable(),
	abilities: z.string().nullable(),
	sortBy: z.string().nullable(),
	filters: z.string().nullable(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
