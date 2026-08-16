/**
 * 🃏 WILDCARD BASE TYPES
 *
 * Tipos base para wildcards usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
 */

// ----------------------------------------------------------------

/**
 * 🃏 WILDCARD BASE TYPE
 *
 * El tipo base para un wildcard, derivado del schema de Drizzle.
 * Los wildcards son elementos flexibles que pueden representar casi cualquier cosa.
 */
export interface WildcardBase {
	author: string | null;
	category: string | null;
	children: string | null;
	color: string | null;
	content: string | null;
	createdAt: Date;
	description: string | null;
	difficulty: string | null;
	emoji: string | null;
	featuredImage: string | null;
	id: string;
	isActive: boolean;
	isFavorite: boolean;
	name: string;
	parentId: string | null;
	shortcut: string | null;
	// Relaciones
	tags?: TagBase[];
	theme: string | null;
	type: string | null;
	updatedAt: Date;
	version: number;
}

/**
 * 🃏 TAG BASE TYPE (para relaciones)
 */
export interface TagBase {
	color: string | null;
	description: string | null;
	emoji: string | null;
	id: string;
	name: string;
}

import { EntityStats } from '../entity.types';

/**
 * 🃏 WILDCARD STATISTICS
 *
 * Métricas para analizar la flexibilidad y adaptabilidad de un Wildcard.
 */
export interface WildcardStatistics extends EntityStats {
	/** Puntuación de adaptabilidad basada en la diversidad de su contenido y relaciones. */
	adaptabilityScore: number;
	/** Puntuación de la completitud de la información del wildcard. */
	completenessScore: number;

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
	/** Popularidad basada en el número de entidades relacionadas. */
	popularity: number;
	/** Nivel de uso en diferentes contextos (imágenes, personajes, etc.). */
	usageDiversity: number;
}

/**
 * 🃏 WILDCARD WITH COUNTS
 *
 * Wildcard con conteos de relaciones para optimización.
 */
export interface WildcardWithCounts extends WildcardBase {
	_count: {
		tags: number;
		images: number;
		characters: number;
		places: number;
		notes: number;
		childWildcards: number;
	};
}

/**
 * 🃏 WILDCARD WITH STATS
 *
 * El tipo principal y enriquecido para la entidad Wildcard.
 * Combina el tipo base con las estadísticas calculadas. Este es el tipo que se
 * debe usar en toda la UI y la lógica de negocio.
 */
export interface WildcardWithStats extends WildcardBase {
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		childWildcards?: number;
		properties?: number;
		groups?: number;
	};
	entityType: 'wildcard';
	/** Alias para compatibilidad - apunta a stats */
	statistics?: WildcardStatistics;
	stats: WildcardStatistics;
}

/**
 * 🌟 Tipo completo de Wildcard con todas las relaciones
 */
export interface WildcardComplete extends WildcardWithStats {
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
	tags: TagBase[];
}

/**
 * 🃏 WILDCARD CREATE INPUT
 *
 * Tipo para la creación de un nuevo wildcard.
 */
export interface WildcardCreateInput {
	category?: string | null;
	children?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	name: string;
	parentId?: string | null;
	shortcut?: string | null;
}

/**
 * 🃏 WILDCARD UPDATE INPUT
 *
 * Tipo para la actualización de un wildcard existente.
 */
export interface WildcardUpdateInput {
	category?: string | null;
	children?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	name?: string;
	parentId?: string | null;
	shortcut?: string | null;
}

/**
 * 🃏 WILDCARD PREVIEW
 *
 * Tipo para previsualizaciones de wildcards, con un subconjunto de campos.
 */
export interface WildcardPreview {
	createdAt: Date;
	description: string | null;
	id: string;
	imageUrl?: string;
	name: string;
	updatedAt: Date;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------
