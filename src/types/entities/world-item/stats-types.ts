/**
 * @file Tipos estadísticos para la entidad WorldItem
 * @module types/entities/world-item/stats-types
 */

/**
 * Estadísticas de un objeto del mundo
 */
export interface WorldItemStats {
	defense?: number;
	durability?: number;
	level?: number;
	power?: number;
	value?: number;
	weight?: number;
	// Estadísticas adicionales como clave-valor
	[key: string]: number | undefined;
}

/**
 * Efecto que puede producir un objeto del mundo
 */
export interface WorldItemEffect {
	chance?: number;
	description?: string;
	duration?: number;
	name: string;
	type: string;
	value: number;
}

/**
 * Requisito para usar un objeto del mundo
 */
export interface WorldItemRequirement {
	description?: string;
	type: string;
	value: number;
}

/**
 * Propiedad de un objeto del mundo
 */
export interface WorldItemProperty {
	description?: string;
	icon?: string;
	name: string;
	value: string | number;
}

/**
 * Atributos del objeto del mundo
 */
export interface WorldItemAttributes {
	[key: string]: string | number | boolean;
}

/**
 * Vista general de estadísticas para objetos del mundo
 */
export interface WorldItemStatsOverview {
	averageLevel: number;
	byRarity: Record<string, number>;
	byType: Record<string, number>;
	highestValue: number;
	totalItems: number;
	totalValue: number;
}

/**
 * Distribución de objetos del mundo por categoría
 */
export interface WorldItemDistribution {
	category: string;
	count: number;
	percentage: number;
}
