/**
 * @file Utilidades para la entidad WorldItem
 * @module store/entities/world-item/utils
 * @description Funciones de utilidad para manipular datos de WorldItem
 * @updated 2025-06-20
 */

import type { WorldItemComplete, WorldItemFilters } from '@/types/entities/world-item';
import { WORLD_ITEM_RARITY_COLORS } from './constants';

/**
 * Genera un ID único para un WorldItem
 * @returns ID único generado
 */
export const generateWorldItemId = (): string => {
	return `world-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Filtra una lista de objetos del mundo según los criterios especificados
 * @param items Lista de objetos del mundo
 * @param filters Filtros a aplicar
 * @param searchQuery Consulta de búsqueda
 * @returns Lista filtrada de objetos del mundo
 */
export const filterWorldItems = (
	items: WorldItemComplete[],
	filters: WorldItemFilters,
	searchQuery = ''
): WorldItemComplete[] => {
	if (!items || items.length === 0) return [];

	// Si no hay filtros ni consulta, devolver todos los items
	if (!filters && !searchQuery) return items;

	return items.filter((item) => {
		// Filtro por búsqueda
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			const matchesSearch =
				item.name.toLowerCase().includes(query) ||
				item.description?.toLowerCase().includes(query) ||
				item.type.toLowerCase().includes(query) ||
				item.rarity.toLowerCase().includes(query) ||
				item.category?.toLowerCase().includes(query);

			if (!matchesSearch) return false;
		}

		// Filtros específicos
		if (filters) {
			// Filtro por tipo
			if (filters.type) {
				if (filters.type !== item.type) return false;
			}

			// Filtro por categoría
			if (filters.category) {
				if (!item.category || filters.category !== item.category) return false;
			}

			// Filtro por rareza
			if (filters.rarity) {
				if (filters.rarity !== item.rarity) return false;
			}

			// Filtro por favoritos
			if (filters.isFavorite && !item.isFavorite) {
				return false;
			}

			// Filtros por nivel (si aplica)
			if (typeof filters.minLevel === 'number' || typeof filters.maxLevel === 'number') {
				const itemLevel = extractNumberFromStats(item.stats, 'level');

				if (typeof itemLevel === 'number') {
					if (typeof filters.minLevel === 'number' && itemLevel < filters.minLevel) return false;
					if (typeof filters.maxLevel === 'number' && itemLevel > filters.maxLevel) return false;
				}
			}

			// Filtros por valor (si aplica)
			if (typeof filters.minValue === 'number' || typeof filters.maxValue === 'number') {
				const itemValue = extractNumberFromStats(item.stats, 'value');

				if (typeof itemValue === 'number') {
					if (typeof filters.minValue === 'number' && itemValue < filters.minValue) return false;
					if (typeof filters.maxValue === 'number' && itemValue > filters.maxValue) return false;
				}
			}

			// Filtros por relaciones
			if (filters.hasImages && (!item.counts?.images || item.counts.images === 0)) return false;
			if (filters.hasNotes && (!item.counts?.notes || item.counts.notes === 0)) return false;
			if (filters.hasConcepts && (!item.counts?.concepts || item.counts.concepts === 0)) return false;
			if (filters.hasPrompts && (!item.counts?.prompts || item.counts.prompts === 0)) return false;
		}

		return true;
	});
};

/**
 * Ordena una lista de objetos del mundo según el criterio especificado
 * @param items Lista de objetos del mundo
 * @param sortBy Criterio de ordenamiento
 * @returns Lista ordenada de objetos del mundo
 */
export const sortWorldItems = (items: WorldItemComplete[], sortBy: string): WorldItemComplete[] => {
	if (!items || items.length === 0) return [];

	const sortedItems = [...items];

	switch (sortBy) {
		case 'name_asc':
			return sortedItems.sort((a, b) => a.name.localeCompare(b.name));

		case 'name_desc':
			return sortedItems.sort((a, b) => b.name.localeCompare(a.name));

		case 'created_asc':
			return sortedItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

		case 'created_desc':
			return sortedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		case 'updated_asc':
			return sortedItems.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

		case 'updated_desc':
			return sortedItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

		case 'type_asc':
			return sortedItems.sort((a, b) => a.type.localeCompare(b.type));

		case 'type_desc':
			return sortedItems.sort((a, b) => b.type.localeCompare(a.type));

		case 'rarity_asc':
			return sortedItems.sort((a, b) => getRarityWeight(a.rarity) - getRarityWeight(b.rarity));

		case 'rarity_desc':
			return sortedItems.sort((a, b) => getRarityWeight(b.rarity) - getRarityWeight(a.rarity));

		default:
			return sortedItems;
	}
};

/**
 * Obtiene el peso de una rareza para ordenamiento
 * @param rarity Rareza a evaluar
 * @returns Peso numérico de la rareza
 */
export const getRarityWeight = (rarity: string): number => {
	const rarityLevels: Record<string, number> = {
		common: 1,
		uncommon: 2,
		rare: 3,
		epic: 4,
		legendary: 5,
		mythic: 6,
		unique: 7,
		artifact: 8,
	};

	return rarityLevels[rarity.toLowerCase()] || 0;
};

/**
 * Obtiene el color asociado a una rareza
 * @param rarity Rareza del objeto
 * @returns Código de color
 */
export const getRarityColor = (rarity: string): string => {
	const rarityKey = rarity.toLowerCase() as keyof typeof WORLD_ITEM_RARITY_COLORS;
	return WORLD_ITEM_RARITY_COLORS[rarityKey] || '#6b7280';
};

/**
 * Extrae un valor numérico de un string JSON de estadísticas
 * @param statsJson String JSON de estadísticas
 * @param key Clave a extraer
 * @returns Valor numérico o undefined si no existe
 */
export const extractNumberFromStats = (statsJson: string, key: string): number | undefined => {
	try {
		const stats = JSON.parse(statsJson);
		const value = stats[key];
		return typeof value === 'number' ? value : undefined;
	} catch (_error) {
		return undefined;
	}
};

/**
 * Analiza y transforma las estadísticas JSON de un objeto
 * @param statsJson String JSON de estadísticas
 * @returns Objeto de estadísticas analizadas
 */
export const parseWorldItemStats = (statsJson: string): Record<string, any> => {
	try {
		return JSON.parse(statsJson);
	} catch (_error) {
		return {};
	}
};

/**
 * Convierte un objeto de estadísticas a string JSON
 * @param stats Objeto de estadísticas
 * @returns String JSON de estadísticas
 */
export const stringifyWorldItemStats = (stats: Record<string, any>): string => {
	try {
		return JSON.stringify(stats);
	} catch (_error) {
		return '{}';
	}
};
