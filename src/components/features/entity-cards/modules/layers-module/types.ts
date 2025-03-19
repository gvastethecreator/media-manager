/**
 * 🌈 Tipos para el módulo de capas
 */

import type { LayerConfig, LayerImplementation, LayerSystemConfig } from '../../layers/types';
import type { CardOptions } from '../../types/card-settings-types';

/**
 * Configuración del sistema de capas extendida
 * Extiende la configuración básica de LayerSystemConfig de layers/types.ts
 */
export interface LayersModuleConfig {
	/**
	 * Configuración del sistema de capas
	 */
	layerSystem: LayerSystemConfig & {
		/**
		 * Espaciado entre capas cuando se usa renderStrategy 'stacked'
		 */
		layerSpacing?: number;
	};

	/**
	 * Configuraciones individuales de cada capa
	 */
	layerConfigs: Record<string, LayerConfig>;

	/**
	 * Capas registradas en el sistema
	 */
	layers: Record<string, LayerImplementation>;
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

	/**
	 * Registrar una nueva capa en el sistema
	 */
	registerLayer: (layer: LayerImplementation) => void;

	/**
	 * Eliminar todas las capas registradas
	 */
	unregisterAllLayers: () => void;
}

/**
 * Valores por defecto para el módulo de capas
 */
export const DEFAULT_LAYERS_CONFIG: LayersModuleConfig = {
	layerSystem: {
		enabled: true,
		renderStrategy: 'stacked',
		compositionMode: 'normal',
		layerSpacing: 2,
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
		options: {
			explode: {
				enabled: false,
				distance: 1.5,
				perspective: 800,
			},
			animateOnHover: true,
		}
	},
	layerConfigs: {},
	layers: {},
};
