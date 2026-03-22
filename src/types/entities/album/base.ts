/**
 * 🗿 Modelo base de Album, basado en el esquema de Drizzle.
 * Este tipo no se modifica y representa la estructura en la base de datos.
 */
export interface AlbumBase {
	category: string | null;
	color: string | null;
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	featuredImage: string | null;
	filters: string | null;
	id: string;

	isFavorite: boolean;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	metadata: Record<string, any> | null;
	name: string;
	shortcut: string | null;
	totalImages: number;
	totalSize: number;
	totalVideos: number;
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
	isRecent?: boolean;
	/** Tamaño total del álbum (alias para totalSize) */
	size?: number;
	stats: AlbumStatistics;
	/** URL de la imagen en miniatura */
	thumbnailUrl?: string;
}
