'use client';

import * as React from 'react';
import type { LayerComponent } from '../layer-plugin-system';
import {
	deleteNoiseTextureConfig,
	getNoiseTextureConfig,
	updateNoiseTextureConfig,
} from './actions/noise-texture-config.action';
import type { NoiseTextureConfig } from './actions/noise-texture-config.action';
import { NoiseTextureLayer } from './noise-texture-layer';
import { NoiseTextureSettings } from './noise-texture-settings';

// Registrar la capa para el sistema de plugins
export const noiseTextureLayer: LayerComponent<NoiseTextureConfig> = {
	type: 'noiseTexture',
	Component: NoiseTextureLayer,
	SettingsComponent: NoiseTextureSettings,
	defaultConfig: {
		enabled: true,
		density: 0.6,
		opacity: 0.1,
		visibleOnHover: true,
		pattern: 'fractalNoise',
		scale: 1,
		octaves: 3,
		seed: 42,
		animated: false,
		animationSpeed: 1,
		blendMode: 'overlay',
		color: 'rgba(255, 255, 255, 0.5)',
		intensity: 0.5,
	},
	getServerActions: () => ({
		getConfig: getNoiseTextureConfig,
		updateConfig: updateNoiseTextureConfig,
		deleteConfig: deleteNoiseTextureConfig,
	}),
};

// Exportar componentes y acciones
export { NoiseTextureLayer } from './noise-texture-layer';
export { NoiseTextureSettings } from './noise-texture-settings';
export {
	getNoiseTextureConfig,
	updateNoiseTextureConfig,
	deleteNoiseTextureConfig,
} from './actions/noise-texture-config.action';
export type { NoiseTextureConfig } from './actions/noise-texture-config.action';
