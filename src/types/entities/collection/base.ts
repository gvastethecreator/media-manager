import type { Collection } from '@prisma/client';

/**
 * 🗿 Modelo base de Collection, tal como viene de Prisma.
 */
export type CollectionBase = Collection;

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
