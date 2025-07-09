/**
 * @file Exportaciones principales de tipos para la entidad Image.
 * @module types/entities/image
 * @description
 *   Centraliza la exportación del tipo canónico **`ImageWithStats`**.
 *
 *   - `ImageBase`: Tipo base de Drizzle.
 *   - `ImageStatistics`: Interfaz para las estadísticas de conteo.
 *   - `ImageWithStats`: El tipo enriquecido que se debe usar en la app.
 *
 * @see /src/types/entities/image/base.ts
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Enumeraciones ---
export { ImageFormat, ImageStatus } from './enums';
// --- Tipos Canónicos ---
export type {
	ImageBase,
	ImageComplete,
	ImageCreateInput,
	ImageExtended,
	ImageFilters,
	ImageListItem,
	ImageSearchOptions,
	ImageSearchResult,
	ImageSortOption,
	ImageUpdateInput,
	ImageViewMode,
	ImageWithStats,
} from './types';

// --- Tipos de compatibilidad e interfaces ---
import type { ImageBase, ImageWithStats } from './base';

export type ImageComplete = ImageWithStats;
export type ImageCreateInput = Partial<ImageBase>;
export type ImageUpdateInput = Partial<Omit<ImageBase, 'id' | 'createdAt' | 'updatedAt' | 'addedAt'>>;
export type ImageSearchOptions = {
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	where?: Record<string, unknown>;
};

export {
	IMAGE_SORT_PROPERTY_MAP,
	ImageSchema,
	ImageSortCriteria,
	ImageSortOption,
	ImageViewMode,
} from './types';

// 📝 Documentación: Solo tipos canónicos. Legacy removido.
