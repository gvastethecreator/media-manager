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
	id: string;
	name: string;
	title?: string; // Alias para name en algunos contextos
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;
	isPublic: boolean;
	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	type: string | null;
	content: string | null;
	parameters: string | null;
	style: string | null;
	mood: string | null;
	lighting: string | null;
	composition: string | null;
	technique: string | null;
	inspiration: string | null;
	notes: string | null;
	featuredImage: string | null;
	parentId: string | null;
	model?: string | null; // Modelo de IA asociado
	purpose?: string | null; // Propósito del prompt
	tags?: string[] | string; // Tags serializados
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Estadísticas específicas de Prompt con métricas de IA
 */
export interface PromptStatistics {
	// Conteos de relaciones
	totalImages: number;
	totalVideos: number;
	totalAlbums: number;
	totalCollections: number;
	totalTags: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalConcepts: number;
	totalNotes: number;
	totalWildcards: number;
	totalProperties: number;
	totalGroups: number;

	// Métricas de contenido
	totalContentItems: number;
	averageContentLength: number;
	parametersCount: number;
	tagsCount: number;

	// Métricas de IA y uso
	executionCount: number;
	successRate: number;
	averageExecutionTime: number;
	confidenceScore: number;
	popularityScore: number;

	// Análisis temporal
	lastExecutedAt: Date | null;
	createdThisMonth: boolean;
	updatedThisWeek: boolean;
	executedToday: boolean;

	// Análisis de calidad
	hasDescription: boolean;
	hasFeaturedImage: boolean;
	isWellStructured: boolean; // Tiene parámetros y tags
	qualityGrade: 'A' | 'B' | 'C' | 'D';
	completenessScore: number;
	creativityScore: number;
	technicalScore: number;
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
	entityType: 'prompt';
	stats: PromptStatistics;
	tags?: any; // Para compatibilidad con prompt-card.tsx
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
}

/**
 * 📝 Datos para crear un Prompt
 */
export interface PromptCreateInput {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	type?: string | null;
	content?: string | null;
	parameters?: string | null;
	style?: string | null;
	mood?: string | null;
	lighting?: string | null;
	composition?: string | null;
	technique?: string | null;
	inspiration?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
}

/**
 * 📝 Datos para actualizar un Prompt
 */
export interface PromptUpdateInput {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	type?: string | null;
	content?: string | null;
	parameters?: string | null;
	style?: string | null;
	mood?: string | null;
	lighting?: string | null;
	composition?: string | null;
	technique?: string | null;
	inspiration?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
}

// ----------------------------------------------------------------
// TIPOS LEGACY PARA COMPATIBILIDAD TEMPORAL
// ----------------------------------------------------------------

/**
 * @deprecated Usar PromptWithStats
 */
export type PromptComplete = PromptWithStats;
