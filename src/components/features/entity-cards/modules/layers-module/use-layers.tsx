'use client';

/**
 * 🪝 Hook y proveedor para gestionar el sistema de capas
 *
 * Este archivo implementa el hook useLayers para acceder al sistema de capas,
 * así como el proveedor LayersProvider para inicializar y gestionar el estado.
 */

import { createContext, useContext, useState } from 'react';
import type { LayerConfig, LayerImplementation, LayerSystemConfig } from '../../layers/types';
import { DEFAULT_LAYERS_CONFIG, type LayersContextType, type LayersModuleConfig } from './types';

// Crear contexto para el sistema de capas
const LayersContext = createContext<LayersContextType | null>(null);

/**
 * Hook para acceder al sistema de capas
 */
export function useLayers(): LayersContextType {
	const context = useContext(LayersContext);
	if (!context) {
		throw new Error('useLayers debe ser usado dentro de un LayersProvider');
	}
	return context;
}

/**
 * Fusiona profundamente dos objetos
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
	const output = { ...target };

	if (isObject(target) && isObject(source)) {
		for (const key of Object.keys(source)) {
			const sourceValue = source[key as keyof typeof source];
			if (isObject(sourceValue)) {
				if (!(key in target)) {
					Object.assign(output, { [key]: sourceValue });
				} else {
					// Crear una copia segura con el tipo correcto para la recursión
					const targetValue = target[key as keyof T] as unknown;
					if (isObject(targetValue)) {
						output[key as keyof T] = deepMerge(
							targetValue as Record<string, unknown>,
							sourceValue as Record<string, unknown>
						) as T[keyof T];
					} else {
						Object.assign(output, { [key]: sourceValue });
					}
				}
			} else {
				Object.assign(output, { [key]: sourceValue });
			}
		}
	}

	return output;
}

// Función auxiliar para comprobar si es un objeto
function isObject(item: unknown): item is Record<string, unknown> {
	return item !== null && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Proveedor para el sistema de capas
 */
export function LayersProvider({
	children,
	initialConfig,
}: {
	children: React.ReactNode;
	initialConfig?: Partial<LayersModuleConfig>;
}) {
	// Estado para la configuración del sistema de capas
	const [config, setConfig] = useState<LayersModuleConfig>(() => {
		// Crear una copia base para asegurar que tenemos todas las propiedades necesarias
		const baseConfig: LayersModuleConfig = { ...DEFAULT_LAYERS_CONFIG };

		// Fusionar con la configuración inicial si existe
		if (initialConfig) {
			return deepMerge(baseConfig, initialConfig);
		}

		return baseConfig;
	});

	// Actualizar la configuración
	const updateConfig = (newConfig: Partial<LayersModuleConfig>) => {
		setConfig(prevConfig => {
			// Crear una copia base del prevConfig para garantizar tipo correcto
			const baseConfig: LayersModuleConfig = { ...prevConfig };
			return deepMerge(baseConfig, newConfig);
		});
	};

	// Alternar habilitación de una capa
	const toggleLayerEnabled = (layerType: string, enabled: boolean) => {
		updateConfig({
			layerSystem: {
				...config.layerSystem, // Mantener otras propiedades requeridas
				enabledLayers: {
					...config.layerSystem.enabledLayers,
					[layerType]: enabled,
				},
			},
		});
	};

	// Actualizar configuración de una capa específica
	const updateLayerConfig = (layerType: string, layerConfig: Partial<LayerConfig>) => {
		updateConfig({
			layerConfigs: {
				...config.layerConfigs,
				[layerType]: {
					...(config.layerConfigs[layerType] || {}),
					...layerConfig,
				},
			},
		});
	};

	// Actualizar orden de capas
	const updateLayerOrder = (newOrder: string[]) => {
		updateConfig({
			layerSystem: {
				...config.layerSystem, // Mantener otras propiedades requeridas
				layerOrder: newOrder,
			},
		});
	};

	// Registrar una nueva capa en el sistema
	const registerLayer = (layer: LayerImplementation) => {
		// Validar entrada
		if (!layer || !layer.type) {
			console.error('Error al registrar capa: datos de capa inválidos', layer);
			return;
		}

		// Registrar la capa
		setConfig(prevConfig => {
			// Verificar si la capa ya está registrada
			if (prevConfig.layers[layer.type]) {
				// Si ya está registrada, simplemente devolver la configuración actual
				return prevConfig;
			}

			// Actualizar el estado con la nueva capa
			const updatedConfig = {
				...prevConfig,
				layers: {
					...prevConfig.layers,
					[layer.type]: layer,
				},
				// Asegurar que tengamos una configuración para esta capa
				layerConfigs: {
					...prevConfig.layerConfigs,
					[layer.type]: prevConfig.layerConfigs[layer.type] || layer.defaultConfig || {
						enabled: true,
						layerIndex: Object.keys(prevConfig.layers).length,
					},
				},
			};

			// Actualizar el orden si es necesario
			const layerOrder = [...(prevConfig.layerSystem.layerOrder || [])];
			if (!layerOrder.includes(layer.type)) {
				layerOrder.push(layer.type);
				updatedConfig.layerSystem = {
					...updatedConfig.layerSystem,
					layerOrder,
				};
			}

			// Habilitar la capa por defecto si no está ya en enabledLayers
			if (updatedConfig.layerSystem.enabledLayers === undefined) {
				updatedConfig.layerSystem.enabledLayers = {};
			}

			if (updatedConfig.layerSystem.enabledLayers[layer.type] === undefined) {
				updatedConfig.layerSystem.enabledLayers = {
					...updatedConfig.layerSystem.enabledLayers,
					[layer.type]: true,
				};
			}

			return updatedConfig;
		});
	};

	// Eliminar todas las capas registradas
	const unregisterAllLayers = () => {
		setConfig(prevConfig => ({
			...prevConfig,
			layers: {},
		}));
	};

	// Reiniciar a valores predeterminados
	const resetToDefaults = () => {
		// Mantener las capas registradas pero reiniciar la configuración
		setConfig({
			...DEFAULT_LAYERS_CONFIG,
			layers: config.layers,
		});
	};

	return (
		<LayersContext.Provider
			value={{
				config,
				updateConfig,
				toggleLayerEnabled,
				updateLayerConfig,
				updateLayerOrder,
				resetToDefaults,
				registerLayer,
				unregisterAllLayers,
			}}
		>
			{children}
		</LayersContext.Provider>
	);
}

/**
 * 🌈 Adaptador de cardOptions a LayersModuleConfig
 */
export function adaptCardOptionsToLayersConfig(cardOptions?: Record<string, unknown>): Partial<LayersModuleConfig> {
	if (!cardOptions) return {};

	// Extraer configuraciones relevantes con valores por defecto seguros
	const layerSystem = cardOptions.layerSystem as LayerSystemConfig || {
		enabled: true,
		renderStrategy: 'stacked',
		compositionMode: 'normal',
		layerSpacing: 2,
		enabledLayers: {},
		layerOrder: []
	};

	// Asegurar que layerSystem.layerSpacing existe
	if (layerSystem && !('layerSpacing' in layerSystem)) {
		// Usar asignación segura con casting para evitar el error de tipado
		(layerSystem as LayerSystemConfig & { layerSpacing?: number }).layerSpacing = 2;
	}

	// Extraer configuraciones de capas individuales
	const layerConfigs = cardOptions.layerConfigs as Record<string, LayerConfig> || {};

	// Extraer capas (puede ser undefined en algunas configuraciones)
	const layers = cardOptions.layers as Record<string, LayerImplementation> || {};

	return {
		layerSystem,
		layerConfigs,
		layers
	};
}

/**
 * 🌈 Adaptador de LayersModuleConfig a cardOptions
 */
export function adaptLayersConfigToCardOptions(config: LayersModuleConfig): Record<string, unknown> {
	return {
		layerSystem: config.layerSystem,
		layerConfigs: config.layerConfigs,
		layers: config.layers,
	};
}
