/**
 * @file Funciones auxiliares para el manejo de álbumes
 * @module utils/album/helpers
 */

import { AlbumWithRelations as Album, AlbumMetadata } from '../../types/entities/album';
import { AlbumType } from '../../types/entities/album/enums';
import { formatImageSize } from '../image/helpers';

/**
 * Genera una URL para la miniatura de un álbum
 * @param album Objeto de álbum o ID
 * @param width Ancho opcional de la miniatura
 * @param height Alto opcional de la miniatura
 * @returns URL para la miniatura
 */
export function generateAlbumThumbnailUrl(album: Album | string, width?: number, height?: number): string {
	const albumId = typeof album === 'string' ? album : album.id;
	const url = `/api/albums/${albumId}/thumbnail`;

	// Añadir parámetros
	const params = new URLSearchParams();
	if (width) params.append('width', width.toString());
	if (height) params.append('height', height.toString());

	const queryString = params.toString();
	return queryString ? `${url}?${queryString}` : url;
}

/**
 * Formatea el tamaño de un álbum a partir de sus metadatos
 * @param metadata Metadatos del álbum
 * @returns Tamaño formateado
 */
export function formatAlbumSize(metadata?: AlbumMetadata): string {
	if (!metadata || metadata.totalSize === undefined) return 'Desconocido';
	return formatImageSize(metadata.totalSize);
}

/**
 * Obtiene un string descriptivo para el tipo de álbum
 * @param type Tipo de álbum
 * @returns Descripción en español
 */
export function getAlbumTypeDescription(type: AlbumType): string {
	switch (type) {
		case 'standard':
			return 'Álbum estándar';
		case 'event':
			return 'Evento';
		case 'collection':
			return 'Colección';
		case 'project':
			return 'Proyecto';
		case 'portfolio':
			return 'Portafolio';
		case 'theme':
			return 'Temático';
		default:
			return 'Álbum';
	}
}

/**
 * Determina si un álbum está vacío
 * @param album Álbum a verificar
 * @returns true si el álbum está vacío
 */
export function isAlbumEmpty(album: Album): boolean {
	return !album.metadata || album.metadata.itemCount === 0;
}

/**
 * Determina si un álbum tiene sub-álbumes
 * @param album Álbum a verificar
 * @returns true si tiene sub-álbumes
 * @deprecated Album no tiene jerarquía en el modelo actual
 */
export function hasSubAlbums(_album: Album): boolean {
	// TODO: Album no tiene relación parent/children en el modelo actual
	return false;
}

/**
 * Obtiene la ruta completa de un álbum (incluyendo padres)
 * @param album Álbum actual
 * @param allAlbums Todos los álbumes disponibles
 * @returns Array con la ruta jerárquica completa
 * @deprecated Album no tiene jerarquía en el modelo actual
 */
export function getAlbumPath(album: Album, _allAlbums: Record<string, Album>): Album[] {
	// TODO: Album no tiene relación parent/children en el modelo actual
	return [album];
}

/**
 * Genera un texto para la ruta de navegación (breadcrumb)
 * @param albumPath Ruta del álbum (array de álbumes padres)
 * @returns Texto formateado para la ruta
 */
export function formatAlbumBreadcrumb(albumPath: Album[]): string {
	return albumPath.map((album) => album.name).join(' / ');
}

/**
 * Obtiene todos los descendientes de un álbum
 * @param albumId ID del álbum
 * @param allAlbums Todos los álbumes disponibles
 * @returns Array con todos los álbumes descendientes
 * @deprecated Album no tiene jerarquía en el modelo actual
 */
export function getAllDescendants(_albumId: string, _allAlbums: Record<string, Album>): Album[] {
	// TODO: Album no tiene relación parent/children en el modelo actual
	return [];
}

/**
 * Calcula estadísticas generales sobre los álbumes
 * @param albums Álbumes disponibles
 * @returns Objeto con estadísticas
 */
export function calculateAlbumStats(albums: Album[]): {
	totalAlbums: number;
	totalItems: number;
	totalSize: number;
	rootAlbums: number;
	emptyAlbums: number;
} {
	let totalItems = 0;
	let totalSize = 0;
	let rootAlbums = 0;
	let emptyAlbums = 0;

	for (const album of albums) {
		// TODO: Album no tiene parentId en el modelo actual
		// Todos los albums son considerados root por ahora
		rootAlbums++;

		if (isAlbumEmpty(album)) {
			emptyAlbums++;
		}

		if (album.metadata) {
			totalItems += album.metadata.itemCount || 0;
			totalSize += album.metadata.totalSize || 0;
		}
	}

	return {
		totalAlbums: albums.length,
		totalItems,
		totalSize,
		rootAlbums,
		emptyAlbums,
	};
}
