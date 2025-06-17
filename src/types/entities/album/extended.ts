/**
 * @file Tipos de datos extendidos para la entidad Album
 * @module types/entities/album/extended
 */

import type { AlbumSortCriteria } from './enums';
import type { Album, AlbumBase, AlbumFilters } from './types';

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
	 * Tamaño total en bytes de todos los items
	 */
	totalSize: number;

	/**
	 * Última actualización del álbum o sus items
	 */
	lastUpdated: Date;

	/**
	 * Número total de items
	 */
	itemCount: number;

	/**
	 * Distribución de items por tipo
	 */
	itemDistribution: {
		images: number;
		videos: number;
	};

	/**
	 * Contadores de entidades relacionadas
	 * @override
	 */
	_count: {
		images: number;
		videos: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

/**
 * Interfaz para álbum completo con todos los campos procesados (deserializados)
 * Los campos como filters y sortBy están deserializados de sus formatos JSON string
 */
export interface AlbumComplete extends Omit<Album, 'filters' | 'sortBy'> {
	/**
	 * Filtros deserializados
	 */
	filters: AlbumFilters;

	/**
	 * Criterio de ordenación deserializado
	 */
	sortBy: AlbumSortCriteria;

	/**
	 * Indica si el álbum ha sido usado recientemente
	 */
	isRecent?: boolean;
}

/**
 * Datos parseados de un álbum
 */
export interface ParsedAlbum extends AlbumBase {
	/**
	 * Filtros parseados de JSON
	 */
	filtersObject: AlbumFilters;

	/**
	 * Criterio de ordenación parseado
	 */
	sortByObject: AlbumSortCriteria;
}

/**
 * Tipo para álbum parseado con relaciones
 */
export type ParsedAlbumWithRelations = ParsedAlbum & Album;
