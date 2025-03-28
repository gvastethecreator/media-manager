import type { BaseLayerConfig } from '../layer-config-base';

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

export const TILE_MODES = ['repeat', 'repeat-x', 'repeat-y', 'no-repeat'] as const;

export const TEXTURE_PRESETS = {
	PAPER: {
		name: 'Papel',
		description: 'Textura de papel con relieve sutil',
		url: '/textures/paper.jpg',
	},
	CONCRETE: {
		name: 'Concreto',
		description: 'Textura de concreto con detalles',
		url: '/textures/concrete.jpg',
	},
	FABRIC: {
		name: 'Tela',
		description: 'Textura de tela tejida',
		url: '/textures/fabric.jpg',
	},
	METAL: {
		name: 'Metal',
		description: 'Textura metálica con brillo',
		url: '/textures/metal.jpg',
	},
	WOOD: {
		name: 'Madera',
		description: 'Textura de madera natural',
		url: '/textures/wood.jpg',
	},
} as const;

// 📝 Tipos y esquemas
export interface TextureConfig extends BaseLayerConfig {
	textureUrl: string;
	opacity: number;
	scale: number;
	rotation: number;
	blendMode: (typeof BLEND_MODES)[number];
	offsetX: number;
	offsetY: number;
	tileMode: (typeof TILE_MODES)[number];
	filters?: {
		brightness?: number;
		contrast?: number;
		saturation?: number;
		blur?: number;
	};
}

// 🔍 Configuración por defecto
export const DEFAULT_CONFIG: TextureConfig = {
	enabled: true,
	visibleOnHover: false,
	layerIndex: 2,
	textureUrl: TEXTURE_PRESETS.PAPER.url,
	opacity: 0.15,
	scale: 1,
	rotation: 0,
	blendMode: 'multiply',
	offsetX: 0,
	offsetY: 0,
	tileMode: 'repeat',
	filters: {
		brightness: 100,
		contrast: 100,
		saturation: 100,
		blur: 0,
	},
};
