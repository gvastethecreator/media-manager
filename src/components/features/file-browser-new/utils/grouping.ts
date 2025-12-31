/**
 * @file Utilidades de agrupación para File Browser
 * @module file-browser-new/utils/grouping
 */

import type { BrowserEntityType, BrowserItem, BrowserItemGroup } from '../types';

/**
 * Nombres de display para tipos de entidad
 */
export const ENTITY_TYPE_DISPLAY_NAMES: Record<BrowserEntityType, string> = {
	folder: 'Carpetas',
	image: 'Imágenes',
	video: 'Videos',
	audio: 'Audio',
	document: 'Documentos',
	json: 'Archivos JSON',
	file3d: 'Archivos 3D',
};

/**
 * Orden de tipos para agrupación
 */
export const ENTITY_TYPE_ORDER: BrowserEntityType[] = [
	'folder',
	'image',
	'video',
	'audio',
	'document',
	'json',
	'file3d',
];

/**
 * Agrupa items por tipo de entidad
 */
export function groupByEntityType(items: BrowserItem[]): BrowserItemGroup[] {
	const groups = new Map<BrowserEntityType, BrowserItem[]>();

	// Inicializar grupos vacíos en orden
	for (const type of ENTITY_TYPE_ORDER) {
		groups.set(type, []);
	}

	// Distribuir items en grupos
	for (const item of items) {
		const type = item.entityType as BrowserEntityType;
		const group = groups.get(type);
		if (group) {
			group.push(item);
		} else {
			// Tipo desconocido - crear grupo
			groups.set(type, [item]);
		}
	}

	// Construir resultado filtrando grupos vacíos
	const result: BrowserItemGroup[] = [];

	for (const type of ENTITY_TYPE_ORDER) {
		const groupItems = groups.get(type);
		if (groupItems && groupItems.length > 0) {
			result.push({
				key: type,
				displayName: ENTITY_TYPE_DISPLAY_NAMES[type] ?? type,
				items: groupItems,
				count: groupItems.length,
			});
		}
	}

	// Agregar grupos de tipos desconocidos al final
	for (const [type, groupItems] of groups) {
		if (!ENTITY_TYPE_ORDER.includes(type) && groupItems.length > 0) {
			result.push({
				key: type,
				displayName: type,
				items: groupItems,
				count: groupItems.length,
			});
		}
	}

	return result;
}

/**
 * Agrupa items por campo personalizado
 */
export function groupByField(items: BrowserItem[], field: string): BrowserItemGroup[] {
	const groups = new Map<string, BrowserItem[]>();

	for (const item of items) {
		const value = String((item as unknown as Record<string, unknown>)[field] ?? 'Sin valor');
		const existing = groups.get(value) ?? [];
		existing.push(item);
		groups.set(value, existing);
	}

	return Array.from(groups.entries()).map(([key, groupItems]) => ({
		key,
		displayName: key,
		items: groupItems,
		count: groupItems.length,
	}));
}

/**
 * Agrupa items por fecha (día)
 */
export function groupByDate(items: BrowserItem[], field: 'createdAt' = 'createdAt'): BrowserItemGroup[] {
	const groups = new Map<string, BrowserItem[]>();

	for (const item of items) {
		const value = item[field];
		let dateKey: string;

		if (value) {
			const date = value instanceof Date ? value : new Date(value);
			if (Number.isNaN(date.getTime())) {
				dateKey = 'Sin fecha';
			} else {
				dateKey = date.toLocaleDateString('es-ES', {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				});
			}
		} else {
			dateKey = 'Sin fecha';
		}

		const existing = groups.get(dateKey) ?? [];
		existing.push(item);
		groups.set(dateKey, existing);
	}

	// Ordenar por fecha descendente
	const entries = Array.from(groups.entries()).sort(([a], [b]) => {
		if (a === 'Sin fecha') return 1;
		if (b === 'Sin fecha') return -1;
		return new Date(b).getTime() - new Date(a).getTime();
	});

	return entries.map(([key, groupItems]) => ({
		key,
		displayName: key,
		items: groupItems,
		count: groupItems.length,
	}));
}

/**
 * Tipo de agrupación
 */
export type GroupingType = 'none' | 'entityType' | 'date' | 'custom';

/**
 * Opciones de agrupación
 */
export interface GroupingOptions {
	type: GroupingType;
	field?: string;
}

/**
 * Aplica agrupación según opciones
 */
export function applyGrouping(items: BrowserItem[], options: GroupingOptions): BrowserItemGroup[] | null {
	switch (options.type) {
		case 'entityType':
			return groupByEntityType(items);
		case 'date':
			return groupByDate(items, (options.field as 'createdAt') ?? 'createdAt');
		case 'custom':
			if (options.field) {
				return groupByField(items, options.field);
			}
			return null;
		case 'none':
		default:
			return null;
	}
}

/**
 * Lineariza grupos para navegación
 */
export function flattenGroups(groups: BrowserItemGroup[]): BrowserItem[] {
	return groups.flatMap((group) => group.items);
}
