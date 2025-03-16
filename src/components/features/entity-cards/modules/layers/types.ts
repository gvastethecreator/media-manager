/**
 * 🌈 Tipos para el módulo de capas
 */

import { LayerConfig, LayerSystemConfig } from '../../layers/types';
import { CardOptions } from '../../types/card-settings-types';

/**
 * Configuración del módulo de capas
 */
export interface LayersModuleConfig {
	layerSystem: LayerSystemConfig;
	layerConfigs: Record<string, LayerConfig>;
}

/**
 * Props para el módulo de capas
 */
export interface LayersModuleProps {
	initialConfig?: Partial<LayersModuleConfig>;
	onChange?: (config: LayersModuleConfig) => void;
	cardOptions?: CardOptions;
	onCardOptionsChange?: (options: Partial<CardOptions>) => void;
}

/**
 * Props para el panel de capas
 */
export interface LayersPanelProps {
	config: LayersModuleConfig;
	onChange: (config: LayersModuleConfig) => void;
	cardOptions?: CardOptions;
	onCardOptionsChange?: (options: Partial<CardOptions>) => void;
}

/**
 * Contexto para el sistema de capas
 */
export interface LayersContextType {
	config: LayersModuleConfig;
	updateConfig: (config: Partial<LayersModuleConfig>) => void;
	toggleLayerEnabled: (layerType: string, enabled: boolean) => void;
	updateLayerConfig: (layerType: string, config: Partial<LayerConfig>) => void;
	updateLayerOrder: (newOrder: string[]) => void;
	resetToDefaults: () => void;
}

/**
 * Valores por defecto para el módulo de capas
 */
export const DEFAULT_LAYERS_CONFIG: LayersModuleConfig = {
	layerSystem: {
		enabledLayers: {
			container: true,
			border: true,
			glow: true,
			scanlines: true,
			holographic: true,
			grain: true,
			content: true,
			header: true,
			description: true,
			footer: true,
			image: true,
			texture: true,
			metadata: true,
			stats: true,
		},
		layerOrder: [
			'container',
			'border',
			'glow',
			'scanlines',
			'holographic',
			'grain',
			'content',
			'header',
			'description',
			'image',
			'texture',
			'metadata',
			'stats',
			'footer',
		],
		explode: {
			enabled: false,
			distance: 1.5,
			perspective: 800,
		},
		animateOnHover: true,
	},
	layerConfigs: {},
};
