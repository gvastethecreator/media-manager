/**
 * @file Utilidades para la entidad WorldItem
 * @module utils/world-item/helpers
 */

import type { WorldItemRarity, WorldItemType } from '@/types/entities/world-item/enums';
import type { WorldItemExtended } from '@/types/entities/world-item/extended';
import type { WorldItemProperty, WorldItemStats } from '@/types/entities/world-item/stats-types';

/**
 * Calcula el nivel de potencia de un objeto basado en sus estadísticas
 * @param stats Estadísticas del objeto
 * @returns Nivel de potencia estimado (0-100)
 */
export function calculatePowerLevel(stats: WorldItemStats & { effects?: any[] }): number {
	let powerLevel = 0;
	let statCount = 0;

	// Factores de ponderación
	const weights: Record<keyof WorldItemStats, number> = {
		damage: 1.5,
		defense: 1.5,
		durability: 0.8,
		power: 1.7,
		level: 1.0,
		range: 0.6,
		accuracy: 0.7,
		speed: 1.0,
		// Añadir otras propiedades de WorldItemStats si son relevantes para el cálculo
	};

	// Procesar estadísticas comunes
	for (const key of Object.keys(weights) as Array<keyof WorldItemStats>) {
		const value = stats[key] as number | undefined;
		if (value !== undefined) {
			powerLevel += value * weights[key];
			statCount++;
		}
	}

	// Añadir puntos por efectos
	const effects = stats.effects;
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
export function findPropertyValue(properties: WorldItemProperty[], name: string): string | number | null {
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
	worldItem: WorldItemExtended,
	requiredLevel?: number,
	requiredTypes?: WorldItemType[],
	requiredRarities?: WorldItemRarity[]
): boolean {
	// Verificar nivel
	if (requiredLevel !== undefined && worldItem.stats.level && worldItem.stats.level < requiredLevel) {
		return false;
	}

	// Verificar tipo
	if (requiredTypes && requiredTypes.length > 0 && !requiredTypes.includes(worldItem.type as WorldItemType)) {
		return false;
	}

	// Verificar rareza
	if (
		requiredRarities &&
		requiredRarities.length > 0 &&
		!(worldItem.rarity && requiredRarities.includes(worldItem.rarity as WorldItemRarity))
	) {
		return false;
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
export function compareWorldItems(a: WorldItemExtended, b: WorldItemExtended, criteria: string): number {
	// Ordenar por nombre (criterio por defecto)
	if (!criteria || criteria === 'name_asc') {
		return a.name.localeCompare(b.name);
	}

	if (criteria === 'name_desc') {
		return b.name.localeCompare(a.name);
	}

	// Ordenar por fecha de creación
	if (criteria === 'created_asc') {
		return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
	}

	if (criteria === 'created_desc') {
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	}

	// Ordenar por fecha de actualización
	if (criteria === 'updated_asc') {
		return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
	}

	if (criteria === 'updated_desc') {
		return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
	}

	// Ordenar por tipo
	if (criteria === 'type_asc') {
		return (a.type || '').localeCompare(b.type || '');
	}

	if (criteria === 'type_desc') {
		return (b.type || '').localeCompare(a.type || '');
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
		const aRarity = a.rarity || 'unknown';
		const bRarity = b.rarity || 'unknown';
		return (rarityOrder[aRarity] || 0) - (rarityOrder[bRarity] || 0);
	}

	if (criteria === 'rarity_desc') {
		const aRarity = a.rarity || 'unknown';
		const bRarity = b.rarity || 'unknown';
		return (rarityOrder[bRarity] || 0) - (rarityOrder[aRarity] || 0);
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
	worldItems: WorldItemExtended[],
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
): WorldItemExtended[] {
	return worldItems.filter((item) => {
		// Filtrar por búsqueda
		if (filters.searchQuery) {
			const query = filters.searchQuery.toLowerCase();
			const matchesName = item.name.toLowerCase().includes(query);
			const matchesDescription = item.description?.toLowerCase().includes(query);

			if (!(matchesName || matchesDescription)) {
				return false;
			}
		}

		// Filtrar por categoría
		if (
			filters.categories &&
			filters.categories.length > 0 &&
			!(item.category && filters.categories.includes(item.category))
		) {
			return false;
		}

		// Filtrar por tipo
		if (filters.types && filters.types.length > 0 && !(item.type && filters.types.includes(item.type))) {
			return false;
		}

		// Filtrar por rareza
		if (filters.rarities && filters.rarities.length > 0 && !(item.rarity && filters.rarities.includes(item.rarity))) {
			return false;
		}

		// Filtrar por nivel
		if (filters.minLevel !== undefined && item.stats.level !== undefined && item.stats.level < filters.minLevel) {
			return false;
		}

		if (filters.maxLevel !== undefined && item.stats.level !== undefined && item.stats.level > filters.maxLevel) {
			return false;
		}

		// Filtrar por valor
		if (filters.minValue !== undefined && item.stats.value !== undefined && item.stats.value < filters.minValue) {
			return false;
		}

		if (filters.maxValue !== undefined && item.stats.value !== undefined && item.stats.value > filters.maxValue) {
			return false;
		}

		// Filtrar por favoritos
		if (filters.onlyFavorites && !item.isFavorite) {
			return false;
		}

		return true;
	});
}
