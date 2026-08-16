/**
 * @file Selectores para el store de WorldItem
 * @module store/entities/world-item/selectors
 */

import type { WorldItemWithStats as WorldItem } from '@/types/entities/world-item/types';
import { useWorldItemStore } from './index';

/**
 * Tipos para estadísticas de WorldItem
 */
export interface WorldItemStats {
	byCategory: Record<string, number>;
	byType: Record<string, number>;
	favorites: number;
	total: number;
}

/**
 * Selector para visualizar/filtrar por rareza
 */
export const selectWorldItemsByRarity = (rarity: string) =>
	useWorldItemStore.getState().worldItems.filter((item) => item.rarity === rarity);

/**
 * Selector para visualizar/filtrar por tipo
 */
export const selectWorldItemsByType = (type: string) =>
	useWorldItemStore.getState().worldItems.filter((item) => item.type === type);

/**
 * Selector para visualizar/filtrar por categoría
 */
export const selectWorldItemsByCategory = (category: string) =>
	useWorldItemStore.getState().worldItems.filter((item) => item.category === category);

/**
 * Selector para obtener elementos favoritos
 */
export const selectFavoriteWorldItems = () => useWorldItemStore.getState().worldItems.filter((item) => item.isFavorite);

/**
 * Selector para obtener estadísticas de la colección
 * @returns Estadísticas de la colección de objetos del mundo
 */
export const selectWorldItemStats = () => {
	const { worldItems } = useWorldItemStore.getState();

	// Conteo de elementos por tipo y rareza
	const typeCount: Record<string, number> = {};
	const rarityCount: Record<string, number> = {};
	const categoryCount: Record<string, number> = {};

	for (const item of worldItems) {
		// Contar por tipo
		if (item.type) {
			typeCount[item.type] = (typeCount[item.type] || 0) + 1;
		}

		// Contar por rareza
		if (item.rarity) {
			rarityCount[item.rarity] = (rarityCount[item.rarity] || 0) + 1;
		}

		// Contar por categoría (si existe)
		if (item.category) {
			categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
		}
	}

	return {
		total: worldItems.length,
		favorites: worldItems.filter((item) => item.isFavorite).length,
		typeCount,
		rarityCount,
		categoryCount,
	};
};

/**
 * Selector para obtener un resumen de la colección
 * @returns Resumen de la colección de objetos del mundo
 */
export const selectWorldItemSummary = () => {
	const { worldItems } = useWorldItemStore.getState();

	// Calcular elementos con imágenes y notas usando _count si está disponible
	const withImages = worldItems.filter((item) => {
		// Si tiene _count, usar eso; si no, asumir 0
		const imageCount = item._count?.images || 0;
		return imageCount > 0;
	}).length;

	const withNotes = worldItems.filter((item) => {
		// Si tiene _count, usar eso; si no, asumir 0
		const noteCount = item._count?.notes || 0;
		return noteCount > 0;
	}).length;

	return {
		total: worldItems.length,
		favorites: worldItems.filter((item) => item.isFavorite).length,
		withImages,
		withNotes,
		types: [...new Set(worldItems.map((item) => item.type).filter(Boolean))].length,
		categories: [...new Set(worldItems.filter((item) => item.category).map((item) => item.category))].length,
	};
};

/**
 * Selector para obtener las opciones de ordenamiento disponibles
 * @returns Opciones de ordenamiento
 */
export const selectSortOptions = () => [
	{ value: 'name_asc', label: 'Name (A-Z)' },
	{ value: 'name_desc', label: 'Name (Z-A)' },
	{ value: 'created_asc', label: 'Created (oldest first)' },
	{ value: 'created_desc', label: 'Created (newest first)' },
	{ value: 'updated_asc', label: 'Updated (oldest first)' },
	{ value: 'updated_desc', label: 'Updated (newest first)' },
	{ value: 'type_asc', label: 'Type (A-Z)' },
	{ value: 'type_desc', label: 'Type (Z-A)' },
	{ value: 'rarity_asc', label: 'Rarity (common to legendary)' },
	{ value: 'rarity_desc', label: 'Rarity (legendary to common)' },
];

/**
 * Calcula estadísticas de los objetos del mundo
 */
export function calculateWorldItemStats(worldItems: WorldItem[]): WorldItemStats {
	const typeCount: Record<string, number> = {};
	const categoryCount: Record<string, number> = {};

	for (const item of worldItems) {
		// Contar por tipo
		if (item.type) {
			typeCount[item.type] = (typeCount[item.type] || 0) + 1;
		}

		// Contar por categoría
		if (item.category) {
			categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
		}
	}

	return {
		total: worldItems.length,
		byType: typeCount,
		byCategory: categoryCount,
		favorites: worldItems.filter((item) => item.isFavorite).length,
	};
}
