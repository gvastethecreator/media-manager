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
 * @updated 2025-01-27
 */

import type { CollectionBase, CollectionWithStats } from './base';

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

// --- Esquemas de Validación (si existen) ---
// export { CollectionCreateSchema, CollectionUpdateSchema } from './schema';

// --- Tipos de compatibilidad legacy ---
export type CollectionComplete = CollectionWithStats;
export type CollectionCreateInput = Partial<CollectionBase>;
export type CollectionUpdateInput = Partial<Omit<CollectionBase, 'id' | 'createdAt' | 'updatedAt'>>;
export type CollectionSearchOptions = {
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	where?: Record<string, unknown>;
};

// --- Tipos Legacy (OBSOLETOS) ---
/**
 * @deprecated Los tipos monolíticos de `types.ts` están obsoletos.
 * Usar `CollectionWithStats` y otros tipos canónicos desde `base.ts`.
 */
// export * from './types';
