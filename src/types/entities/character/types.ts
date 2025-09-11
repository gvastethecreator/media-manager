/**
 * @file Tipos canónicos para la entidad Character
 * @module types/entities/character/types
 * @description Estructura unificada y validada para Character, siguiendo las mejores prácticas.
 */

import type { EntityBase } from '../entity.types';
import type { ImageWithStats } from '../image';
import type { VideoWithStats } from '../video';
import { CharacterAlignment, CharacterCategory, CharacterClass, CharacterRace } from './enums';

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
	rpgStats?: string; // JSON string for RPG stats
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
		albums?: number;
		collections?: number;
		tags?: number;
		groups?: number;
		properties?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		relatedCharacters?: number;
		relatedTo?: number;
	};
	images?: ImageWithStats[];
	videos?: VideoWithStats[];
	// Estadísticas de asociaciones y uso
	stats: CharacterAssociationStats;
	/** Alias para compatibilidad - apunta a stats */
	statistics?: CharacterAssociationStats;
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
	rpgStats?: string | null;
}

/**
 * 🧑‍🎤 Input para actualizar un personaje existente.
 * Todos los campos son opcionales.
 */
export interface CharacterUpdateInput extends Partial<CharacterCreateInput> {}

// Aliases para compatibilidad y migración gradual
export type CreateCharacterData = CharacterCreateInput;
export type UpdateCharacterData = CharacterUpdateInput;

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
 * 🧑‍🎤 Estadísticas RPG de un personaje.
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
 * 📊 Estadísticas de asociaciones y uso de un personaje.
 */
export interface CharacterAssociationStats {
	totalImages: number;
	totalVideos: number;
	totalTags: number;
	totalGroups: number;
	totalProperties: number;
	totalCollections: number;
	totalAlbums: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalConcepts: number;
	totalPrompts: number;
	totalNotes: number;
	totalWildcards: number;
	totalRelatedCharacters: number;
	totalRelatedTo: number;
	totalAssociations: number;
	lastUpdated: Date;
	powerLevel: number;
	rarityLevel: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
	// Propiedades RPG adicionales
	healthPoints?: number;
	manaPoints?: number;
	imageCount?: number; // Alias para totalImages

	// File system properties for browser integration
	/** File size in bytes */
	size: number;
	/** Last modification time */
	mtime: Date;
	/** File creation time */
	birthtime: Date;
	/** File type for browser compatibility */
	type: string;
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a file */
	isFile: boolean;
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
	rpgStats: z.string().nullable(),
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
