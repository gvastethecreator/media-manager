'use client';

import type { LayerImplementation } from '../types';
import type { NoiseTextureConfig } from './actions/noise-texture-config.action';
import { NoiseTextureLayer } from './components/noise-texture-layer';
import { NoiseTextureSettings } from './components/noise-texture-settings';

/**
 * 🌫️ Implementación de la capa de textura de ruido
 * Esta capa permite añadir efectos de ruido procedural a las tarjetas
 */
export const noiseTextureImplementation: LayerImplementation<NoiseTextureConfig> = {
	type: 'noiseTexture',
	name: 'Noise Texture',
	description: 'Añade efectos de ruido procedural a las tarjetas',
	icon: '🌫️',
	defaultConfig: {
		enabled: true,
		visibleOnHover: false,
		layerIndex: 3,
		opacity: 0.1,
		density: 0.6,
		pattern: 'fractalNoise',
		scale: 1,
		octaves: 3,
		seed: 42,
		animated: false,
		animationSpeed: 1,
		color: 'rgba(255, 255, 255, 0.5)',
		intensity: 0.5,
		blendMode: 'overlay',
	},
	component: NoiseTextureLayer,
	settings: NoiseTextureSettings,
	presets: [
		{
			name: 'Suave',
			description: 'Textura de ruido suave y sutil',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 3,
				opacity: 0.08,
				density: 0.4,
				pattern: 'fractalNoise',
				scale: 1.5,
				octaves: 2,
				seed: 42,
				animated: false,
				animationSpeed: 1,
				color: 'rgba(255, 255, 255, 0.4)',
				intensity: 0.4,
				blendMode: 'overlay',
			},
		},
		{
			name: 'Dinámico',
			description: 'Textura de ruido animada y dinámica',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 3,
				opacity: 0.15,
				density: 0.7,
				pattern: 'fractalNoise',
				scale: 0.8,
				octaves: 4,
				seed: 42,
				animated: true,
				animationSpeed: 1.5,
				color: 'rgba(255, 255, 255, 0.6)',
				intensity: 0.6,
				blendMode: 'overlay',
			},
		},
		{
			name: 'Intenso',
			description: 'Textura de ruido más pronunciada y visible',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 3,
				opacity: 0.2,
				density: 0.8,
				pattern: 'fractalNoise',
				scale: 0.6,
				octaves: 5,
				seed: 42,
				animated: false,
				animationSpeed: 1,
				color: 'rgba(255, 255, 255, 0.7)',
				intensity: 0.8,
				blendMode: 'overlay',
			},
		},
	],
};
