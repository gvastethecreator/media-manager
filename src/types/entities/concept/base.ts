/**
 * @file Tipos base para la entidad Concept.
 * @module types/entities/concept/base
 * @description Define los tipos canónicos para la entidad Concept, siguiendo el patrón `Base + Statistics + WithStats`.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

/**
 * 🗿 Modelo base de Concept, basado en el esquema de Drizzle.
 */
export interface ConceptBase {
	applications: string | null;
	category: string | null;
	color: string;
	complexity: string | null;
	content: string;
	createdAt: Date;
	description: string | null;
	emoji: string;
	examples: string | null;
	featuredImage: string | null;
	id: string;

	isFavorite: boolean;
	name: string;
	notes: string | null;
	parentId: string | null;
	relatedConcepts: string | null;
	totalImages: number;
	totalVideos: number;
	type: string | null;
	updatedAt: Date;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas y derivadas para un Concept.
 * Principalmente, los conteos de las relaciones.
 */
export interface ConceptStatistics extends EntityStats {
	// File system functions
	isDirectory: boolean;
	isFile: boolean;
	lastUpdated: Date;
}

/**
 * 📊 Alias para compatibilidad - ConceptStats apunta a ConceptStatistics
 */
export type ConceptStats = ConceptStatistics;

/**
 * 🧠 Concept completo con relaciones opcionales.
 */
export interface ConceptComplete extends ConceptBase {
	_count?: {
		images?: number;
		videos?: number;
		prompts?: number;
		notes?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		properties?: number;
		wildcards?: number;
		groups?: number;
		albums?: number;
		collections?: number;
		tags?: number;
	};
}

/**
 * ✨ Modelo extendido de Concept con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface ConceptWithStats extends ConceptBase {
	_count?: {
		images?: number;
		videos?: number;
		prompts?: number;
		notes?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		properties?: number;
		wildcards?: number;
		groups?: number;
		albums?: number;
		collections?: number;
		tags?: number;
	};
	entityType: 'concept';
	/** Alias para compatibilidad - apunta a stats */
	statistics?: ConceptStatistics;
	stats: ConceptStatistics;
}

/**
 * 🔄 Alias para compatibilidad con imports existentes.
 * ConceptExtended apunta a ConceptWithStats para mantener retrocompatibilidad.
 */
export type ConceptExtended = ConceptWithStats;
