'use client';

import { useState, useCallback, useMemo, createContext, useContext } from 'react';
import { DEFAULT_LAYERS_CONFIG, LayersContextType, LayersModuleConfig } from './types';
import { deepMerge } from '@/lib/utils';
import { LayerConfig } from '../../layers/types';

/**
 * 🌈 Contexto para el sistema de capas
 */
const LayersContext = createContext<LayersContextType | null>(null);

/**
 * 🌈 Proveedor del contexto de capas
 */
export function LayersProvider({
	children,
	initialConfig = {},
}: {
	children: React.ReactNode;
	initialConfig?: Partial<LayersModuleConfig>;
}) {
	const [config, setConfig] = useState<LayersModuleConfig>(
		() => deepMerge(DEFAULT_LAYERS_CONFIG, initialConfig) as LayersModuleConfig
	);

	const updateConfig = useCallback((newConfig: Partial<LayersModuleConfig>) => {
		setConfig((prevConfig) => deepMerge(prevConfig, newConfig) as LayersModuleConfig);
	}, []);

	const toggleLayerEnabled = useCallback((layerType: string, enabled: boolean) => {
		setConfig((prevConfig) => ({
			...prevConfig,
			layerSystem: {
				...prevConfig.layerSystem,
				enabledLayers: {
					...prevConfig.layerSystem.enabledLayers,
					[layerType]: enabled,
				},
			},
		}));
	}, []);

	const updateLayerConfig = useCallback((layerType: string, layerConfig: Partial<LayerConfig>) => {
		setConfig((prevConfig) => ({
			...prevConfig,
			layerConfigs: {
				...prevConfig.layerConfigs,
				[layerType]: {
					...(prevConfig.layerConfigs[layerType] || {}),
					...layerConfig,
				},
			},
		}));
	}, []);

	const updateLayerOrder = useCallback((newOrder: string[]) => {
		setConfig((prevConfig) => ({
			...prevConfig,
			layerSystem: {
				...prevConfig.layerSystem,
				layerOrder: newOrder,
			},
		}));
	}, []);

	const resetToDefaults = useCallback(() => {
		setConfig(DEFAULT_LAYERS_CONFIG);
	}, []);

	const value = useMemo(
		() => ({
			config,
			updateConfig,
			toggleLayerEnabled,
			updateLayerConfig,
			updateLayerOrder,
			resetToDefaults,
		}),
		[config, updateConfig, toggleLayerEnabled, updateLayerConfig, updateLayerOrder, resetToDefaults]
	);

	return <LayersContext.Provider value={value}>{children}</LayersContext.Provider>;
}

/**
 * 🌈 Hook para usar el sistema de capas
 */
export function useLayers() {
	const context = useContext(LayersContext);

	if (!context) {
		throw new Error('useLayers debe ser usado dentro de un LayersProvider');
	}

	return context;
}

/**
 * 🌈 Adaptador de cardOptions a LayersModuleConfig
 */
export function adaptCardOptionsToLayersConfig(cardOptions?: any): Partial<LayersModuleConfig> {
	if (!cardOptions) return {};

	return {
		layerSystem: cardOptions.layerSystem || DEFAULT_LAYERS_CONFIG.layerSystem,
		layerConfigs: cardOptions.layerConfigs || DEFAULT_LAYERS_CONFIG.layerConfigs,
	};
}

/**
 * 🌈 Adaptador de LayersModuleConfig a cardOptions
 */
export function adaptLayersConfigToCardOptions(config: LayersModuleConfig): any {
	return {
		layerSystem: config.layerSystem,
		layerConfigs: config.layerConfigs,
	};
}
