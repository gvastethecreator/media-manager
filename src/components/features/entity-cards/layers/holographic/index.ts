'use client';

import * as React from 'react';
import type { LayerComponent } from '../layer-plugin-system';
import {
	deleteHolographicConfig,
	getHolographicConfig,
	updateHolographicConfig,
} from './actions/holographic-config.action';
import type { HolographicConfig } from './actions/holographic-config.action';
import HolographicEffectWrapper from './holographic-effect-wrapper';
import { HolographicSettings } from './holographic-settings';

// Registrar la capa para el sistema de plugins
export const holographicLayer: LayerComponent<HolographicConfig> = {
	type: 'holographic',
	Component: HolographicEffectWrapper,
	SettingsComponent: HolographicSettings,
	defaultConfig: {
		enabled: true,
		intensity: 0.7,
		pattern: 'rainbow',
		colors: ['rgba(255,0,128,0.8)', 'rgba(0,255,255,0.8)', 'rgba(128,0,255,0.8)'],
		speed: 1,
		angle: 45,
		scale: 1,
		blend: 'overlay',
		animated: true,
		interactiveMode: 'mouse',
	},
	getServerActions: () => ({
		getConfig: getHolographicConfig,
		updateConfig: updateHolographicConfig,
		deleteConfig: deleteHolographicConfig,
	}),
};

// Exportaciones adicionales
export { HolographicLayer } from './holographic-layer';
export { HolographicSettings } from './holographic-settings';
export {
	getHolographicConfig,
	updateHolographicConfig,
	deleteHolographicConfig,
} from './actions/holographic-config.action';
export type { HolographicConfig } from './actions/holographic-config.action';
