'use client';

import { useLayerPlugin } from '@/components/features/entity-cards/layers/layer-plugin-system';
import { toastService } from '@/lib/services/toast.service';
import { useCallback, useState } from 'react';
import type { CardOptions } from '../../../types/card-settings-types';

/**
 * 🪝 Hook para gestionar el sistema de capas
 *
 * Proporciona funcionalidades para gestionar las capas, su configuración,
 * habilitación/deshabilitación y otras acciones relacionadas.
 *
 * @param cardOptions - Opciones actuales de la tarjeta
 * @returns Objeto con estado y funciones para manipular el sistema de capas
 */
export function useLayersSystem(cardOptions: CardOptions) {
	const { getLayers } = useLayerPlugin();
	const availableLayers = getLayers();

	// Estado para el diálogo de configuración de capas
	const [activeLayerConfig, setActiveLayerConfig] = useState<string | null>(null);

	// Obtener las configuraciones de capa actuales o inicializar
	const layerConfigs = cardOptions.layerConfigs || {};

	/**
	 * Resetea todas las capas a su configuración predeterminada
	 */
	const resetAllLayers = useCallback(() => {
		const defaultLayerConfigs = {};

		for (const layer of availableLayers) {
			defaultLayerConfigs[layer.type] = { ...layer.defaultConfig };
		}

		return defaultLayerConfigs;
	}, [availableLayers]);

	/**
	 * Actualiza la configuración de una capa específica
	 */
	const updateLayerConfig = useCallback(
		(
			layerType: string,
			config: Record<string, unknown>,
			cardOptions: CardOptions,
			onChange: (options: CardOptions) => void
		) => {
			onChange({
				...cardOptions,
				layerConfigs: {
					...cardOptions.layerConfigs,
					[layerType]: config,
				},
			});
		},
		[]
	);

	/**
	 * Habilita o deshabilita una capa específica
	 */
	const toggleLayerEnabled = useCallback(
		(layerType: string, enabled: boolean, cardOptions: CardOptions, onChange: (options: CardOptions) => void) => {
			const currentConfig = cardOptions.layerConfigs?.[layerType] ||
				availableLayers.find((l) => l.type === layerType)?.defaultConfig || { enabled: false, layerIndex: 0 };

			onChange({
				...cardOptions,
				layerConfigs: {
					...cardOptions.layerConfigs,
					[layerType]: {
						...currentConfig,
						enabled,
					},
				},
			});

			toastService.success(`Capa ${layerType} ${enabled ? 'habilitada' : 'deshabilitada'}`);
		},
		[availableLayers]
	);

	return {
		availableLayers,
		layerConfigs,
		activeLayerConfig,
		setActiveLayerConfig,
		resetAllLayers,
		updateLayerConfig,
		toggleLayerEnabled,
	};
}
