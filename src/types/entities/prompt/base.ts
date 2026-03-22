/**
 * 🎯 PROMPT BASE TYPES
 *
 * Tipos base para prompts usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
 */

/**
 * 🗿 Modelo base de Prompt, derivado del schema de Drizzle.
 */
export interface PromptBase {
	category: string | null;
	color: string | null;
	composition: string | null;
	content: string | null;
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	featuredImage: string | null;
	id: string;
	inspiration: string | null;

	isFavorite: boolean;
	lighting: string | null;
	model?: string | null; // Modelo de IA asociado
	mood: string | null;
	name: string;
	notes: string | null;
	parameters: string | null;
	parentId: string | null;
	purpose?: string | null; // Propósito del prompt
	style: string | null;
	tags?: string[] | string; // Tags serializados
	technique: string | null;
	title?: string; // Alias para name en algunos contextos
	totalImages: number;
	totalVideos: number;
	type: string | null;
	updatedAt: Date;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas específicas de Prompt con métricas de IA
 */
export interface PromptStatistics extends EntityStats {
	averageContentLength: number;
	averageExecutionTime: number;
	completenessScore: number;
	confidenceScore: number;
	createdThisMonth: boolean;
	creativeScore: number;
	executedToday: boolean;

	// Métricas de IA y uso
	executionCount: number;

	// Análisis de calidad
	hasDescription: boolean;
	hasFeaturedImage: boolean;

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
	isWellStructured: boolean; // Tiene parámetros y tags

	// Análisis temporal
	lastExecutedAt: Date | null;
	parametersCount: number;
	popularityScore: number;
	qualityGrade: 'A' | 'B' | 'C' | 'D';
	successRate: number;
	tagsCount: number;
	technicalScore: number;
	totalAlbums: number;
	totalCharacters: number;
	totalCollections: number;
	totalConcepts: number;
	// Métricas de contenido
	totalContentItems: number;
	totalGroups: number;

	// Conteos específicos para compatibilidad con prompt-card
	totalImages: number;
	totalNotes: number;
	totalPlaces: number;
	totalProperties: number;
	totalVideos: number;
	totalWildcards: number;
	updatedThisWeek: boolean;
	usabilityScore: number;
}

/**
 * 🔢 Conteos de Drizzle para Prompt
 */
export interface PromptCounts {
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
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

/**
 * ✨ Modelo extendido de Prompt con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface PromptWithStats extends PromptBase {
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tagEntities?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
	entityType: 'prompt';
	stats: PromptStatistics;
	tags?: any; // Para compatibilidad con prompt-card.tsx
}

/**
 * 📝 Datos para crear un Prompt
 */
export interface PromptCreateInput {
	category?: string | null;
	color?: string | null;
	composition?: string | null;
	content?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	inspiration?: string | null;

	isFavorite?: boolean;
	lighting?: string | null;
	mood?: string | null;
	name: string;
	notes?: string | null;
	parameters?: string | null;
	parentId?: string | null;
	style?: string | null;
	technique?: string | null;
	type?: string | null;
}

/**
 * 📝 Datos para actualizar un Prompt
 */
export interface PromptUpdateInput {
	category?: string | null;
	color?: string | null;
	composition?: string | null;
	content?: string | null;
	description?: string | null;
	emoji?: string | null;
	featuredImage?: string | null;
	inspiration?: string | null;

	isFavorite?: boolean;
	lighting?: string | null;
	mood?: string | null;
	name?: string;
	notes?: string | null;
	parameters?: string | null;
	parentId?: string | null;
	style?: string | null;
	technique?: string | null;
	type?: string | null;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------

/**
 * @deprecated Usar PromptWithStats
 */
export type PromptComplete = PromptWithStats;
