/**
 * 🗿 Modelo base de Album, basado en el esquema de Drizzle.
 * Este tipo no se modifica y representa la estructura en la base de datos.
 */
export interface AlbumBase {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	featuredImage: string | null;

	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	totalSize: number;
	filters: string | null;
	shortcut: string | null;
	category: string | null;
	metadata: Record<string, any> | null;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

import type { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas y derivadas para un Album.
 * Extiende EntityStats con propiedades específicas de álbumes.
 */
export interface AlbumStatistics extends EntityStats {
	// Funciones del sistema de archivos
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a file */
	isFile: boolean;
}

/**
 * ✨ Modelo extendido de Album con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface AlbumWithStats extends AlbumBase {
	entityType: 'album';
	stats: AlbumStatistics;
	isRecent?: boolean;
	/** Tamaño total del álbum (alias para totalSize) */
	size?: number;
	/** URL de la imagen en miniatura */
	thumbnailUrl?: string;
}
