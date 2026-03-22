/**
 * 🌍 WORLD-ITEM BASE TYPES
 *
 * Tipos base para world-items usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
 */

/**
 * 🗿 Modelo base de WorldItem, derivado del schema de Drizzle.
 */
export interface WorldItemBase {
	attributes?: string | null;
	category: string | null;
	color: string | null;
	createdAt: Date;
	description: string | null;
	effects?: string | null;
	emoji: string | null;
	featuredImage: string | null;
	history: string | null;
	id: string;

	isFavorite: boolean;
	materials: string | null;
	name: string;
	notes: string | null;
	origin: string | null;
	parentId: string | null;
	properties: string | null;
	rarity: string | null;
	requirements?: string | null;
	shortcut?: string | null;
	totalImages: number;
	totalVideos: number;
	type: string | null;
	updatedAt: Date;
	uses: string | null;
	value: string | null;
	weight: string | null;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas específicas de WorldItem con análisis RPG
 */
export interface WorldItemStatistics extends EntityStats {
	completenessScore: number; // Qué tan completo está el item

	// Análisis temporal
	createdThisMonth: boolean;
	daysSinceCreation: number;
	daysSinceLastUpdate: number;
	hasAttributes: boolean;

	// Análisis de contenido
	hasDescription: boolean;
	hasEffects: boolean;
	hasRequirements: boolean;
	hasStats: boolean;

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
	itemTier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'artifact';
	mediaRichness: number; // Riqueza de medios (imágenes + videos)
	popularityScore: number; // Basado en relaciones y favoritos
	// Métricas RPG
	powerLevel: number; // Nivel de poder calculado
	rarityScore: number; // Puntuación de rareza (0-100)

	// Metadatos RPG
	totalAttributes: number;
	totalEffects: number;
	totalItems: number; // Total de items relacionados
	totalRequirements: number;
	totalStats: number;
	updatedThisWeek: boolean;

	// Métricas de conteo
	worldItemCount: number; // Conteo de world items relacionados
}

/**
 * 🎮 Tipo principal optimizado con estadísticas pre-calculadas
 */
export interface WorldItemWithStats extends WorldItemBase {
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
	entityType: 'world-item';
	/** Alias para compatibilidad - apunta a stats */
	statistics?: WorldItemStatistics;
	stats: WorldItemStatistics;
}

/**
 * 🌟 Tipo completo de WorldItem con todas las relaciones
 */
export interface WorldItemComplete extends WorldItemWithStats {
	relations: {
		images: string[];
		videos: string[];
		albums: string[];
		collections: string[];
		characters: string[];
		places: string[];
		concepts: string[];
		prompts: string[];
		notes: string[];
		wildcards: string[];
		properties: string[];
		groups: string[];
	};
	tags: string[];
}
