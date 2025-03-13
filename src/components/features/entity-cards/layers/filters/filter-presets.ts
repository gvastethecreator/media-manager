/**
 * Presets de filtros para distintos efectos visuales
 * Estos presets pueden ser aplicados directamente a la configuración del sistema de filtros
 */

import type { FilterConfig } from './actions/filter-config.action';

export type FilterPreset = {
	name: string;
	description: string;
	thumbnail?: string;
	config: Partial<FilterConfig>;
};

/**
 * Colección de presets predefinidos para efectos de filtro
 */
export const filterPresets: Record<string, FilterPreset> = {
	default: {
		name: 'Predeterminado',
		description: 'Configuración estándar con sombra sutil',
		config: {
			enabled: true,
			visibleOnHover: false,
			opacity: 1,
			intensity: 1,
			glow: {
				enabled: false,
				color: 'rgba(0, 0, 255, 0.3)',
				radius: 10,
				intensity: 0.5,
			},
			shadow: {
				enabled: true,
				color: 'rgba(0, 0, 0, 0.3)',
				blur: 5,
				offsetX: 0,
				offsetY: 5,
				inset: false,
			},
			distortion: {
				enabled: false,
				type: 'wave',
				amount: 5,
				speed: 1,
				animated: false,
			},
		},
	},
	neon: {
		name: 'Neón',
		description: 'Efecto de resplandor neón vibrante',
		config: {
			enabled: true,
			glow: {
				enabled: true,
				color: 'rgba(0, 255, 255, 0.6)',
				radius: 15,
				intensity: 0.7,
				animated: true,
				animationSpeed: 1.5,
			},
			shadow: {
				enabled: true,
				color: 'rgba(0, 0, 0, 0.5)',
				blur: 10,
				offsetX: 0,
				offsetY: 7,
			},
		},
	},
	dramatic: {
		name: 'Dramático',
		description: 'Sombra profunda para efecto cinematográfico',
		config: {
			enabled: true,
			shadow: {
				enabled: true,
				color: 'rgba(0, 0, 0, 0.75)',
				blur: 30,
				offsetX: 5,
				offsetY: 20,
			},
		},
	},
	subtle: {
		name: 'Sutil',
		description: 'Efecto de elevación mínimo y elegante',
		config: {
			enabled: true,
			shadow: {
				enabled: true,
				color: 'rgba(0, 0, 0, 0.15)',
				blur: 10,
				offsetX: 0,
				offsetY: 3,
			},
		},
	},
	glitch: {
		name: 'Glitch',
		description: 'Efecto de distorsión tipo glitch digital',
		config: {
			enabled: true,
			distortion: {
				enabled: true,
				type: 'noise',
				amount: 8,
				speed: 1.8,
				animated: true,
				frequency: 2.5,
			},
			glow: {
				enabled: true,
				color: 'rgba(255, 0, 128, 0.4)',
				radius: 5,
				intensity: 0.3,
			},
		},
	},
	waves: {
		name: 'Ondas',
		description: 'Efecto de distorsión de ondas suaves',
		config: {
			enabled: true,
			distortion: {
				enabled: true,
				type: 'wave',
				amount: 5,
				speed: 0.8,
				animated: true,
				frequency: 1.2,
			},
		},
	},
	warmGlow: {
		name: 'Resplandor Cálido',
		description: 'Suave resplandor en tonos cálidos',
		config: {
			enabled: true,
			glow: {
				enabled: true,
				color: 'rgba(255, 170, 0, 0.35)',
				radius: 20,
				intensity: 0.4,
			},
		},
	},
	coolGlow: {
		name: 'Resplandor Frío',
		description: 'Resplandor en tonos fríos y azulados',
		config: {
			enabled: true,
			glow: {
				enabled: true,
				color: 'rgba(0, 153, 255, 0.3)',
				radius: 20,
				intensity: 0.4,
			},
		},
	},
	innerShadow: {
		name: 'Sombra Interior',
		description: 'Efecto de profundidad con sombra interna',
		config: {
			enabled: true,
			shadow: {
				enabled: true,
				color: 'rgba(0, 0, 0, 0.4)',
				blur: 10,
				offsetX: 0,
				offsetY: 0,
				inset: true,
			},
		},
	},
	ripple: {
		name: 'Ondulación',
		description: 'Efecto de ondulación como agua',
		config: {
			enabled: true,
			distortion: {
				enabled: true,
				type: 'ripple',
				amount: 4,
				speed: 0.5,
				animated: true,
				frequency: 1,
			},
		},
	},
	twist: {
		name: 'Torsión',
		description: 'Efecto de torsión ligera',
		config: {
			enabled: true,
			distortion: {
				enabled: true,
				type: 'twist',
				amount: 3,
				animated: false,
			},
		},
	},
	hover: {
		name: 'Al Pasar',
		description: 'Efectos visibles solo al pasar el mouse',
		config: {
			enabled: true,
			visibleOnHover: true,
			glow: {
				enabled: true,
				color: 'rgba(255, 255, 255, 0.5)',
				radius: 15,
				intensity: 0.6,
			},
			shadow: {
				enabled: true,
				color: 'rgba(0, 0, 0, 0.4)',
				blur: 15,
				offsetX: 0,
				offsetY: 8,
			},
		},
	},
};

/**
 * Aplica un preset a una configuración existente
 * @param currentConfig Configuración actual
 * @param presetId Identificador del preset a aplicar
 * @returns Nueva configuración con el preset aplicado
 */
export function applyFilterPreset(currentConfig: FilterConfig, presetId: string): FilterConfig {
	const preset = filterPresets[presetId];
	if (!preset) {
		console.warn(`Preset de filtro no encontrado: ${presetId}`);
		return currentConfig;
	}

	// Combinar la configuración actual con el preset
	return {
		...currentConfig,
		...preset.config,
		glow: {
			...currentConfig.glow,
			...preset.config.glow,
		},
		shadow: {
			...currentConfig.shadow,
			...preset.config.shadow,
		},
		distortion: {
			...currentConfig.distortion,
			...preset.config.distortion,
		},
	};
}

/**
 * Obtiene una lista de presets disponibles para mostrar en la UI
 * @returns Array de presets con sus metadatos
 */
export function getAvailablePresets(): Array<{ id: string } & FilterPreset> {
	return Object.entries(filterPresets).map(([id, preset]) => ({
		id,
		...preset,
	}));
}