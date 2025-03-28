'use client';

import { useState } from 'react';
import type { BaseLayerConfig } from '../layer-config-base';

// Capa disponible para el panel de capas
interface AvailableLayer {
	type: string;
	name: string;
	description?: string;
	defaultConfig: BaseLayerConfig;
	icon?: string;
}

// Simulación de capas disponibles para pruebas
const mockLayers: AvailableLayer[] = [
	{
		type: 'background',
		name: 'Fondo',
		description: 'Fondo de la tarjeta',
		defaultConfig: {
			enabled: true,
			layerIndex: 0,
		},
		icon: 'square',
	},
	{
		type: 'image',
		name: 'Imagen',
		description: 'Capa de imagen principal',
		defaultConfig: {
			enabled: true,
			layerIndex: 1,
		},
		icon: 'image',
	},
	{
		type: 'pattern',
		name: 'Patrón',
		description: 'Patrones decorativos',
		defaultConfig: {
			enabled: true,
			layerIndex: 2,
		},
		icon: 'grid',
	},
	{
		type: 'grain',
		name: 'Grano',
		description: 'Efecto de grano para textura',
		defaultConfig: {
			enabled: true,
			layerIndex: 3,
		},
		icon: 'dot-pattern',
	},
];

/**
 * Hook para gestionar el sistema de capas en el panel de configuración
 */
export function useLayersSystem(options: any) {
	const [activeLayerConfig, setActiveLayerConfig] = useState<string | null>(null);

	// En una implementación real, estas capas vendrían de un registro global
	// o serían pasadas como prop
	const availableLayers = mockLayers;

	/**
	 * Alternar el estado habilitado/deshabilitado de una capa
	 */
	const toggleLayerEnabled = (
		layerType: string,
		enabled: boolean,
		currentOptions: any,
		onChange: (options: any) => void
	) => {
		const currentLayerConfigs = currentOptions.layerConfigs || {};
		const currentLayerConfig = currentLayerConfigs[layerType] || {};

		onChange({
			...currentOptions,
			layerConfigs: {
				...currentLayerConfigs,
				[layerType]: {
					...currentLayerConfig,
					enabled,
				},
			},
		});
	};

	return {
		availableLayers,
		activeLayerConfig,
		setActiveLayerConfig,
		toggleLayerEnabled,
	};
}
