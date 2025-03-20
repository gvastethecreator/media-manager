'use client';

import type { LayerComponent } from '../layer-plugin-system';
import type { GrainConfig } from './actions/grain-config.action';
import { deleteGrainConfig, getGrainConfig, updateGrainConfig } from './actions/grain-config.action';
import GrainEffectWrapper from './grain-effect-wrapper';
import { GrainSettings } from './grain-settings';

// Registrar la capa para el sistema de plugins
export const grainLayer: LayerComponent<GrainConfig> = {
	type: 'grain',
	Component: GrainEffectWrapper,
	SettingsComponent: GrainSettings,
	defaultConfig: {
		enabled: true,
		intensity: 0.15,
		size: 1,
		animated: false,
		speed: 5,
		colorMode: 'monochrome',
		opacity: 0.5,
		blend: 'overlay',
		seed: 42,
	},
	getServerActions: () => ({
		getConfig: getGrainConfig,
		updateConfig: updateGrainConfig,
		deleteConfig: deleteGrainConfig,
	}),
};

// Exportaciones adicionales
export { deleteGrainConfig, getGrainConfig, updateGrainConfig } from './actions/grain-config.action';
export type { GrainConfig } from './actions/grain-config.action';
export { GrainEffectLayer } from './grain-effect-layer';
export { GrainSettings } from './grain-settings';

// 🌾 Exportación de componentes principales
export { GrainConfig } from './components/grain-config';
export { GrainLayer } from './components/grain-layer';

// 🎛️ Exportación de store y tipos
export { useGrainStore } from './actions/grain-config.action';
export type { GrainConfig } from './actions/grain-config.action';

// 🛠️ Exportación de utilidades
export { generateGrainPattern } from './utils/grain-utils';

export * from './actions/grain-config.action';
export * from './components/grain-layer';
export * from './components/grain-settings';
export { grainImplementation } from './grain-implementation';

