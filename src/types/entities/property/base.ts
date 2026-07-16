/**
 * 🏠 PROPERTY BASE TYPES
 *
 * Tipos base para properties usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
 */

/**
 * 🗿 Modelo base de Property, derivado del schema de Drizzle.
 */
export interface PropertyBase {
	category: string | null;
	color: string | null;
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	featuredImage: string | null;
	id: string;
	isFavorite: boolean;
	name: string;
	shortcut: string | null;
	updatedAt: Date;
	value: string | number;
}

/**
 *  COUNTS
 * 🤖 Conteos de relaciones para la entidad Property.
 * [Automáticamente generado por el asistente el 2025-01-27]
 */
export const PROPERTY_COUNTS_RELATIONS = [
	'images',
	'videos',
	'albums',
	'collections',
	'tags',
	'characters',
	'places',
	'worldItems',
	'concepts',
	'prompts',
	'notes',
	'wildcards',
	'groups',
] as const;

/**
 * 🤖 El tipo de una Property con sus conteos de relaciones.
 */
export interface PropertyWithCounts extends PropertyBase {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		groups: number;
	};
}

import { EntityStats } from '../entity.types';

/**
 * 🏷️ PROPERTY STATISTICS
 *
 * Métricas para analizar el uso y relevancia de una Property.
 */
export interface PropertyStatistics extends EntityStats {
	/** Puntuación de la completitud de la información de la propiedad. */
	completenessScore: number;

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
	/** Popularidad basada en el número de entidades relacionadas. */
	popularity: number;
	/** Total de relaciones con otras entidades */
	totalRelations: number;
	/** Número de entidades que usan esta propiedad. */
	usageCount: number;
	/** Diversidad de valores únicos para esta propiedad. */
	valueDiversity: number;
}

/**
 * ✨ Modelo extendido de Property con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface PropertyWithStats extends PropertyBase {
	_count?: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		groups: number;
	};
	entityType: 'property';
	/** Alias para compatibilidad - apunta a stats */
	statistics?: PropertyStatistics;
	stats: PropertyStatistics;
	type?: string; // Alias para category para compatibilidad
}

/**
 * 🌟 Tipo completo de Property con todas las relaciones
 */
export interface PropertyComplete extends PropertyWithStats {
	relations: {
		images: string[];
		videos: string[];
		albums: string[];
		collections: string[];
		characters: string[];
		places: string[];
		worldItems: string[];
		concepts: string[];
		prompts: string[];
		notes: string[];
		wildcards: string[];
		groups: string[];
	};
	tags: string[];
}

/**
 * 📝 Datos para crear una Property
 */
export interface PropertyCreateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	name: string;
	shortcut?: string | null;
	value?: string | number;
}

/**
 * 📝 Datos para actualizar una Property
 */
export interface PropertyUpdateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	name?: string;
	shortcut?: string | null;
	value?: string | number;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------
