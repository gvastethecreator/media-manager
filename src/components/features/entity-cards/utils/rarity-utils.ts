/**
 * Utilidades para manejar la rareza en las tarjetas de entidad
 */

import type { BaseCardRarityConfig } from '../types/base-card-types';

/**
 * Genera una configuración de rareza basada en el nivel
 * @param level Nivel de rareza (common, uncommon, rare, epic, legendary)
 * @param color Color base para la rareza
 * @returns Configuración de rareza
 */
export function generateRarityConfig(level: string, color = '#3b82f6'): BaseCardRarityConfig {
	return {
		name: level,
		color,
		borderWidth: level === 'common' ? '1px' : level === 'uncommon' ? '2px' : '3px',
		borderEffect: level === 'common' ? 'static' : level === 'uncommon' ? 'pulse' : 'glow',
	};
}

/**
 * Obtiene el color de rareza basado en el nivel
 * @param level Nivel de rareza
 * @returns Color hexadecimal
 */
export function getRarityColor(level: string): string {
	switch (level) {
		case 'common':
			return '#9ca3af'; // gray-400
		case 'uncommon':
			return '#10b981'; // emerald-500
		case 'rare':
			return '#3b82f6'; // blue-500
		case 'epic':
			return '#8b5cf6'; // violet-500
		case 'legendary':
			return '#f59e0b'; // amber-500
		default:
			return '#9ca3af'; // gray-400
	}
}

/**
 * Obtiene el efecto de borde basado en el nivel de rareza
 * @param level Nivel de rareza
 * @returns Tipo de efecto (static, pulse, glow)
 */
export function getRarityBorderEffect(level: string): 'static' | 'pulse' | 'glow' {
	switch (level) {
		case 'common':
			return 'static';
		case 'uncommon':
			return 'pulse';
		case 'rare':
		case 'epic':
		case 'legendary':
			return 'glow';
		default:
			return 'static';
	}
}

/**
 * Obtiene el ancho del borde basado en el nivel de rareza
 * @param level Nivel de rareza
 * @returns Ancho del borde en píxeles
 */
export function getRarityBorderWidth(level: string): number {
	switch (level) {
		case 'common':
			return 1;
		case 'uncommon':
			return 2;
		case 'rare':
			return 2;
		case 'epic':
			return 3;
		case 'legendary':
			return 3;
		default:
			return 1;
	}
}
