/**
 * @file Exportaciones principales de tipos para la entidad Album.
 * @module types/entities/album
 * @description
 *   Centraliza la exportación del tipo canónico **`AlbumWithStats`**.
 *
 *   - `AlbumBase`: Tipo base de Prisma.
 *   - `AlbumStatistics`: Interfaz para las estadísticas de conteo.
 *   - `AlbumWithStats`: El tipo enriquecido que se debe usar en la app.
 *
 * @see /src/types/entities/album/base.ts
 * @updated 2025-01-27
 */

// --- Tipos Canónicos ---
export type { AlbumBase, AlbumStatistics, AlbumWithStats } from './base';

// --- Esquemas de Validación ---
export { CreateAlbumSchema, UpdateAlbumSchema } from './schema';

// --- Tipos Legacy (OBSOLETOS) ---
/**
 * @deprecated Los tipos monolíticos y fragmentados están obsoletos.
 * Usar `AlbumWithStats` y otros tipos canónicos desde `base.ts`.
 */
// export * from './types';
// export * from './extended';
// export * from './stats-types';

// --- Enums y Constantes ---
export {
    ALBUM_SORT_PROPERTY_MAP,
    AlbumSortCriteria,
    AlbumViewMode
} from './types';

