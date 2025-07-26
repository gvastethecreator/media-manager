/**
 * @file Tipos base para la entidad Favorite.
 * @module types/entities/favorite/base
 * @description Define los tipos canónicos para Favorite usando el patrón Base + Statistics + WithStats.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

/**
 * ⭐ Enum para los tipos de entidades que pueden ser marcadas como favoritas.
 */
export enum FavoriteEntityType {
	IMAGE = 'image',
	VIDEO = 'video',
	ALBUM = 'album',
	COLLECTION = 'collection',
	FOLDER = 'folder',
	CHARACTER = 'character',
	PLACE = 'place',
	WORLD_ITEM = 'worldItem',
	CONCEPT = 'concept',
	PROMPT = 'prompt',
	NOTE = 'note',
	DOCUMENT = 'document',
	FILE = 'file',
	TAG = 'tag',
	GROUP = 'group',
}

/**
 * ⭐ Tipo base de Favorite directamente desde el schema de Drizzle.
 * Representa las propiedades fundamentales de un favorito sin estadísticas calculadas.
 */
export interface FavoriteBase {
	// Identificación
	id: string;

	// Entidad favorita
	entityId: string;
	entityType: FavoriteEntityType;

	// Usuario (opcional para compatibilidad)
	userId: string | null;
	profileId: string | null;

	// Propiedades adicionales
	addedAt: Date;
	notes: string | null;
	category: string | null;
	priority: number | null;

	// Timestamps del sistema
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Estadísticas calculadas y métricas para un favorito.
 */
export interface FavoriteStatistics {
	/** Tipo de entidad legible para humanos */
	entityTypeName: string;
	/** Fecha de creación formateada */
	formattedCreatedAt: string;
	/** Días desde que se marcó como favorito */
	daysSinceFavorited: number;
	/** Indicador si es un favorito reciente (menos de 7 días) */
	isRecent: boolean;
	/** Indicador si es un favorito antiguo (más de 30 días) */
	isOld: boolean;
}

/**
 * 📊 Alias para compatibilidad - FavoriteStats apunta a FavoriteStatistics
 */
export type FavoriteStats = FavoriteStatistics;

/**
 * ⭐ Tipo enriquecido de Favorite que incluye estadísticas calculadas.
 * Este es el tipo canónico que debe usarse en la aplicación.
 */
export interface FavoriteWithStats extends FavoriteBase {
	stats: FavoriteStatistics;
}

/**
 * 🎨 Emojis para cada tipo de entidad favorita
 */
export const FAVORITE_ENTITY_EMOJIS: Record<FavoriteEntityType, string> = {
	[FavoriteEntityType.IMAGE]: '🖼️',
	[FavoriteEntityType.VIDEO]: '🎥',
	[FavoriteEntityType.ALBUM]: '📸',
	[FavoriteEntityType.COLLECTION]: '📚',
	[FavoriteEntityType.FOLDER]: '📁',
	[FavoriteEntityType.CHARACTER]: '👤',
	[FavoriteEntityType.PLACE]: '📍',
	[FavoriteEntityType.WORLD_ITEM]: '🌍',
	[FavoriteEntityType.CONCEPT]: '💡',
	[FavoriteEntityType.PROMPT]: '🤖',
	[FavoriteEntityType.NOTE]: '📝',
	[FavoriteEntityType.DOCUMENT]: '📄',
	[FavoriteEntityType.FILE]: '📎',
	[FavoriteEntityType.TAG]: '🏷️',
	[FavoriteEntityType.GROUP]: '👥',
};

/**
 * 🎨 Colores para cada tipo de entidad favorita
 */
export const FAVORITE_ENTITY_COLORS: Record<FavoriteEntityType, string> = {
	[FavoriteEntityType.IMAGE]: '#3b82f6',
	[FavoriteEntityType.VIDEO]: '#ef4444',
	[FavoriteEntityType.ALBUM]: '#8b5cf6',
	[FavoriteEntityType.COLLECTION]: '#06b6d4',
	[FavoriteEntityType.FOLDER]: '#eab308',
	[FavoriteEntityType.CHARACTER]: '#f59e0b',
	[FavoriteEntityType.PLACE]: '#10b981',
	[FavoriteEntityType.WORLD_ITEM]: '#84cc16',
	[FavoriteEntityType.CONCEPT]: '#f97316',
	[FavoriteEntityType.PROMPT]: '#6366f1',
	[FavoriteEntityType.NOTE]: '#22c55e',
	[FavoriteEntityType.TAG]: '#ec4899',
	[FavoriteEntityType.DOCUMENT]: '#64748b',
	[FavoriteEntityType.FILE]: '#6b7280',
	[FavoriteEntityType.GROUP]: '#14b8a6',
};
