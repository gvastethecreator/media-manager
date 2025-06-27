/**
 * @file Utilidades para álbumes
 * @module utils/album
 */

export * from './helpers';
export * from './validators';

import { AlbumSortCriteria } from '@/types/entities/album/enums';
import type { AlbumComplete } from '@/types/entities/album/extended';

/**
 * 📚 Ordena los álbumes según la opción especificada
 * @param albums Array de álbumes a ordenar
 * @param sortOption Opción de ordenamiento
 * @returns Array de álbumes ordenados
 */
export function sortAlbums(albums: AlbumComplete[], sortOption: AlbumSortCriteria): AlbumComplete[] {
	if (!albums || albums.length === 0) {
		return [];
	}

	return [...albums].sort((a, b) => {
		switch (sortOption) {
			case AlbumSortCriteria.NAME_ASC:
				return a.name.localeCompare(b.name);
			case AlbumSortCriteria.NAME_DESC:
				return b.name.localeCompare(a.name);
			case AlbumSortCriteria.DATE_CREATED_ASC:
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			case AlbumSortCriteria.DATE_CREATED_DESC:
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			case AlbumSortCriteria.DATE_UPDATED_ASC:
				return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
			case AlbumSortCriteria.DATE_UPDATED_DESC:
				return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
			case AlbumSortCriteria.CUSTOM:
			default:
				return a.name.localeCompare(b.name);
		}
	});
}

/**
 * 📚 Agrupa los álbumes según el criterio especificado
 * @param albums Array de álbumes a agrupar
 * @param groupBy Criterio de agrupamiento
 * @returns Objeto con grupos de álbumes
 */
export function groupAlbums(
	albums: AlbumComplete[],
	groupBy: 'category' | 'type' | 'date' | 'favorite' | null
): Record<string, AlbumComplete[]> {
	if (!albums || albums.length === 0 || !groupBy) {
		return { Todos: albums || [] };
	}

	const groups: Record<string, AlbumComplete[]> = {};

	for (const album of albums) {
		let groupKey: string;

		switch (groupBy) {
			case 'category':
				groupKey = album.category || 'Sin categoría';
				break;
			case 'type':
				// Si hay filtros parseados con tipos
				groupKey = 'Estándar'; // Por defecto
				break;
			case 'date': {
				const year = new Date(album.createdAt).getFullYear();
				groupKey = year.toString();
				break;
			}
			case 'favorite':
				groupKey = album.isFavorite ? 'Favoritos' : 'Normales';
				break;
			default:
				groupKey = 'Todos';
		}

		if (!groups[groupKey]) {
			groups[groupKey] = [];
		}
		groups[groupKey].push(album);
	}

	// Ordenar los grupos por nombre
	const sortedGroups: Record<string, AlbumComplete[]> = {};
	const sortedKeys = Object.keys(groups).sort();

	for (const key of sortedKeys) {
		sortedGroups[key] = groups[key];
	}

	return sortedGroups;
}

/**
 * 📚 Filtra álbumes por término de búsqueda
 * @param albums Array de álbumes
 * @param searchTerm Término de búsqueda
 * @returns Array de álbumes filtrados
 */
export function filterAlbumsBySearch(albums: AlbumComplete[], searchTerm: string): AlbumComplete[] {
	if (!searchTerm.trim()) {
		return albums;
	}

	const term = searchTerm.toLowerCase();

	return albums.filter(
		(album) =>
			album.name.toLowerCase().includes(term) ||
			album.description?.toLowerCase().includes(term) ||
			album.category?.toLowerCase().includes(term)
	);
}

/**
 * 📚 Obtiene estadísticas de los álbumes
 * @param albums Array de álbumes
 * @returns Objeto con estadísticas
 */
export function getAlbumStats(albums: AlbumComplete[]) {
	if (!albums || albums.length === 0) {
		return {
			total: 0,
			favorites: 0,
			withImages: 0,
			withVideos: 0,
			categories: {},
			recent: 0,
		};
	}

	const stats = {
		total: albums.length,
		favorites: 0,
		withImages: 0,
		withVideos: 0,
		categories: {} as Record<string, number>,
		recent: 0,
	};

	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	for (const album of albums) {
		// Favoritos
		if (album.isFavorite) {
			stats.favorites++;
		}

		// Recientes (última semana)
		if (new Date(album.updatedAt) > oneWeekAgo) {
			stats.recent++;
		}

		// Categorías
		const category = album.category || 'Sin categoría';
		stats.categories[category] = (stats.categories[category] || 0) + 1;
	}

	return stats;
}

/**
 * 📚 Genera un color aleatorio para un álbum
 * @returns Color en formato hex
 */
export function generateAlbumColor(): string {
	const colors = [
		'#FF6B6B',
		'#4ECDC4',
		'#45B7D1',
		'#96CEB4',
		'#FFEAA7',
		'#DDA0DD',
		'#98D8C8',
		'#F7DC6F',
		'#BB8FCE',
		'#85C1E9',
	];
	return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 📚 Genera un emoji aleatorio para un álbum
 * @returns Emoji string
 */
export function generateAlbumEmoji(): string {
	const emojis = [
		'📷',
		'🖼️',
		'🎨',
		'📸',
		'🌟',
		'💎',
		'🎭',
		'🎪',
		'🎨',
		'🖌️',
		'📱',
		'💻',
		'🎬',
		'🎵',
		'📚',
		'🗂️',
		'📁',
		'🎯',
		'🚀',
		'⭐',
	];
	return emojis[Math.floor(Math.random() * emojis.length)];
}

/**
 * 📚 Valida si un nombre de álbum es válido
 * @param name Nombre a validar
 * @returns true si es válido
 */
export function isValidAlbumName(name: string): boolean {
	return name.trim().length >= 1 && name.trim().length <= 100;
}

/**
 * 📚 Genera un shortcut único para un álbum
 * @param name Nombre del álbum
 * @param existingShortcuts Shortcuts ya existentes
 * @returns Shortcut único
 */
export function generateUniqueShortcut(name: string, existingShortcuts: string[]): string {
	// Tomar las primeras letras de cada palabra
	const words = name
		.trim()
		.split(' ')
		.filter((word) => word.length > 0);
	let shortcut = words.map((word) => word[0].toUpperCase()).join('');

	// Si es muy largo, tomar solo las primeras 3 letras
	if (shortcut.length > 3) {
		shortcut = shortcut.substring(0, 3);
	}

	// Si ya existe, agregar números
	let counter = 1;
	let finalShortcut = shortcut;
	while (existingShortcuts.includes(finalShortcut)) {
		finalShortcut = `${shortcut}${counter}`;
		counter++;
	}

	return finalShortcut;
}
