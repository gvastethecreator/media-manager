'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BaseLayerConfig, LayerComponent } from './layers/layer-plugin-system';
import { LayerPluginProvider, useLayerPlugin } from './layers/layer-plugin-system';
import { RegisterLayers } from './layers/register-layers';
import type { CardOptions } from './types/card-settings-types';

// Propiedades para el EntityCardLayerWrapper
interface EntityCardLayerWrapperProps {
	title: string;
	description: string;
	onClick?: () => void;
	showVisualConfig?: boolean;
	visualOptions?: CardOptions;
	entityType: string;
	entityId?: string;
}

/**
 * Componente interno que maneja la carga de configuraciones
 */
function CardWithLayers({
	title,
	description,
	onClick,
	showVisualConfig,
	visualOptions = {},
	entityType,
	entityId,
}: EntityCardLayerWrapperProps) {
	const { getLayers } = useLayerPlugin();
	const [layerConfigs, setLayerConfigs] = useState<Record<string, BaseLayerConfig>>({});
	const [_isLoading, setIsLoading] = useState(true);

	// Función para cargar configuraciones de una capa específica
	const loadLayerConfig = useCallback(
		async (layer: LayerComponent) => {
			if (!layer.getServerActions) {
				return null;
			}

			const { getConfig } = layer.getServerActions();
			try {
				const response = await getConfig(entityType, entityId);
				if (response.success && response.data) {
					return {
						...response.data,
						enabled: response.data.enabled !== undefined ? response.data.enabled : true,
						layerIndex: response.data.layerIndex || layer.defaultConfig.layerIndex,
					};
				}
			} catch (error) {
				console.error(`Error al cargar configuración para ${layer.type}:`, error);
			}
			return null;
		},
		[entityType, entityId]
	);

	// Cargar configuraciones de capas al montar el componente
	useEffect(() => {
		const loadAllLayerConfigs = async () => {
			setIsLoading(true);

			try {
				const layers = getLayers();
				const configs: Record<string, BaseLayerConfig> = {};

				// Primero, configuraciones basadas en visualOptions para compatibilidad
				if (visualOptions.enableGlowEffect) {
					configs.glow = {
						enabled: true,
						layerIndex: 4,
						...visualOptions.glowOptions,
					};
				}

				if (visualOptions.enableScanlinesEffect) {
					configs.scanlines = {
						enabled: true,
						layerIndex: 5,
						...visualOptions.scanlinesOptions,
					};
				}

				if (visualOptions.enableHolographicEffect) {
					configs.holographic = {
						enabled: true,
						layerIndex: 3,
						...visualOptions.holographicOptions,
					};
				}

				if (visualOptions.enableBorderEffect) {
					configs.border = {
						enabled: true,
						layerIndex: 6,
						...visualOptions.borderOptions,
					};
				}

				if (visualOptions.enableGrainEffect) {
					configs.grain = {
						enabled: true,
						layerIndex: 2,
						...visualOptions.grainOptions,
					};
				}

				// Luego, intentar cargar desde server actions para cada capa
				for (const layer of layers) {
					if (layer.getServerActions) {
						const config = await loadLayerConfig(layer);
						if (config) {
							// Sobrescribir solo si no hay una configuración manual ya establecida
							if (!configs[layer.type]) {
								configs[layer.type] = config;
							}
						} else {
							// Si no hay configuración del servidor, usar la configuración por defecto
							// Solo si no hay una configuración manual ya establecida
							if (!configs[layer.type]) {
								configs[layer.type] = { ...layer.defaultConfig };
							}
						}
					} else if (!configs[layer.type]) {
						// Para capas sin server actions, usar la configuración por defecto
						configs[layer.type] = { ...layer.defaultConfig };
					}
				}

				setLayerConfigs(configs);
			} catch (error) {
				console.error('Error al cargar configuraciones de capas:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadAllLayerConfigs();
	}, [getLayers, loadLayerConfig, visualOptions]);

	// Utilizar EntityCard en lugar de BaseCard para compatibilidad
	return (
		<div className="w-full h-full">
			{/* Contenido que se verá desde BaseCard */}
			<div className="w-full h-full">
				{/* Aquí iría el contenido generado a partir de las configuraciones */}
				<div className="entity-card-content">
					<h3 className="entity-card-title">{title}</h3>
					{description && <p className="entity-card-description">{description}</p>}
				</div>
			</div>
		</div>
	);
}

/**
 * Componente que integra el sistema de capas con tarjetas de entidades.
 * Se encarga de:
 * 1. Cargar configuraciones de capas específicas para el tipo de entidad
 * 2. Proporcionar el contexto del sistema de capas
 * 3. Conectar con el BaseCard para renderizado
 */
export function EntityCardLayerWrapper(props: EntityCardLayerWrapperProps) {
	return (
		<LayerPluginProvider>
			<RegisterLayers />
			<CardWithLayers {...props} />
		</LayerPluginProvider>
	);
}
