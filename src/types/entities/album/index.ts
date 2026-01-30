/**
 * @file Exportaciones principales de tipos para la entidad Album.
 * @module types/entities/album
 * @description
 *   Centraliza la exportación del tipo canónico **`AlbumWithStats`**.
 *
 *   - `AlbumBase`: Tipo base de Drizzle.
 *   - `AlbumStatistics`: Interfaz para las estadísticas de conteo.
 *   - `AlbumWithStats`: El tipo enriquecido que se debe usar en la app.
 *
 * @see /src/types/entities/album/base.ts
 * @updated 2025-01-27
 */

import { z } from 'zod';
import type { AlbumWithStats } from './base';
import { CreateAlbumSchema, UpdateAlbumSchema } from './schema';

// --- Tipos Canónicos ---
export type { AlbumBase, AlbumStatistics, AlbumWithStats } from './base';
// Alias para compatibilidad
export type Album = AlbumWithStats;

// --- Esquemas de Validación ---
export { CreateAlbumSchema, UpdateAlbumSchema } from './schema';

// --- Tipos inferidos de esquemas ---
export type AlbumCreateInput = z.infer<typeof CreateAlbumSchema>;
export type AlbumUpdateInput = z.infer<typeof UpdateAlbumSchema>;

// --- Tipos de compatibilidad legacy ---
export type AlbumComplete = AlbumWithStats;

// --- Enumeraciones ---
export * from './enums';

// --- Tipos Legacy (OBSOLETOS) ---
/**
 * @deprecated Los tipos monolíticos y fragmentados están obsoletos.
 * Usar `AlbumWithStats` y otros tipos canónicos desde `base.ts`.
 */
// export * from './types';
// export * from './extended';
// export * from './stats-types';
