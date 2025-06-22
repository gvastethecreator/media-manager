import type { Album } from '@prisma/client';

/**
 * 🗿 Modelo base de Album, tal como viene de Prisma.
 * Este tipo no se modifica y representa la estructura en la base de datos.
 */
export type AlbumBase = Album;

/**
 * 📊 Estadísticas calculadas y derivadas para un Album.
 * Principalmente, los conteos de las relaciones (imágenes, videos, etc.).
 */
export interface AlbumStatistics {
	imageCount: number;
	videoCount: number;
	collectionCount: number;
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
 * ✨ Modelo extendido de Album con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface AlbumWithStats extends AlbumBase {
	stats: AlbumStatistics;
}

