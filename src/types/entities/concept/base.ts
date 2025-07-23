/**
 * @file Tipos base para la entidad Concept.
 * @module types/entities/concept/base
 * @description Define los tipos canónicos para la entidad Concept, siguiendo el patrón `Base + Statistics + WithStats`.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

/**
 * 🗿 Modelo base de Concept, basado en el esquema de Drizzle.
 */
export type ConceptBase = {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	content: string;
	category: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * 📊 Estadísticas calculadas y derivadas para un Concept.
 * Principalmente, los conteos de las relaciones.
 */
export interface ConceptStatistics {
	imageCount: number;
	videoCount: number;
	albumCount: number;
	collectionCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	worldItemCount: number;
	promptCount: number;
	noteCount: number;
	wildcardCount: number;
	propertyCount: number;
	groupCount: number;
	totalAssociations: number;
}

/**
 * 📊 Alias para compatibilidad - ConceptStats apunta a ConceptStatistics
 */
export type ConceptStats = ConceptStatistics;

/**
 * ✨ Modelo extendido de Concept con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface ConceptWithStats extends ConceptBase {
	entityType: 'concept';
	stats: ConceptStatistics;
	_count: {
		images: number;
		videos: number;
		prompts: number;
		notes: number;
		characters: number;
		places: number;
		worldItems: number;
		properties: number;
		wildcards: number;
		groups: number;
		albums: number;
		collections: number;
		tags: number;
	};
}

/**
 * 🔄 Alias para compatibilidad con imports existentes.
 * ConceptExtended apunta a ConceptWithStats para mantener retrocompatibilidad.
 */
export type ConceptExtended = ConceptWithStats;
