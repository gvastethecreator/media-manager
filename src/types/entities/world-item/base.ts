/**
 * @file Tipos base para la entidad WorldItem
 * @module types/entities/world-item/base
 * @description Define los tipos base de WorldItem siguiendo el patrón EntityWithStats
 */

import type { BaseEntity } from '@/types/common/base';

/**
 * 🎯 Tipo base para WorldItem derivado del schema de Prisma
 */
export interface WorldItemBase extends BaseEntity {
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	type: string;
	rarity: string;
	category: string | null;
	size: string;
	origin: string;
	attributes: string; // JSON serializado
	effects: string; // JSON serializado
	requirements: string; // JSON serializado
	stats: string; // JSON serializado
	properties: string; // JSON serializado
	sortBy: string;
	filters: string; // JSON serializado
	featuredImage: string | null;
	isFavorite: boolean;
}

/**
 * 📊 Estadísticas específicas de WorldItem con análisis RPG
 */
export interface WorldItemStatistics {
	// Conteos de relaciones
	imageCount: number;
	videoCount: number;
	albumCount: number;
	collectionCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	conceptCount: number;
	promptCount: number;
	noteCount: number;
	wildcardCount: number;
	propertyCount: number;
	groupCount: number;

	// Métricas RPG
	powerLevel: number; // Nivel de poder calculado
	rarityScore: number; // Puntuación de rareza (0-100)
	completenessScore: number; // Qué tan completo está el item
	popularityScore: number; // Basado en relaciones y favoritos

	// Análisis de contenido
	hasDescription: boolean;
	hasAttributes: boolean;
	hasEffects: boolean;
	hasRequirements: boolean;
	hasStats: boolean;
	mediaRichness: number; // Riqueza de medios (imágenes + videos)

	// Análisis temporal
	createdThisMonth: boolean;
	updatedThisWeek: boolean;
	daysSinceCreation: number;
	daysSinceLastUpdate: number;

	// Metadatos RPG
	totalAttributes: number;
	totalEffects: number;
	totalRequirements: number;
	totalStats: number;
	itemTier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'artifact';
}

/**
 * 🎮 Tipo principal optimizado con estadísticas pre-calculadas
 */
export interface WorldItemWithStats extends WorldItemBase {
	_stats: WorldItemStatistics;
}

/**
 * 📦 Conteos de Prisma
 */
export interface WorldItemCounts {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

/**
 * 🔍 Consulta optimizada de Prisma con conteos
 */
export interface PrismaWorldItemWithCounts extends WorldItemBase {
	_count: WorldItemCounts['_count'];
}