/**
 * @file Funciones para serializar y deserializar datos de álbumes
 * @module transformers/album/serializers
 */

import {
  type Album,
  type AlbumBase,
  type AlbumMetadata,
  AlbumPrivacyLevel,
  type AlbumViewConfig,
} from '../../types/entities/album/index';

/**
 * Convierte un objeto AlbumBase a Album con propiedades extendidas
 * @param album Objeto básico de álbum
 * @returns Objeto Album completo
 */
export function extendAlbum(album: AlbumBase): Album {
	return {
		...album,
		// Deserializar campos JSON
		filters: deserializeAlbumFilters(album),
		sortBy: deserializeAlbumSortBy(album),
		privacyLevel: AlbumPrivacyLevel.PRIVATE, // valor por defecto
		isExpanded: false,
		isSelected: false,
	};
}

/**
 * Convierte un array de objetos AlbumBase a array de Album con propiedades extendidas
 * @param albums Array de objetos básicos de álbum
 * @returns Array de objetos Album completos
 */
export function extendAlbums(albums: AlbumBase[]): Album[] {
	return albums.map(extendAlbum);
}

/**
 * Genera un slug a partir del nombre del álbum
 * @param name Nombre del álbum
 * @returns Slug generado
 */
export function generateAlbumSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/--+/g, '-')
		.trim();
}

/**
 * Deserializa los filtros de un álbum desde string JSON a array
 * @param album Objeto con filtros como string o array
 * @returns Array de filtros o array vacío si no hay filtros
 */
export function deserializeAlbumFilters(album: { filters?: string | any[] }): any[] {
	if (!album.filters) return [];

	if (typeof album.filters === 'string') {
		try {
			if (album.filters === 'empty_array') return [];
			return JSON.parse(album.filters) as any[];
		} catch (error) {
			console.error('Error parsing album filters', error);
			return [];
		}
	}

	return album.filters as any[];
}

/**
 * Serializa los filtros de un álbum para guardarlo en la base de datos
 * @param filters Array de filtros o undefined
 * @returns String serializado o "empty_array" si no hay filtros
 */
export function serializeAlbumFilters(filters?: any[] | string): string {
	if (!filters) return 'empty_array';

	if (typeof filters === 'string') {
		// Si ya es un string, verificar si es JSON válido
		try {
			JSON.parse(filters);
			return filters;
		} catch (error) {
			// Si no es JSON válido, asumimos que es "empty_array" o similar
			return filters === 'empty_array' ? filters : 'empty_array';
		}
	}

	try {
		return JSON.stringify(filters);
	} catch (error) {
		console.error('Error serializing album filters', error);
		return 'empty_array';
	}
}

/**
 * Deserializa el criterio de ordenación de un álbum
 * @param album Objeto con sortBy como string o cualquier otro tipo
 * @returns Valor deserializado o string por defecto "name"
 */
export function deserializeAlbumSortBy(album: { sortBy?: string | any }): any {
	if (!album.sortBy) return 'name';

	if (typeof album.sortBy === 'string') {
		// Si es un string pero parece un objeto JSON, intentar parsearlo
		if (album.sortBy.startsWith('{') || album.sortBy.startsWith('[')) {
			try {
				return JSON.parse(album.sortBy);
			} catch (error) {
				console.error('Error parsing album sortBy', error);
				return album.sortBy;
			}
		}
		// Si es un string normal, devolverlo tal cual
		return album.sortBy;
	}

	return album.sortBy;
}

/**
 * Serializa el criterio de ordenación de un álbum
 * @param sortBy Criterio de ordenación
 * @returns String serializado o valor por defecto "name"
 */
export function serializeAlbumSortBy(sortBy?: any): string {
	if (!sortBy) return 'name';

	if (typeof sortBy === 'string') {
		return sortBy;
	}

	try {
		return JSON.stringify(sortBy);
	} catch (error) {
		console.error('Error serializing album sortBy', error);
		return 'name';
	}
}

/**
 * Parsea los metadatos de un álbum si están en formato string
 * @param album Objeto de álbum con propiedad metadata
 * @returns Metadatos parseados o undefined
 */
export function parseAlbumMetadata(album: { metadata?: string | AlbumMetadata }): AlbumMetadata | undefined {
	if (!album.metadata) return undefined;

	if (typeof album.metadata === 'string') {
		try {
			return JSON.parse(album.metadata) as AlbumMetadata;
		} catch (error) {
			console.error('Error parsing album metadata', error);
			return undefined;
		}
	}

	return album.metadata as AlbumMetadata;
}

/**
 * Serializa los metadatos de un álbum para guardarlos
 * @param metadata Objeto de metadatos de álbum
 * @returns String serializado o undefined
 */
export function serializeAlbumMetadata(metadata?: AlbumMetadata): string | undefined {
	if (!metadata) return undefined;

	try {
		return JSON.stringify(metadata);
	} catch (error) {
		console.error('Error serializing album metadata', error);
		return undefined;
	}
}

/**
 * Parsea la configuración de visualización de un álbum si está en formato string
 * @param album Objeto de álbum con propiedad viewConfig
 * @returns Configuración parseada o undefined
 */
export function parseAlbumViewConfig(album: { viewConfig?: string | AlbumViewConfig }): AlbumViewConfig | undefined {
	if (!album.viewConfig) return undefined;

	if (typeof album.viewConfig === 'string') {
		try {
			return JSON.parse(album.viewConfig) as AlbumViewConfig;
		} catch (error) {
			console.error('Error parsing album view config', error);
			return undefined;
		}
	}

	return album.viewConfig as AlbumViewConfig;
}

/**
 * Serializa la configuración de visualización de un álbum para guardarla
 * @param viewConfig Objeto de configuración de visualización
 * @returns String serializado o undefined
 */
export function serializeAlbumViewConfig(viewConfig?: AlbumViewConfig): string | undefined {
	if (!viewConfig) return undefined;

	try {
		return JSON.stringify(viewConfig);
	} catch (error) {
		console.error('Error serializing album view config', error);
		return undefined;
	}
}

/**
 * Convierte un objeto AlbumBase con campos en formato de base de datos a un objeto Album con todos los campos deserializados
 * para uso en la interfaz de usuario
 * @param album Objeto básico de álbum desde la base de datos
 * @returns Objeto Album completo con campos parseados
 */
export function toExtendedAlbum(album: AlbumBase): Album {
	return {
		...album,
		filters: deserializeAlbumFilters(album),
		sortBy: deserializeAlbumSortBy(album),
		// Opcionalmente añadir parsing de otros campos serializados como JSON
		metadata: Object.prototype.hasOwnProperty.call(album, 'metadata') ? parseAlbumMetadata(album as any) : undefined,
		viewConfig: Object.prototype.hasOwnProperty.call(album, 'viewConfig') ? parseAlbumViewConfig(album as any) : undefined,
		privacyLevel: (album as any).privacyLevel || AlbumPrivacyLevel.PRIVATE,
		isExpanded: false,
		isSelected: false,
	};
}

/**
 * Convierte un objeto Album con campos deserializados a un objeto con formato adecuado para la base de datos,
 * serializando los campos necesarios
 * @param album Objeto Album completo
 * @returns Objeto con formato para la base de datos
 */
export function fromExtendedAlbum(album: Album): Record<string, any> {
	// Desestructurar para eliminar propiedades que no deben ir a la base de datos
	const {
		isExpanded, isSelected, images, videos, collections, tags, characters,
		places, worldItems, concepts, prompts, notes, wildcards, properties,
		groups, _count, ...baseProperties
	} = album;

	// Crear nuevo objeto con propiedades serializadas
	return {
		...baseProperties,
		filters: serializeAlbumFilters(album.filters as any),
		sortBy: serializeAlbumSortBy(album.sortBy),
		metadata: album.metadata ? serializeAlbumMetadata(album.metadata) : undefined,
		viewConfig: album.viewConfig ? serializeAlbumViewConfig(album.viewConfig) : undefined,
	};
}
