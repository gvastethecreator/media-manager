'use client';

import type { LayerComponent } from '../layer-plugin-system';
import type { PatternConfig } from './actions/pattern-config.action';
import { deletePatternConfig, getPatternConfig, updatePatternConfig } from './actions/pattern-config.action';
import PatternEffectLayerWithStyles from './pattern-effect-layer';
import { PatternSettings } from './pattern-settings';
import type { LayerImplementation } from '../types';

// Exportar componentes base
export { BasePattern } from './base-pattern';
export { DotsPattern } from './dots-pattern';
export { GridPattern } from './grid-pattern';
export { HexagonPattern } from './hexagon-pattern';
export { LinesPattern } from './lines-pattern';

// Registrar la capa para el sistema de plugins
export const patternLayer: LayerComponent<PatternConfig> = {
	type: 'pattern',
	Component: PatternEffectLayerWithStyles,
	SettingsComponent: PatternSettings,
	defaultConfig: {
		enabled: true,
		patternType: 'dots',
		color: 'rgba(255, 255, 255, 0.15)',
		opacity: 0.15,
		size: 5,
		spacing: 10,
		rotation: 0,
		visibleOnHover: false,
		animated: false,
		animationSpeed: 1,
		blendMode: 'normal',
		density: 1,
		strokeWidth: 1,
		layerIndex: 2,
	},
	getServerActions: () => ({
		getConfig: getPatternConfig,
		updateConfig: updatePatternConfig,
		deleteConfig: deletePatternConfig,
	}),
};

// Exportar componentes principales y acciones
export { deletePatternConfig, getPatternConfig, updatePatternConfig } from './actions/pattern-config.action';
export type { PatternConfig } from './actions/pattern-config.action';
export { default as PatternEffectLayer } from './pattern-effect-layer';
export { PatternSettings } from './pattern-settings';

export * from './actions/pattern-config.action';
export * from './components/pattern-layer';
export * from './components/pattern-settings';
export * from './hooks/use-pattern';

/**
 * 🔄 Implementación de la capa de patrones
 */
export const patternImplementation: LayerImplementation = {
	type: 'pattern',
	name: 'Patrón',
	description: 'Añade un patrón decorativo a la tarjeta',
	defaultConfig: {
		enabled: true,
		layerIndex: 2,
		patternType: 'dots',
		size: 10,
		color: '#000000',
		opacity: 0.5,
		blendMode: 'overlay',
	},
	render: () => null, // Stub implementation
	settings: () => null, // Stub implementation
	icon: 'grid',
};

