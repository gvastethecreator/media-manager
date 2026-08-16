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
	abilities?: string; // JSON string
	age: string | null;
	alignment?: string;
	background: string | null;
	backstory?: string;
	beliefs?: string; // JSON string
	category: string | null;
	class?: string;
	color: string | null;
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	equipment: string | null;
	fears?: string; // JSON string
	featuredImage: string | null;
	gender: string | null;
	goals?: string; // JSON string

	isFavorite: boolean;
	// Additional properties used in the codebase but stored as JSON strings
	level?: number;
	name: string;
	notes: string | null;
	occupation: string | null;
	parentId: string | null;
	personality: string | null;
	psychologicalProfile?: string | null;
	race?: string;
	relationships: string | null;
	rpgStats?: string; // JSON string for RPG stats
	skills: string | null;
	socialProfile?: string | null;
	species: string | null;
	totalImages: number;
	totalVideos: number;
	updatedAt: Date;
}

/**
 * 🧑‍🎤 Tipo principal de Character con estadísticas pre-calculadas.
 * Optimizado para rendimiento con conteos en lugar de relaciones completas.
 */
export interface CharacterWithStats extends CharacterBase {
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
	entityType: 'character';
	images?: ImageWithStats[];
	/** Alias para compatibilidad - apunta a stats */
	statistics?: CharacterAssociationStats;
	// Estadísticas de asociaciones y uso
	stats: CharacterAssociationStats;
	videos?: VideoWithStats[];
}

/**
 * 🧑‍🎤 Input para crear un nuevo personaje.
 * Las relaciones se especifican mediante arrays de IDs.
 * Campos opcionales para facilitar la creación desde formularios.
 */
export interface CharacterCreateInput {
	abilities?: string | null;
	age?: string | null;
	alignment?: string | null;
	background?: string | null;
	backstory?: string | null;
	beliefs?: string | null;
	category?: string | null;
	class?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	equipment?: string | null;
	fears?: string | null;
	featuredImage?: string | null;
	gender?: string | null;
	goals?: string | null;
	// Additional properties
	level?: number;
	name: string;
	notes?: string | null;
	occupation?: string | null;
	parentId?: string | null;
	personality?: string | null;
	psychologicalProfile?: string | null;
	race?: string | null;
	relationships?: string | null;
	rpgStats?: string | null;
	skills?: string | null;
	socialProfile?: string | null;
	species?: string | null;
	totalImages?: number;
	totalVideos?: number;
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
	alignment?: string[];
	category?: string[];
	class?: string[];
	isFavorite?: boolean;
	level?: { min?: number; max?: number };
	race?: string[];
	search?: string;
	tagIds?: string[];
}

/**
 * 🧑‍🎤 Configuración de visualización para personajes.
 */
export interface CharacterViewConfig {
	cardSize: 'small' | 'medium' | 'large';
	compactView: boolean;
	enableAnimations: boolean;
	gridColumns: number;
	groupBy: string | null;
	imageCount: number;
	showImages: boolean;
	showStats: boolean;
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	viewType: 'grid' | 'list' | 'table';
}

/**
 * 🧑‍🎤 Opciones para las consultas de búsqueda de personajes.
 */
export interface CharacterSearchOptions {
	filters?: CharacterFilters;
	// Inclusión - se pueden especificar relaciones a incluir
	include?: Record<string, boolean>;
	// Ordenamiento - se pueden usar propiedades básicas
	orderBy?: Record<string, 'asc' | 'desc'>;
	skip?: number;
	take?: number;
}

/**
 * 🧑‍🎤 Estructura de una relación entre personajes.
 */
export interface CharacterRelationship {
	description?: string;
	id: string;
	strength: number;
	targetId: string;
	targetName: string;
	type: string;
}

/**
 * 🧑‍🎤 Estadísticas RPG de un personaje.
 */
export interface CharacterStats {
	charisma?: number;
	constitution?: number;
	dexterity?: number;
	intelligence?: number;
	strength?: number;
	wisdom?: number;
	[key: string]: number | undefined;
}

/**
 * 📊 Estadísticas de asociaciones y uso de un personaje.
 */
export interface CharacterAssociationStats {
	/** File creation time */
	birthtime: Date;
	// Propiedades RPG adicionales
	healthPoints?: number;
	imageCount?: number; // Alias para totalImages
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a file */
	isFile: boolean;
	lastUpdated: Date;
	manaPoints?: number;
	/** Last modification time */
	mtime: Date;
	powerLevel: number;
	rarityLevel: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

	// File system properties for browser integration
	/** File size in bytes */
	size: number;
	totalAlbums: number;
	totalAssociations: number;
	totalCollections: number;
	totalConcepts: number;
	totalGroups: number;
	totalImages: number;
	totalNotes: number;
	totalPlaces: number;
	totalPrompts: number;
	totalProperties: number;
	totalRelatedCharacters: number;
	totalRelatedTo: number;
	totalTags: number;
	totalVideos: number;
	totalWildcards: number;
	totalWorldItems: number;
	/** File type for browser compatibility */
	type: string;
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
