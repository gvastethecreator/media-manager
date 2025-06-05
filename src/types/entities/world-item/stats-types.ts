/**
 * @file Tipos estadísticos para la entidad WorldItem
 * @module types/entities/world-item/stats-types
 */

/**
 * Estadísticas de un objeto del mundo
 */
export interface WorldItemStats {
	power?: number;
	defense?: number;
	durability?: number;
	weight?: number;
	value?: number;
	level?: number;
	// Estadísticas adicionales como clave-valor
	[key: string]: number | undefined;
}

/**
 * Efecto que puede producir un objeto del mundo
 */
export interface WorldItemEffect {
	name: string;
	description?: string;
	type: string;
	value: number;
	duration?: number;
	chance?: number;
}

/**
 * Requisito para usar un objeto del mundo
 */
export interface WorldItemRequirement {
	type: string;
	value: number;
	description?: string;
}

/**
 * Propiedad de un objeto del mundo
 */
export interface WorldItemProperty {
	name: string;
	value: string | number;
	description?: string;
	icon?: string;
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
	totalItems: number;
	byRarity: Record<string, number>;
	byType: Record<string, number>;
	averageLevel: number;
	highestValue: number;
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
