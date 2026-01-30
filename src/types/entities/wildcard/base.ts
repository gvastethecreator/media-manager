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
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;
	shortcut: string | null;
	children: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	parentId: string | null;
	type: string | null;
	content: string | null;
	difficulty: string | null;
	theme: string | null;
	isActive: boolean;
	version: number;
	author: string | null;
	createdAt: Date;
	updatedAt: Date;
	// Relaciones
	tags?: TagBase[];
}

/**
 * 🃏 TAG BASE TYPE (para relaciones)
 */
export interface TagBase {
	id: string;
	name: string;
	color: string | null;
	emoji: string | null;
	description: string | null;
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
	/** Nivel de uso en diferentes contextos (imágenes, personajes, etc.). */
	usageDiversity: number;
	/** Puntuación de la completitud de la información del wildcard. */
	completenessScore: number;
	/** Popularidad basada en el número de entidades relacionadas. */
	popularity: number;

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
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
	entityType: 'wildcard';
	stats: WildcardStatistics;
	/** Alias para compatibilidad - apunta a stats */
	statistics?: WildcardStatistics;
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
}

/**
 * 🌟 Tipo completo de Wildcard con todas las relaciones
 */
export interface WildcardComplete extends WildcardWithStats {
	tags: TagBase[];
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
}

/**
 * 🃏 WILDCARD CREATE INPUT
 *
 * Tipo para la creación de un nuevo wildcard.
 */
export interface WildcardCreateInput {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	shortcut?: string | null;
	children?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

/**
 * 🃏 WILDCARD UPDATE INPUT
 *
 * Tipo para la actualización de un wildcard existente.
 */
export interface WildcardUpdateInput {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	shortcut?: string | null;
	children?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}

/**
 * 🃏 WILDCARD PREVIEW
 *
 * Tipo para previsualizaciones de wildcards, con un subconjunto de campos.
 */
export interface WildcardPreview {
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	imageUrl?: string;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------
