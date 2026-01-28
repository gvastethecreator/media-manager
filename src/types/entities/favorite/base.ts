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
	WORLD_ITEM = 'world-item',
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

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas y métricas para un favorito.
 */
export interface FavoriteStatistics extends EntityStats {
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
	[FavoriteEntityType.IMAGE]: 'var(--entity-image)',
	[FavoriteEntityType.VIDEO]: 'var(--entity-video)',
	[FavoriteEntityType.ALBUM]: 'var(--entity-album)',
	[FavoriteEntityType.COLLECTION]: 'var(--entity-collection)',
	[FavoriteEntityType.FOLDER]: 'var(--entity-folder)',
	[FavoriteEntityType.CHARACTER]: 'var(--entity-character)',
	[FavoriteEntityType.PLACE]: 'var(--entity-place)',
	[FavoriteEntityType.WORLD_ITEM]: 'var(--entity-world-item)',
	[FavoriteEntityType.CONCEPT]: 'var(--entity-concept)',
	[FavoriteEntityType.PROMPT]: 'var(--entity-prompt)',
	[FavoriteEntityType.NOTE]: 'var(--entity-note)',
	[FavoriteEntityType.TAG]: 'var(--entity-tag)',
	[FavoriteEntityType.DOCUMENT]: 'var(--entity-document)',
	[FavoriteEntityType.FILE]: 'var(--entity-file)',
	[FavoriteEntityType.GROUP]: 'var(--entity-group)',
};
