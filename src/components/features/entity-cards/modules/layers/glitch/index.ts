'use client';

import * as React from 'react';
import type { LayerComponent } from '../layer-plugin-system';
import {
	type GlitchEffectConfig,
	deleteGlitchEffectConfig,
	getGlitchEffectConfig,
	updateGlitchEffectConfig,
} from './actions/glitch-effect-config.action';
import { GlitchEffectConfigForm } from './glitch-effect-config-form';
import GlitchEffectWrapper from './glitch-effect-wrapper';

// Registrar la capa para el sistema de plugins
export const glitchLayer: LayerComponent<GlitchEffectConfig> = {
	type: 'glitch',
	Component: GlitchEffectWrapper,
	SettingsComponent: GlitchEffectConfigForm,
	defaultConfig: {
		enabled: true,
		intensity: 0.1,
		frequency: 0.05,
		duration: 0.2,
		visibleOnHover: true,
		triggerOnHover: false,
		randomTrigger: false,
		randomFrequency: 0.1,
		sliceCount: 10,
		sliceOffset: 5,
		colorShiftAmount: 0.1,
		noiseIntensity: 0.2,
		scanlineEffect: true,
		distortionType: 'digital',
		blendMode: 'overlay',
		stopAfterSeconds: 2,
		affectContent: true,
		rgbShiftEnabled: true,
		brightnessNoise: 0.1,
		staticNoise: 0.05,
		layerIndex: 5,
	},
	getServerActions: () => ({
		getConfig: getGlitchEffectConfig,
		updateConfig: updateGlitchEffectConfig,
		deleteConfig: deleteGlitchEffectConfig,
	}),
};

// Exportaciones adicionales
export { GlitchEffectLayer } from './glitch-effect-layer';
export { GlitchEffectConfigForm } from './glitch-effect-config-form';
export {
	getGlitchEffectConfig,
	updateGlitchEffectConfig,
	deleteGlitchEffectConfig,
} from './actions/glitch-effect-config.action';
export type { GlitchEffectConfig } from './actions/glitch-effect-config.action';
