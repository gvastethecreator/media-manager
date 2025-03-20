'use client';

import type { GlowEffectOptions } from '../../../../types/base-card-types';
import type { LayerComponent } from '../layer-plugin-system';
import { deleteGlowConfig, getGlowConfig, updateGlowConfig } from './actions';
import { GlowEffectLayer } from './glow-effect-layer';
import { GlowSettings } from './glow-settings';

// Registrar la capa para el sistema de plugins
export const glowLayer: LayerComponent<GlowEffectOptions> = {
	type: 'glow',
	Component: GlowEffectLayer,
	SettingsComponent: GlowSettings,
	defaultConfig: {
		enabled: true,
		intensity: 0.5,
		color: 'rgba(0, 153, 255, 0.35)',
		size: 100,
		blurAmount: 30,
		animationType: 'follow-mouse',
		pulseSpeed: 1.5,
		visibleOnHover: true,
		layerIndex: 4,
	},
	getServerActions: () => ({
		getConfig: getGlowConfig,
		updateConfig: updateGlowConfig,
		deleteConfig: deleteGlowConfig,
	}),
};

// Exportaciones adicionales
export * from './actions';
export { GlowEffectLayer } from './glow-effect-layer';
export { GlowSettings } from './glow-settings';

