/**
 * @file Selectores para el store de WorldItem
 * @module store/entities/world-item/selectors
 */

import { useWorldItemStore } from './index';

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
		typeCount[item.type] = (typeCount[item.type] || 0) + 1;

		// Contar por rareza
		rarityCount[item.rarity] = (rarityCount[item.rarity] || 0) + 1;

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

	return {
		total: worldItems.length,
		favorites: worldItems.filter((item) => item.isFavorite).length,
		withImages: worldItems.filter((item) => item.imagesCount && item.imagesCount > 0).length,
		withNotes: worldItems.filter((item) => item.notesCount && item.notesCount > 0).length,
		types: [...new Set(worldItems.map((item) => item.type))].length,
		categories: [...new Set(worldItems.filter((item) => item.category).map((item) => item.category))].length,
	};
};

/**
 * Selector para obtener las opciones de ordenamiento disponibles
 * @returns Opciones de ordenamiento
 */
export const selectSortOptions = () => [
	{ value: 'name_asc', label: 'Nombre (A-Z)' },
	{ value: 'name_desc', label: 'Nombre (Z-A)' },
	{ value: 'created_asc', label: 'Fecha creación (más antigua)' },
	{ value: 'created_desc', label: 'Fecha creación (más reciente)' },
	{ value: 'updated_asc', label: 'Última actualización (más antigua)' },
	{ value: 'updated_desc', label: 'Última actualización (más reciente)' },
	{ value: 'type_asc', label: 'Tipo (A-Z)' },
	{ value: 'type_desc', label: 'Tipo (Z-A)' },
	{ value: 'rarity_asc', label: 'Rareza (común a legendario)' },
	{ value: 'rarity_desc', label: 'Rareza (legendario a común)' },
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
