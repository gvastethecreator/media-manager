/**
 * @file Exportaciones principales de tipos para la entidad Collection.
 * @module types/entities/collection
 * @description
 *   Centraliza la exportación del tipo canónico **`CollectionWithStats`**.
 *
 *   - `CollectionBase`: Tipo base de Drizzle.
 *   - `CollectionStatistics`: Interfaz para las estadísticas de conteo.
 *   - `CollectionWithStats`: El tipo enriquecido que se debe usar en la app.
 *
 * @see /src/types/entities/collection/base.ts
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Tipos Canónicos ---
export type { CollectionBase, CollectionEdition, CollectionStatistics, CollectionWithStats } from './base';
// --- Enumeraciones ---
export {
	COLLECTION_CATEGORY_COLORS,
	COLLECTION_CATEGORY_EMOJIS,
	CollectionCategory,
	CollectionPlatform,
	CollectionRarity,
	CollectionSortOption,
} from './enums';
// --- Tipos adicionales ---
export type {
	CollectionFilter,
	CollectionFilters,
	CollectionSortBy,
	CollectionViewConfig,
	CreateCollectionInput,
	UpdateCollectionInput,
} from './types';

// --- Tipos de compatibilidad e interfaces ---
import type { CollectionBase, CollectionWithStats } from './base';

export type CollectionComplete = CollectionWithStats;
export type CollectionCreateInput = Partial<CollectionBase>;
export type CollectionUpdateInput = Partial<Omit<CollectionBase, 'id' | 'createdAt' | 'updatedAt'>>;
export interface CollectionSearchOptions {
	orderBy?: Record<string, 'asc' | 'desc'>;
	skip?: number;
	take?: number;
	where?: Record<string, unknown>;
}
