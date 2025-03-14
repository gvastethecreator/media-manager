'use client';

import * as React from 'react';
import type { LayerComponent } from '../layer-plugin-system';
import { deleteBorderConfig, getBorderConfig, updateBorderConfig } from './actions';
import BorderEffectLayerWithStyles, { BorderEffectLayer, type BorderConfig } from './border-effect-layer';
import { BorderSettings } from './border-settings';

// Registrar la capa para el sistema de plugins
export const borderLayer: LayerComponent<BorderConfig> = {
	type: 'border',
	Component: BorderEffectLayerWithStyles,
	SettingsComponent: BorderSettings,
	defaultConfig: {
		enabled: true,
		width: 2,
		style: 'solid',
		color: '#ffffff',
		radius: 8,
		animated: false,
		animationType: 'none',
		animationSpeed: 1,
		glowAmount: 0,
		opacity: 1,
		cornerStyle: 'round',
		layerIndex: 2,
	},
	getServerActions: () => ({
		getConfig: getBorderConfig,
		updateConfig: updateBorderConfig,
		deleteConfig: deleteBorderConfig,
	}),
};

// Exportaciones adicionales
export { BorderEffectLayer } from './border-effect-layer';
export { BorderSettings } from './border-settings';
export * from './actions';
