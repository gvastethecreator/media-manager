/**
 * Utilidades para el file browser
 * Incluye filtrado, ordenamiento y agrupación
 */

import { sortSingleCriterion } from '@/transformers/file/sort';
import type { MediaItem } from '../components/media-thumbnail';

/**
 * Aplica búsqueda por nombre a una lista de items
 */
export function applySearch(items: MediaItem[], query: string): MediaItem[] {
	if (!query) return items;
	const q = query.toLowerCase();
	return items.filter((it) => (it.name || '').toLowerCase().includes(q));
}

/**
 * Aplica ordenamiento a una lista de items usando sortSingleCriterion
 */
export function applySort(
	items: MediaItem[],
	sortOptions: { field: string; direction: 'asc' | 'desc' }[]
): MediaItem[] {
	if (!sortOptions || sortOptions.length === 0) return items;
	return sortSingleCriterion(items, sortOptions[0]);
}

/**
 * Agrupa items por tipo de entidad
 * Orden: carpetas → imágenes → videos → audio → documentos → json → file3d
 */
export function groupByEntityType(items: MediaItem[]): Array<{ key: string; items: MediaItem[]; displayName: string }> {
	const map = new Map<string, MediaItem[]>();
	const displayNames = {
		folder: 'Carpetas',
		image: 'Imágenes',
		video: 'Videos',
		audio: 'Audio',
		document: 'Documentos',
		json: 'Archivos JSON',
		file3d: 'Archivos 3D',
	};

	for (const item of items) {
		const type = item.entityType;
		const arr = map.get(type) ?? [];
		arr.push(item);
		map.set(type, arr);
	}

	// Orden específico para los tipos - carpetas primero
	const typeOrder = ['folder', 'image', 'video', 'audio', 'document', 'json', 'file3d'];

	return typeOrder
		.filter((type) => map.has(type))
		.map((type) => ({
			key: type,
			items: map.get(type) ?? [],
			displayName: displayNames[type as keyof typeof displayNames] || type,
		}));
}

/**
 * Añade item sintético ".." para navegación al padre
 */
export function addParentNavigation(items: MediaItem[], parentId: string | null | undefined): MediaItem[] {
	if (!parentId) return items;

	const upItem: MediaItem = {
		id: parentId,
		name: '..',
		entityType: 'folder',
	};

	return [upItem, ...items];
}

/**
 * Filtra items sintéticos (como el item "..")
 */
export function filterSyntheticItems(items: MediaItem[]): MediaItem[] {
	return items.filter((item) => !(item.entityType === 'folder' && item.name === '..'));
}
