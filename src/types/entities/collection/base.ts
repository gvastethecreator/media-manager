/**
 * @file Tipos base para la entidad Collection.
 * @module types/entities/collection/base
 * @description Define los tipos canónicos para la entidad Collection, siguiendo el patrón `Base + Statistics + WithStats`.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

/**
 * 🗿 Modelo base de Collection, basado en el esquema de Drizzle.
 */
export type CollectionBase = {
    id: string;
    name: string;
    description: string | null;
    emoji: string | null;
    color: string | null;
    featuredImage: string | null;
    isPublic: boolean;
    isFavorite: boolean;
    totalImages: number;
    totalVideos: number;
    totalSize: number;
    lastImageAddedAt: Date | null;
    lastVideoAddedAt: Date | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * 📊 Estadísticas calculadas y derivadas para una Collection.
 * Principalmente, los conteos de las relaciones.
 */
export interface CollectionStatistics {
	imageCount: number;
	videoCount: number;
	albumCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	worldItemCount: number;
	conceptCount: number;
	promptCount: number;
	noteCount: number;
	wildcardCount: number;
	propertyCount: number;
	groupCount: number;
}

/**
 * ✨ Modelo extendido de Collection con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface CollectionWithStats extends CollectionBase {
	stats: CollectionStatistics;
}
