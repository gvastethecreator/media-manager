'use client';

/**
 * 🪝 Hook para gestionar capas en tarjetas de entidad
 *
 * Este hook proporciona una interfaz para gestionar las capas
 * aplicadas a una tarjeta de entidad.
 */

import { useCallback, useEffect, useState } from 'react';
import {
    type EntityCardLayerSystemConfig,
    entityCardPropsToLayerConfig,
    getEntityLayerConfig,
    layerConfigToEntityCardProps,
    mergeLayerConfigs,
    saveEntityTypeLayerConfig,
} from './entity-card-layer-adapter';
import { useLayerPlugin } from './layers/layer-plugin-system';

/**
 * Opciones para el hook useEntityCardLayers
 */
export interface UseEntityCardLayersOptions {
	/**
	 * Tipo de entidad (image, album, folder, etc.)
	 */
	entityType: string;

	/**
	 * ID de la entidad (opcional)
	 */
	entityId?: string;

	/**
	 * Propiedades iniciales de la tarjeta
	 */
	initialProps?: Record<string, unknown>;

	/**
	 * Configuración inicial de capas (opcional)
	 */
	initialLayerConfig?: Partial<EntityCardLayerSystemConfig>;

	/**
	 * Si es true, guarda automáticamente los cambios en localStorage
	 */
	autoSave?: boolean;
}

/**
 * Resultado del hook useEntityCardLayers
 */
export interface UseEntityCardLayersResult {
	/**
	 * Configuración de capas
	 */
	layerConfig: EntityCardLayerSystemConfig;

	/**
	 * Propiedades derivadas para la tarjeta de entidad
	 */
	cardProps: Record<string, unknown>;

	/**
	 * Actualiza la configuración de capas
	 */
	updateLayerConfig: (config: Partial<EntityCardLayerSystemConfig>) => void;

	/**
	 * Actualiza la configuración de una capa específica
	 */
	updateLayerSettings: (layerId: string, settings: Record<string, unknown>) => void;

	/**
	 * Toggle de una capa (activar/desactivar)
	 */
	toggleLayer: (layerId: string, enabled: boolean) => void;

	/**
	 * Reordena las capas
	 */
	reorderLayers: (layerIds: string[]) => void;

	/**
	 * Resetea la configuración a los valores por defecto
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
	entityId,
	initialProps = {},
	initialLayerConfig = {},
	autoSave = false,
}: UseEntityCardLayersOptions): UseEntityCardLayersResult {
	// Obtener el plugin de capas
	const { getRegisteredLayers, getNextLayerIndex } = useLayerPlugin();

	// Inicializar configuración
	const getInitialConfig = useCallback(() => {
		// Obtener configuración base para el tipo de entidad
		const baseConfig = getEntityLayerConfig(entityType);

		// Convertir propiedades iniciales a configuración de capas
		const propsConfig = entityCardPropsToLayerConfig(entityType, initialProps);

		// Fusionar configuraciones
		return mergeLayerConfigs(mergeLayerConfigs(baseConfig, propsConfig), initialLayerConfig);
	}, [entityType, initialProps, initialLayerConfig]);

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
		(layerId: string, settings: Record<string, unknown>) => {
			setLayerConfig((prev) => {
				const newConfig = {
					...prev,
					layers: {
						...prev.layers,
						[layerId]: {
							...(prev.layers[layerId] || {}),
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
		(layerId: string, enabled: boolean) => {
			setLayerConfig((prev) => {
				const currentLayer = prev.layers[layerId] || {};
				const newEnabled = enabled;

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
		const newLayers: Record<string, Record<string, unknown>> = { ...layerConfig.layers };
		let hasChanges = false;

		// Comprobar cada capa registrada
		for (const layerId of Object.keys(registeredLayers)) {
			if (!newLayers[layerId]) {
				// Si la capa no tiene configuración, crear una por defecto
				newLayers[layerId] = {
					enabled: layerId === 'base' || layerId === 'content',
					layer: layerId,
					layerIndex: getNextLayerIndex(newLayers),
				};
				hasChanges = true;
			}
		}

		// Actualizar la configuración si se encontraron cambios
		if (hasChanges) {
			setLayerConfig((prev) => ({
				...prev,
				layers: newLayers,
			}));
		}
	}, [getRegisteredLayers, getNextLayerIndex, layerConfig.layers]);

	// Reordenar capas
	const reorderLayers = useCallback((layerIds: string[]) => {
		setLayerConfig((prev) => {
			const newLayers = layerIds.reduce(
				(acc, layerId) => {
					acc[layerId] = prev.layers[layerId];
					return acc;
				},
				{} as Record<string, Record<string, unknown>>
			);

			return {
				...prev,
				layers: newLayers,
			};
		});
	}, []);

	return {
		layerConfig,
		cardProps,
		updateLayerConfig,
		updateLayerSettings,
		toggleLayer,
		reorderLayers,
		resetToDefaults,
		saveConfig,
	};
}
