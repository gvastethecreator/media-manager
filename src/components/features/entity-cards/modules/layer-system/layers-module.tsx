'use client';

/**
 * 🌈 Módulo de capas para tarjetas de entidad
 *
 * Este módulo permite gestionar y configurar las capas de una tarjeta.
 * Proporciona una interfaz para visualizar, ordenar y personalizar cada capa.
 */

import { deepMerge } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import {
	adaptLayerSystemToEntityCard,
	type EntityCardLayerSystemConfig
} from './entity-card-layer-adapter';
import { RegisterAllLayers } from './layers';
import { LayersPanel } from './layers-panel';
import { LayerPluginProvider } from './layers/layer-plugin-system';
import { DEFAULT_LAYERS_CONFIG, type LayersModuleConfig, type LayersModuleProps } from './types';
import { LayersProvider } from './use-layers';

/**
 * Función para adaptar la configuración de capas a opciones de tarjeta
 */
function adaptLayersConfigToCardOptions(config: LayersModuleConfig) {
	// Primero convertimos a formato EntityCardLayerSystemConfig
	const entityCardConfig: EntityCardLayerSystemConfig = {
		layerSystem: config.layerSystem,
		layerConfigs: config.layerConfigs,
		// Preservar cualquier capa registrada como opcional
		layers: config.layers
	};

	// Luego utilizamos el adaptador existente para convertir a CardOptions
	return adaptLayerSystemToEntityCard(entityCardConfig);
}

/**
 * 🌈 Módulo de capas para Entity Cards
 *
 * Este módulo permite gestionar las capas visuales que componen una tarjeta de entidad,
 * incluyendo su orden, visibilidad y configuraciones específicas.
 */
export function LayersModule({ initialConfig = {}, onChange, cardOptions, onCardOptionsChange }: LayersModuleProps) {
	// Estado inicial optimizado con useMemo
	const initialMergedConfig = useMemo(() => {
		try {
			// Aseguramos una conversión segura usando un tipo intermedio
			return deepMerge({ ...DEFAULT_LAYERS_CONFIG }, initialConfig) as LayersModuleConfig;
		} catch (error) {
			console.error("Error merging layer configs:", error);
			return DEFAULT_LAYERS_CONFIG as LayersModuleConfig;
		}
	}, [initialConfig]);

	const [config, setConfig] = useState<LayersModuleConfig>(initialMergedConfig);

	// Actualizar la configuración cuando cambian las props
	useEffect(() => {
		try {
			setConfig((prevConfig) => {
				// Aseguramos una conversión segura usando un tipo intermedio
				const mergedConfig = deepMerge({ ...prevConfig }, initialConfig);
				return mergedConfig as LayersModuleConfig;
			});
		} catch (error) {
			console.error("Error updating layer configs:", error);
		}
	}, [initialConfig]);

	// Manejar cambios en la configuración
	const handleConfigChange = (newConfig: LayersModuleConfig) => {
		setConfig(newConfig);
		if (onChange) {
			onChange(newConfig);
		}

		// Si tenemos un manejador de cambios para cardOptions, actualizamos las opciones de la tarjeta
		if (onCardOptionsChange) {
			const updatedCardOptions = adaptLayersConfigToCardOptions(newConfig);
			onCardOptionsChange(updatedCardOptions);
		}
	};

	return (
		<LayersProvider initialConfig={config}>
			<LayerPluginProvider>
				<RegisterAllLayers />
				<div className="space-y-4">
					<LayersPanel
						config={config as unknown as EntityCardLayerSystemConfig}
						onChange={(newConfig: EntityCardLayerSystemConfig) => {
							// Convertir de vuelta a LayersModuleConfig
							handleConfigChange({
								layerSystem: newConfig.layerSystem,
								layerConfigs: newConfig.layerConfigs,
								layers: newConfig.layers || {},
							});
						}}
						cardOptions={cardOptions}
						onCardOptionsChange={onCardOptionsChange}
					/>
				</div>
			</LayerPluginProvider>
		</LayersProvider>
	);
}
