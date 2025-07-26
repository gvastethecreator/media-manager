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

// --- Tipos Canónicos ---
export type { ImageBase, ImageStatistics, ImageWithStats } from './base';
// Alias para compatibilidad
export type Image = ImageWithStats;
// --- Enumeraciones ---
export { ImageFormat, ImageStatus } from './enums';
export type {
	ImageFilters,
	ImageMetadata,
	ImageSearchResult,
} from './types';

// --- Tipos derivados ---
export type ImageComplete = ImageWithStats;
export type ImageCreateInput = Partial<Omit<ImageBase, 'id' | 'createdAt' | 'updatedAt'>>;
export type ImageUpdateInput = Partial<Omit<ImageBase, 'id' | 'createdAt' | 'updatedAt'>>;
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
