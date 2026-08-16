/**
 * @file Exportaciones principales de tipos para la entidad Video.
 * @module types/entities/video
 * @description
 *   Este archivo centraliza las exportaciones de tipos para la entidad Video.
 *   El tipo canónico para usar en la aplicación es **`VideoWithStats`**.
 *
 *   - `VideoBase`: Tipo base desde Drizzle.
 *   - `VideoStatistics`: Estadísticas calculadas.
 *   - `VideoWithStats`: Tipo enriquecido con estadísticas (CANÓNICO).
 *
 * @see /src/types/entities/video/base.ts
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Enums (exportar directamente desde enums para evitar advertencias TS2459) ---
export { VideoSortCriteria, VideoViewMode } from './enums';
// --- Tipos Canónicos ---
export type {
	VideoBase,
	VideoComplete,
	VideoCreateInput,
	VideoFilters,
	VideoMetadata,
	VideoPaginationOptions,
	VideoPlayState,
	VideoStats,
	VideoUpdateInput,
	VideoWithStats,
} from './types';
