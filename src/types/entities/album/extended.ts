/**
 * @file Tipos de datos extendidos para la entidad Album
 * @module types/entities/album/extended
 */

import type { Album } from './types';

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

	/**
	 * Contadores de items relacionados
	 * @override
	 */
	_count?: {
		images: number;
		groups: number;
		properties: number;
		wildcards: number;
		videos?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
	};
}

/**
 * Interfaz para álbum completo con todos los campos procesados (deserializados)
 * Los campos como filters y sortBy están deserializados de sus formatos JSON string
 */
export type AlbumComplete = Omit<Album, 'filters' | 'sortBy'> & {
	/**
	 * Filtros deserializados de string JSON a array/objeto
	 */
	filters: any[];

	/**
	 * Criterio de ordenación deserializado de string JSON
	 */
	sortBy: any;
}