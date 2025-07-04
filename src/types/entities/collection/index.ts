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
export type { CollectionBase, CollectionStatistics, CollectionWithStats } from './base';

// --- Enumeraciones ---
export {
	COLLECTION_CATEGORY_COLORS,
	COLLECTION_CATEGORY_EMOJIS,
	CollectionCategory,
	CollectionPlatform,
	CollectionRarity,
	CollectionSortOption,
} from './enums';

// --- Tipos de compatibilidad e interfaces ---
import type { CollectionBase, CollectionWithStats } from './base';

export type CollectionComplete = CollectionWithStats;
export type CollectionCreateInput = Partial<CollectionBase>;
export type CollectionUpdateInput = Partial<Omit<CollectionBase, 'id' | 'createdAt' | 'updatedAt'>>;
export type CollectionSearchOptions = {
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	where?: Record<string, unknown>;
};
