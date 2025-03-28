import type { LayerImplementation } from '../layer-plugin-system';
import { PixelateLayer } from './components/pixelate-layer';
import { PixelateSettings } from './components/pixelate-settings';
import type { PixelateConfig } from './pixelate-schema';
import { createDefaultPixelateConfig } from './pixelate-schema';

/**
 * 🎮 Implementación de la capa de pixelado
 * Permite aplicar efectos de pixelado retro a las imágenes
 */
export const pixelateImplementation: LayerImplementation<PixelateConfig> = {
	type: 'pixelate',
	name: 'Pixelado',
	description: 'Aplica efectos de pixelado retro a las imágenes',
	icon: '🎮',
	defaultConfig: createDefaultPixelateConfig(),
	render: PixelateLayer,
	settings: PixelateSettings,
	presets: {
		'TV Retro': {
			pixelSize: 4,
			algorithm: 'simple',
			colorReduction: true,
			colorLevels: 16,
			zone: {
				enabled: false,
				centerX: 0.5,
				centerY: 0.5,
				radius: 0.5,
				feather: 0.2,
			},
			transition: {
				enabled: true,
				duration: 300,
				easing: 'ease-out',
			},
			blendMode: 'normal',
		},
		'Monitor CRT': {
			pixelSize: 2,
			algorithm: 'weighted',
			colorReduction: true,
			colorLevels: 32,
			zone: {
				enabled: false,
			},
			transition: {
				enabled: true,
				duration: 200,
			},
			blendMode: 'screen',
		},
		Cyberpunk: {
			pixelSize: 6,
			algorithm: 'adaptive',
			colorReduction: true,
			colorLevels: 8,
			zone: {
				enabled: true,
				centerX: 0.5,
				centerY: 0.5,
				radius: 0.7,
				feather: 0.3,
			},
			transition: {
				enabled: true,
				duration: 400,
				easing: 'ease-in-out',
			},
			blendMode: 'overlay',
		},
		Matrix: {
			pixelSize: 3,
			algorithm: 'simple',
			colorReduction: true,
			colorLevels: 4,
			zone: {
				enabled: false,
			},
			transition: {
				enabled: true,
				duration: 500,
			},
			blendMode: 'multiply',
		},
		Glitch: {
			pixelSize: 8,
			algorithm: 'adaptive',
			colorReduction: true,
			colorLevels: 6,
			zone: {
				enabled: true,
				centerX: 0.5,
				centerY: 0.5,
				radius: 0.6,
				feather: 0.4,
			},
			transition: {
				enabled: true,
				duration: 150,
				easing: 'linear',
			},
			blendMode: 'difference',
		},
	},
};
