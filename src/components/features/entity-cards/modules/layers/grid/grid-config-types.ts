import type { BaseLayerConfig } from '../layer-config-base';

// 🎨 Constantes
export const GRID_TYPES = ['lines', 'dots', 'squares', 'hexagons', 'diamonds'] as const;
export const GRID_COLORS = ['auto', 'primary', 'secondary', 'custom'] as const;

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
] as const;

// 🧩 Presets de grids
export const GRID_PRESETS = {
	BLUEPRINT: {
		name: 'Plano técnico',
		description: 'Grid de estilo plano arquitectónico',
		type: 'lines',
		spacing: 20,
		thickness: 1,
		color: '#1a73e8',
		opacity: 0.15,
	},
	GRAPH_PAPER: {
		name: 'Papel cuadriculado',
		description: 'Grid de cuadros estilo papel de matemáticas',
		type: 'squares',
		spacing: 15,
		thickness: 1,
		color: '#202124',
		opacity: 0.08,
	},
	DOT_MATRIX: {
		name: 'Matriz de puntos',
		description: 'Patrón de puntos equidistantes',
		type: 'dots',
		spacing: 20,
		thickness: 2,
		color: '#5f6368',
		opacity: 0.12,
	},
	ISOMETRIC: {
		name: 'Isométrico',
		description: 'Patrón de diamantes para diseño 3D',
		type: 'diamonds',
		spacing: 25,
		thickness: 1,
		color: '#4285f4',
		opacity: 0.1,
	},
	HEXAGONAL: {
		name: 'Panal',
		description: 'Patrón de hexágonos tipo panal',
		type: 'hexagons',
		spacing: 30,
		thickness: 1.5,
		color: '#34a853',
		opacity: 0.12,
	},
};

// 🔄 Interfaz de la configuración
export interface GridConfig extends BaseLayerConfig {
	gridType: (typeof GRID_TYPES)[number];
	spacing: number;
	thickness: number;
	color: string;
	opacity: number;
	blendMode: (typeof BLEND_MODES)[number];
	angle: number;
	showSubgrid: boolean;
	subgridDivisions: number;
	subgridOpacity: number;
	animateOnHover: boolean;
	animationSpeed: number;
	colorMode: (typeof GRID_COLORS)[number];
}
