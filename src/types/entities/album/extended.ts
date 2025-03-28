/**
 * @file Tipos de datos extendidos para la entidad Album
 * @module types/entities/album/extended
 */

import type { Album } from '../albums';

/**
 * Interfaz para distribución de imágenes por carpeta
 */
export interface FolderDistribution {
	name: string;
	count: number;
}

/**
 * Interfaz para álbum con estadísticas
 */
export interface AlbumWithStats extends Album {
	/**
	 * Tamaño total en bytes de todas las imágenes del álbum
	 */
	totalSize?: number;

	/**
	 * Fecha de última actualización del álbum o sus imágenes
	 */
	lastUpdated?: Date | string;

	/**
	 * Distribución de imágenes por carpeta
	 */
	distribution?: FolderDistribution[];
}