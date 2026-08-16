/**
 * 🏷️ TAG BASE TYPES
 *
 * Tipos base para tags usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
 */

/**
 * 🗿 Modelo base de Tag, derivado del schema de Drizzle.
 */
export interface TagBase {
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
}

/**
 *  COUNTS
 * 🤖 Conteos de relaciones para la entidad Tag.
 * [Automáticamente generado por el asistente el 2025-01-27]
 */
export const TAG_COUNTS_RELATIONS = [
	'images',
	'videos',
	'albums',
	'collections',
	'characters',
	'places',
	'worldItems',
	'concepts',
	'prompts',
	'notes',
	'wildcards',
	'properties',
	'groups',
] as const;

/**
 * 🤖 El tipo de un Tag con sus conteos de relaciones.
 */
export interface TagWithCounts extends TagBase {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas para un Tag.
 */
export interface TagStatistics extends EntityStats {
	completenessScore: number; // Qué tan completo está el perfil del tag (descripción, etc.)
	popularity: number; // Un score de popularidad general
	totalRelations: number; // Suma de todas las relaciones
	usageDiversity: number; // Cuán distribuido está el uso del tag entre diferentes tipos de entidades
}

/**
 * ✨ Modelo extendido de Tag con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface TagWithStats extends TagBase {
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
	entityType: 'tag';
	/** Alias para compatibilidad - apunta a stats */
	statistics?: TagStatistics;
	stats: TagStatistics;
}

/**
 * 🌟 Tipo completo de Tag con todas las relaciones
 */
export interface TagComplete extends TagWithStats {
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
		properties: string[];
		groups: string[];
	};
	tags: string[];
}

/**
 * 📝 Datos para crear un Tag
 */
export interface TagCreateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	name: string;
	shortcut?: string | null;
}

/**
 * 📝 Datos para actualizar un Tag
 */
export interface TagUpdateInput {
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	name?: string;
	shortcut?: string | null;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------
