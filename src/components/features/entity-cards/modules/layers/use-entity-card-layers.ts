'use client';

/**
 * 🪝 Hook para gestionar capas en tarjetas de entidad
 *
 * Este hook proporciona una interfaz para gestionar las capas
 * aplicadas a una tarjeta de entidad.
 */

import { useCallback, useEffect, useState } from 'react';
import {
	EntityCardLayerSystemConfig,
	entityCardPropsToLayerConfig,
	getEntityLayerConfig,
	layerConfigToEntityCardProps,
	mergeLayerConfigs,
	saveEntityTypeLayerConfig,
} from './entity-card-layer-adapter';
import { useLayerPlugin } from './layer-plugin-system';

export interface UseEntityCardLayersOptions {
	/**
	 * Tipo de entidad (image, folder, album, tag, etc.)
	 */
	entityType: string;

	/**
	 * Propiedades iniciales de la tarjeta
	 */
	initialProps?: Record<string, any>;

	/**
	 * Configuración inicial de capas (opcional)
	 */
	initialConfig?: Partial<EntityCardLayerSystemConfig>;

	/**
	 * Si es true, guarda automáticamente los cambios en localStorage
	 */
	autoSave?: boolean;
}

export interface UseEntityCardLayersResult {
	/**
	 * Configuración actual de capas
	 */
	layerConfig: EntityCardLayerSystemConfig;

	/**
	 * Propiedades derivadas para la tarjeta de entidad
	 */
	cardProps: Record<string, any>;

	/**
	 * Actualiza la configuración de capas
	 */
	updateLayerConfig: (config: Partial<EntityCardLayerSystemConfig>) => void;

	/**
	 * Actualiza la configuración de una capa específica
	 */
	updateLayerSettings: (layerId: string, settings: any) => void;

	/**
	 * Activa o desactiva una capa
	 */
	toggleLayer: (layerId: string, enabled?: boolean) => void;

	/**
	 * Restablece la configuración a los valores predeterminados
	 */
	resetToDefaults: () => void;

	/**
	 * Guarda la configuración actual
	 */
	saveConfig: () => void;
}

/**
 * Hook para gestionar capas en tarjetas de entidad
 */
export function useEntityCardLayers({
	entityType,
	initialProps = {},
	initialConfig = {},
	autoSave = false,
}: UseEntityCardLayersOptions): UseEntityCardLayersResult {
	// Obtener el plugin de capas
	const { getRegisteredLayers } = useLayerPlugin();

	// Inicializar configuración
	const getInitialConfig = useCallback(() => {
		// Obtener configuración base para el tipo de entidad
		const baseConfig = getEntityLayerConfig(entityType);

		// Convertir propiedades iniciales a configuración de capas
		const propsConfig = entityCardPropsToLayerConfig(entityType, initialProps);

		// Fusionar configuraciones
		return mergeLayerConfigs(mergeLayerConfigs(baseConfig, propsConfig), initialConfig);
	}, [entityType, initialProps, initialConfig]);

	// Estado para la configuración de capas
	const [layerConfig, setLayerConfig] = useState<EntityCardLayerSystemConfig>(getInitialConfig());

	// Derivar propiedades para la tarjeta
	const cardProps = layerConfigToEntityCardProps(layerConfig);

	// Actualizar configuración de capas
	const updateLayerConfig = useCallback(
		(config: Partial<EntityCardLayerSystemConfig>) => {
			setLayerConfig((prev) => {
				const newConfig = mergeLayerConfigs(prev, config);

				// Guardar automáticamente si está habilitado
				if (autoSave) {
					saveEntityTypeLayerConfig(entityType, newConfig);
				}

				return newConfig;
			});
		},
		[entityType, autoSave]
	);

	// Actualizar configuración de una capa específica
	const updateLayerSettings = useCallback(
		(layerId: string, settings: any) => {
			setLayerConfig((prev) => {
				const newConfig = {
					...prev,
					layers: {
						...prev.layers,
						[layerId]: {
							...prev.layers[layerId],
							...settings,
						},
					},
				};

				// Guardar automáticamente si está habilitado
				if (autoSave) {
					saveEntityTypeLayerConfig(entityType, newConfig);
				}

				return newConfig;
			});
		},
		[entityType, autoSave]
	);

	// Activar o desactivar una capa
	const toggleLayer = useCallback(
		(layerId: string, enabled?: boolean) => {
			setLayerConfig((prev) => {
				const currentLayer = prev.layers[layerId] || {};
				const newEnabled = enabled !== undefined ? enabled : !currentLayer.enabled;

				const newConfig = {
					...prev,
					layers: {
						...prev.layers,
						[layerId]: {
							...currentLayer,
							enabled: newEnabled,
						},
					},
				};

				// Guardar automáticamente si está habilitado
				if (autoSave) {
					saveEntityTypeLayerConfig(entityType, newConfig);
				}

				return newConfig;
			});
		},
		[entityType, autoSave]
	);

	// Restablecer a valores predeterminados
	const resetToDefaults = useCallback(() => {
		const defaultConfig = getEntityLayerConfig(entityType);
		setLayerConfig(defaultConfig);

		// Guardar automáticamente si está habilitado
		if (autoSave) {
			saveEntityTypeLayerConfig(entityType, defaultConfig);
		}
	}, [entityType, autoSave]);

	// Guardar configuración actual
	const saveConfig = useCallback(() => {
		saveEntityTypeLayerConfig(entityType, layerConfig);
	}, [entityType, layerConfig]);

	// Efecto para inicializar capas registradas
	useEffect(() => {
		const registeredLayers = getRegisteredLayers();

		// Asegurarse de que todas las capas registradas tengan una entrada en la configuración
		const newLayers: Record<string, any> = { ...layerConfig.layers };
		let hasChanges = false;

		for (const layer of registeredLayers) {
			// Si la capa no tiene configuración, inicializarla con valores predeterminados
			if (!newLayers[layer.id]) {
				newLayers[layer.id] = {
					...layer.defaultConfig,
					enabled: false, // Por defecto, las capas nuevas están desactivadas
				};
				hasChanges = true;
			}
		}

		// Actualizar configuración si hay cambios
		if (hasChanges) {
			setLayerConfig((prev) => ({
				...prev,
				layers: newLayers,
			}));
		}
	}, [getRegisteredLayers]);

	return {
		layerConfig,
		cardProps,
		updateLayerConfig,
		updateLayerSettings,
		toggleLayer,
		resetToDefaults,
		saveConfig,
	};
}
