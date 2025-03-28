import type { BaseLayerConfig } from '../types';

// 🎨 Constantes
export const BLEND_MODES = [
	'normal',
	'multiply',
	'screen',
	'overlay',
	'darken',
	'lighten',
	'color-dodge',
	'color-burn',
	'hard-light',
	'soft-light',
	'difference',
	'exclusion',
	'hue',
	'saturation',
	'color',
	'luminosity',
] as const;

export const LINE_DIRECTIONS = ['horizontal', 'vertical'] as const;

export const PRESET_COLORS = {
	BLACK: '#000000',
	WHITE: '#FFFFFF',
	RED: '#FF0000',
	GREEN: '#00FF00',
	BLUE: '#0000FF',
	CYAN: '#00FFFF',
	MAGENTA: '#FF00FF',
	YELLOW: '#FFFF00',
} as const;

// 📝 Tipos y esquemas
export interface ScanlinesConfig extends BaseLayerConfig {
	opacity: number;
	lineWidth: number;
	lineSpacing: number;
	speed: number;
	color: string;
	blendMode: (typeof BLEND_MODES)[number];
	direction: (typeof LINE_DIRECTIONS)[number];
	animated: boolean;
	offset: number;
}

// 🔍 Configuración por defecto
export const DEFAULT_CONFIG: ScanlinesConfig = {
	enabled: true,
	visibleOnHover: false,
	layerIndex: 3,
	opacity: 0.15,
	lineWidth: 1,
	lineSpacing: 3,
	speed: 0,
	color: PRESET_COLORS.BLACK,
	blendMode: 'multiply',
	direction: 'horizontal',
	animated: false,
	offset: 0,
};
