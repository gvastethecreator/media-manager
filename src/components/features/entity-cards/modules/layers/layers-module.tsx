'use client';

import { deepMerge } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { LayerPluginProvider } from '../../layers/layer-plugin-system';
import { RegisterLayers } from '../../layers/register-layers';
import { LayersPanel } from './layers-panel';
import { DEFAULT_LAYERS_CONFIG, type LayersModuleConfig, type LayersModuleProps } from './types';
import { LayersProvider, adaptLayersConfigToCardOptions } from './use-layers';

/**
 * 🌈 Módulo de capas para Entity Cards
 *
 * Este módulo permite gestionar las capas visuales que componen una tarjeta de entidad,
 * incluyendo su orden, visibilidad y configuraciones específicas.
 */
export function LayersModule({ initialConfig = {}, onChange, cardOptions, onCardOptionsChange }: LayersModuleProps) {
	const [config, setConfig] = useState<LayersModuleConfig>(
		() => deepMerge(DEFAULT_LAYERS_CONFIG, initialConfig) as LayersModuleConfig
	);

	// Actualizar la configuración cuando cambian las props
	useEffect(() => {
		setConfig((prevConfig) => deepMerge(prevConfig, initialConfig) as LayersModuleConfig);
	}, [initialConfig]);

	// Manejar cambios en la configuración
	const handleConfigChange = (newConfig: LayersModuleConfig) => {
		setConfig(newConfig);
		onChange?.(newConfig);

		// Si tenemos un manejador de cambios para cardOptions, actualizamos las opciones de la tarjeta
		if (onCardOptionsChange) {
			const updatedCardOptions = adaptLayersConfigToCardOptions(newConfig);
			onCardOptionsChange(updatedCardOptions);
		}
	};

	return (
		<LayersProvider initialConfig={config}>
			<LayerPluginProvider>
				<RegisterLayers />
				<div className="space-y-4">
					<LayersPanel
						config={config}
						onChange={handleConfigChange}
						cardOptions={cardOptions}
						onCardOptionsChange={onCardOptionsChange}
					/>
				</div>
			</LayerPluginProvider>
		</LayersProvider>
	);
}
