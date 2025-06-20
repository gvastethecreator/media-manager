/**
 * @file Exportaciones para utilidades de la entidad WorldItem
 * @module utils/world-item
 */

import type { WorldItem, WorldItemFilters, WorldItemSortCriteria } from '@/types/entities/world-item';

export * from './helpers';
// Reexportar funciones específicas para facilitar el acceso
export {
    // Helpers
    calculatePowerLevel,
    compareWorldItems,
    filterWorldItems,
    findPropertyValue,
    meetsRequirements
} from './helpers';
export * from './validators';

export {
    // Validators
    createWorldItemSchema,
    updateWorldItemSchema,
    worldItemEffectSchema,
    worldItemFiltersSchema,
    worldItemPropertySchema,
    worldItemRequirementSchema,
    worldItemStatsSchema
} from './validators';

/**
 * 🔄 Ordena una lista de WorldItems según el criterio especificado
 * @param worldItems Lista de WorldItems a ordenar
 * @param sortBy Criterio de ordenamiento
 * @returns Lista ordenada de WorldItems
 */
export function sortWorldItems(worldItems: WorldItem[], sortBy: WorldItemSortCriteria): WorldItem[] {
	const sorted = [...worldItems];

	switch (sortBy) {
		case 'name:asc':
			return sorted.sort((a, b) => a.name.localeCompare(b.name));
		case 'name:desc':
			return sorted.sort((a, b) => b.name.localeCompare(a.name));
		case 'type:asc':
			return sorted.sort((a, b) => a.type.localeCompare(b.type));
		case 'type:desc':
			return sorted.sort((a, b) => b.type.localeCompare(a.type));
		case 'rarity:asc':
			return sorted.sort((a, b) => getRarityWeight(a.rarity) - getRarityWeight(b.rarity));
		case 'rarity:desc':
			return sorted.sort((a, b) => getRarityWeight(b.rarity) - getRarityWeight(a.rarity));
		case 'created:asc':
			return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		case 'created:desc':
			return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		case 'updated:asc':
			return sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
		case 'updated:desc':
			return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
		default:
			return sorted;
	}
}

/**
 * 🏷️ Agrupa WorldItems por una propiedad específica
 * @param worldItems Lista de WorldItems
 * @param groupBy Propiedad por la cual agrupar
 * @returns Objeto con WorldItems agrupados
 */
export function groupWorldItems(
	worldItems: WorldItem[],
	groupBy: 'type' | 'category' | 'rarity'
): Record<string, WorldItem[]> {
	return worldItems.reduce((groups, item) => {
		const key = item[groupBy] || 'Sin categoría';
		if (!groups[key]) {
			groups[key] = [];
		}
		groups[key].push(item);
		return groups;
	}, {} as Record<string, WorldItem[]>);
}

/**
 * 🔍 Filtra WorldItems por texto de búsqueda
 * @param worldItems Lista de WorldItems
 * @param searchQuery Texto de búsqueda
 * @returns Lista filtrada de WorldItems
 */
export function filterWorldItemsBySearch(worldItems: WorldItem[], searchQuery: string): WorldItem[] {
	if (!searchQuery.trim()) return worldItems;

	const query = searchQuery.toLowerCase();
	return worldItems.filter((item) =>
		item.name.toLowerCase().includes(query) ||
		item.description?.toLowerCase().includes(query) ||
		item.type.toLowerCase().includes(query) ||
		item.category?.toLowerCase().includes(query) ||
		item.rarity.toLowerCase().includes(query)
	);
}

/**
 * 📊 Obtiene estadísticas de una lista de WorldItems
 * @param worldItems Lista de WorldItems
 * @returns Objeto con estadísticas
 */
export function getWorldItemStats(worldItems: WorldItem[]) {
	const total = worldItems.length;
	const byType = groupWorldItems(worldItems, 'type');
	const byCategory = groupWorldItems(worldItems, 'category');
	const byRarity = groupWorldItems(worldItems, 'rarity');
	const favorites = worldItems.filter(item => item.isFavorite).length;

	return {
		total,
		byType: Object.fromEntries(
			Object.entries(byType).map(([key, items]) => [key, items.length])
		),
		byCategory: Object.fromEntries(
			Object.entries(byCategory).map(([key, items]) => [key, items.length])
		),
		byRarity: Object.fromEntries(
			Object.entries(byRarity).map(([key, items]) => [key, items.length])
		),
		favorites,
		withImages: worldItems.filter(item => item.featuredImage).length,
	};
}

/**
 * 🎨 Genera un color basado en la rareza del WorldItem
 * @param rarity Rareza del WorldItem
 * @returns Código de color hexadecimal
 */
export function generateWorldItemColor(rarity: string): string {
	const rarityColors: Record<string, string> = {
		common: '#9CA3AF',      // Gris
		uncommon: '#10B981',    // Verde
		rare: '#3B82F6',        // Azul
		epic: '#8B5CF6',        // Púrpura
		legendary: '#F59E0B',   // Amarillo
		mythic: '#EF4444',      // Rojo
		unique: '#EC4899',      // Rosa
		artifact: '#F97316',    // Naranja
	};

	return rarityColors[rarity.toLowerCase()] || rarityColors.common;
}

/**
 * 🎭 Genera un emoji basado en el tipo del WorldItem
 * @param type Tipo del WorldItem
 * @returns Emoji representativo
 */
export function generateWorldItemEmoji(type: string): string {
	const typeEmojis: Record<string, string> = {
		weapon: '⚔️',
		armor: '🛡️',
		accessory: '💍',
		consumable: '🧪',
		material: '🪨',
		artifact: '🏺',
		relic: '🗿',
		key_item: '🗝️',
		misc: '📦',
	};

	return typeEmojis[type.toLowerCase()] || '📦';
}

/**
 * ⚖️ Obtiene el peso numérico de una rareza para ordenamiento
 * @param rarity Rareza del WorldItem
 * @returns Peso numérico
 */
export function getRarityWeight(rarity: string): number {
	const weights: Record<string, number> = {
		common: 1,
		uncommon: 2,
		rare: 3,
		epic: 4,
		legendary: 5,
		mythic: 6,
		unique: 7,
		artifact: 8,
	};

	return weights[rarity.toLowerCase()] || 0;
}

/**
 * 🔍 Aplica filtros avanzados a una lista de WorldItems
 * @param worldItems Lista de WorldItems
 * @param filters Filtros a aplicar
 * @returns Lista filtrada de WorldItems
 */
export function applyWorldItemFilters(worldItems: WorldItem[], filters: WorldItemFilters): WorldItem[] {
	return worldItems.filter((item) => {
		// Filtro por búsqueda
		if (filters.searchTerm) {
			const matchesSearch = filterWorldItemsBySearch([item], filters.searchTerm).length > 0;
			if (!matchesSearch) return false;
		}

		// Filtro por tipo
		if (filters.type && filters.type !== item.type) {
			return false;
		}

		// Filtro por categoría
		if (filters.category && filters.category !== item.category) {
			return false;
		}

		// Filtro por rareza
		if (filters.rarity && filters.rarity !== item.rarity) {
			return false;
		}

		// Filtro por favoritos
		if (filters.isFavorite && !item.isFavorite) {
			return false;
		}

		return true;
	});
}
