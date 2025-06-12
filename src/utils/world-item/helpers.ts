/**
 * @file Utilidades para la entidad WorldItem
 * @module utils/world-item/helpers
 */

import type {
	RarityLevel,
	WorldItemRarity,
	WorldItem,
	WorldItemProperty,
	WorldItemStats,
	WorldItemType,
} from '../../types/entities/world-item';

/**
 * Calcula el nivel de potencia de un objeto basado en sus estadísticas
 * @param stats Estadísticas del objeto
 * @returns Nivel de potencia estimado (0-100)
 */
export function calculatePowerLevel(stats: WorldItemStats): number {
	let powerLevel = 0;
	let statCount = 0;

	// Factores de ponderación
	const weights = {
		damage: 1.5,
		defense: 1.5,
		durability: 0.8,
		power: 1.7,
		level: 1.0,
		range: 0.6,
		accuracy: 0.7,
		speed: 1.0,
	};

	// Procesar estadísticas comunes
	for (const [key, weight] of Object.entries(weights)) {
		const value = stats[key as keyof WorldItemStats] as number | undefined;
		if (value !== undefined) {
			powerLevel += value * weight;
			statCount++;
		}
	}

	// Añadir puntos por efectos
	const effects = (stats as unknown as { effects?: unknown[] }).effects;
	if (Array.isArray(effects) && effects.length > 0) {
		powerLevel += effects.length * 5;
		statCount++;
	}

	// Calcular promedio ponderado
	if (statCount > 0) {
		powerLevel /= statCount;
	}

	// Normalizar a una escala 0-100
	return Math.min(100, Math.round(powerLevel));
}

/**
 * Encuentra el valor de una propiedad por su nombre
 * @param properties Lista de propiedades
 * @param name Nombre de la propiedad
 * @returns Valor de la propiedad o null si no existe
 */
export function findPropertyValue(properties: WorldItemProperty[], name: string): string | number | boolean | null {
	const property = properties.find((p) => p.name.toLowerCase() === name.toLowerCase());
	return property ? property.value : null;
}

/**
 * Verifica si un objeto del mundo cumple con un conjunto de requisitos
 * @param worldItem Objeto del mundo
 * @param requiredLevel Nivel mínimo requerido
 * @param requiredTypes Tipos aceptables
 * @param requiredRarities Rarezas aceptables
 * @returns Verdadero si cumple con todos los requisitos
 */
export function meetsRequirements(
	worldItem: WorldItem,
	requiredLevel?: number,
	requiredTypes?: WorldItemType[],
	requiredRarities?: WorldItemRarity[]
): boolean {
	// Verificar nivel
	if (requiredLevel !== undefined && worldItem.stats.level) {
		if (worldItem.stats.level < requiredLevel) {
			return false;
		}
	}

	// Verificar tipo
	if (requiredTypes && requiredTypes.length > 0) {
		if (!requiredTypes.includes(worldItem.type as WorldItemType)) {
			return false;
		}
	}

	// Verificar rareza
	if (requiredRarities && requiredRarities.length > 0) {
		if (!requiredRarities.includes(worldItem.rarity as WorldItemRarity)) {
			return false;
		}
	}

	return true;
}

/**
 * Compara dos objetos del mundo por un criterio de ordenación
 * @param a Primer objeto
 * @param b Segundo objeto
 * @param criteria Criterio de ordenación
 * @returns Resultado de la comparación (-1, 0, 1)
 */
export function compareWorldItems(a: WorldItem, b: WorldItem, criteria: string): number {
	// Ordenar por nombre (criterio por defecto)
	if (!criteria || criteria === 'name_asc') {
		return a.name.localeCompare(b.name);
	}

	if (criteria === 'name_desc') {
		return b.name.localeCompare(a.name);
	}

	// Ordenar por fecha de creación
	if (criteria === 'created_asc') {
		return a.createdAt!.getTime() - b.createdAt!.getTime();
	}

	if (criteria === 'created_desc') {
		return b.createdAt!.getTime() - a.createdAt!.getTime();
	}

	// Ordenar por fecha de actualización
	if (criteria === 'updated_asc') {
		return a.updatedAt!.getTime() - b.updatedAt!.getTime();
	}

	if (criteria === 'updated_desc') {
		return b.updatedAt!.getTime() - a.updatedAt!.getTime();
	}

	// Ordenar por tipo
	if (criteria === 'type_asc') {
		return a.type.localeCompare(b.type);
	}

	if (criteria === 'type_desc') {
		return b.type.localeCompare(a.type);
	}

	// Ordenar por rareza (mapeo especial para asegurar orden correcto)
	const rarityOrder: Record<string, number> = {
		common: 0,
		uncommon: 1,
		rare: 2,
		epic: 3,
		legendary: 4,
		mythic: 5,
		unique: 6,
		artifact: 7,
	};

	if (criteria === 'rarity_asc') {
		return (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
	}

	if (criteria === 'rarity_desc') {
		return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
	}

	// Si no coincide ningún criterio, ordenar por nombre
	return a.name.localeCompare(b.name);
}

/**
 * Filtra una lista de objetos del mundo según criterios de búsqueda
 * @param worldItems Lista de objetos
 * @param filters Filtros de búsqueda
 * @returns Lista filtrada de objetos
 */
export function filterWorldItems(
	worldItems: WorldItem[],
	filters: {
		searchQuery?: string;
		categories?: string[];
		types?: string[];
		rarities?: string[];
		minLevel?: number;
		maxLevel?: number;
		minValue?: number;
		maxValue?: number;
		onlyFavorites?: boolean;
	}
): WorldItem[] {
	return worldItems.filter((item) => {
		// Filtrar por búsqueda
		if (filters.searchQuery) {
			const query = filters.searchQuery.toLowerCase();
			const matchesName = item.name.toLowerCase().includes(query);
			const matchesDescription = item.description?.toLowerCase().includes(query);

			if (!matchesName && !matchesDescription) {
				return false;
			}
		}

		// Filtrar por categoría
		if (filters.categories && filters.categories.length > 0) {
			if (!item.category || !filters.categories.includes(item.category)) {
				return false;
			}
		}

		// Filtrar por tipo
		if (filters.types && filters.types.length > 0) {
			if (!filters.types.includes(item.type)) {
				return false;
			}
		}

		// Filtrar por rareza
		if (filters.rarities && filters.rarities.length > 0) {
			if (!filters.rarities.includes(item.rarity as WorldItemRarity)) {
				return false;
			}
		}

		// Filtrar por nivel
		if (filters.minLevel !== undefined && item.stats.level !== undefined) {
			if (item.stats.level < filters.minLevel) {
				return false;
			}
		}

		if (filters.maxLevel !== undefined && item.stats.level !== undefined) {
			if (item.stats.level > filters.maxLevel) {
				return false;
			}
		}

		// Filtrar por valor
		if (filters.minValue !== undefined && item.stats.value !== undefined) {
			if (item.stats.value < filters.minValue) {
				return false;
			}
		}

		if (filters.maxValue !== undefined && item.stats.value !== undefined) {
			if (item.stats.value > filters.maxValue) {
				return false;
			}
		}

		// Filtrar por favoritos
		if (filters.onlyFavorites) {
			if (!item.isFavorite) {
				return false;
			}
		}

		return true;
	});
}
