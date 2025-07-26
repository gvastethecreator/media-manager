/**
 * @file Exportaciones de utilidades de imágenes
 * @module lib/utils/image
 */

export * from './helpers';
export * from './validators';

import type { ImageExtended } from '@/types/entities/image/types';
import { ImageSortCriteria } from '@/types/entities/image/types';

/**
 * 🖼️ Ordena las imágenes según la opción especificada
 * @param images Array de imágenes a ordenar
 * @param sortOption Opción de ordenamiento
 * @returns Array de imágenes ordenadas
 */
export function sortImages(images: ImageExtended[], sortOption: ImageSortCriteria): ImageExtended[] {
	if (!images || images.length === 0) {
		return [];
	}

	return [...images].sort((a, b) => {
		switch (sortOption) {
			case ImageSortCriteria.NAME_ASC:
				return a.name.localeCompare(b.name);
			case ImageSortCriteria.NAME_DESC:
				return b.name.localeCompare(a.name);
			case ImageSortCriteria.DATE_ASC:
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			case ImageSortCriteria.DATE_DESC:
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			case ImageSortCriteria.SIZE_ASC:
				return a.size - b.size;
			case ImageSortCriteria.SIZE_DESC:
				return b.size - a.size;
			case ImageSortCriteria.DIMENSIONS_ASC:
				return a.width - b.width;
			case ImageSortCriteria.DIMENSIONS_DESC:
				return b.width - a.width;
			default:
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		}
	});
}

/**
 * 🖼️ Agrupa las imágenes según el criterio especificado
 * @param images Array de imágenes a agrupar
 * @param groupBy Criterio de agrupamiento
 * @returns Objeto con grupos de imágenes
 */
export function groupImages(
	images: ImageExtended[],
	groupBy: 'folder' | 'date' | 'tag' | 'size' | null
): Record<string, ImageExtended[]> {
	if (!images || images.length === 0 || !groupBy) {
		return { Todas: images || [] };
	}

	const groups: Record<string, ImageExtended[]> = {};

	for (const image of images) {
		let groupKey: string;

		switch (groupBy) {
			case 'folder':
				groupKey = image.folderId || 'Sin carpeta';
				break;
			case 'date':
				groupKey = new Date(image.createdAt).toLocaleDateString();
				break;
			case 'tag':
				groupKey = image.tags && image.tags.length > 0 ? image.tags[0].name || 'Sin etiqueta' : 'Sin etiqueta';
				break;
			case 'size': {
				const sizeMB = image.size / (1024 * 1024);
				if (sizeMB < 1) groupKey = 'Pequeña (<1MB)';
				else if (sizeMB < 5) groupKey = 'Mediana (1-5MB)';
				else if (sizeMB < 10) groupKey = 'Grande (5-10MB)';
				else groupKey = 'Muy grande (>10MB)';
				break;
			}
			default:
				groupKey = 'Todas';
		}

		if (!groups[groupKey]) {
			groups[groupKey] = [];
		}
		groups[groupKey].push(image);
	}

	// Ordenar los grupos por nombre
	const sortedGroups: Record<string, ImageExtended[]> = {};
	const sortedKeys = Object.keys(groups).sort();

	for (const key of sortedKeys) {
		sortedGroups[key] = groups[key];
	}

	return sortedGroups;
}

/**
 * 🖼️ Filtra imágenes por término de búsqueda
 * @param images Array de imágenes
 * @param searchTerm Término de búsqueda
 * @returns Array de imágenes filtradas
 */
export function filterImagesBySearch(images: ImageExtended[], searchTerm: string): ImageExtended[] {
	if (!searchTerm.trim()) {
		return images;
	}

	const term = searchTerm.toLowerCase();

	return images.filter(
		(image) =>
			image.name.toLowerCase().includes(term) ||
			image.description?.toLowerCase().includes(term) ||
			image.path.toLowerCase().includes(term)
	);
}

/**
 * 🖼️ Obtiene estadísticas de las imágenes
 * @param images Array de imágenes
 * @returns Objeto con estadísticas
 */
export function getImageStats(images: ImageExtended[]) {
	if (!images || images.length === 0) {
		return {
			total: 0,
			favorites: 0,
			totalSize: 0,
			averageSize: 0,
			largest: null,
			smallest: null,
			byFolder: {},
			resolutions: {},
		};
	}

	const stats = {
		total: images.length,
		favorites: 0,
		totalSize: 0,
		averageSize: 0,
		largest: images[0],
		smallest: images[0],
		byFolder: {} as Record<string, number>,
		resolutions: {} as Record<string, number>,
	};

	for (const image of images) {
		// Favoritos
		if (image.isFavorite) {
			stats.favorites++;
		}

		// Tamaño
		stats.totalSize += image.size;
		if (image.size > stats.largest.size) {
			stats.largest = image;
		}
		if (image.size < stats.smallest.size) {
			stats.smallest = image;
		}

		// Por carpeta
		const folder = image.folder?.name || 'Sin carpeta';
		stats.byFolder[folder] = (stats.byFolder[folder] || 0) + 1;

		// Resoluciones
		const resolution = `${image.width}x${image.height}`;
		stats.resolutions[resolution] = (stats.resolutions[resolution] || 0) + 1;
	}

	stats.averageSize = stats.totalSize / stats.total;

	return stats;
}
