/**
 * Sistema de capas para tarjetas de entidades
 * Proporciona hooks y utilidades para trabajar con capas de tarjetas
 */

import { useState } from 'react';
import type { LayersConfig } from '../../../../types/unified-card-types';

/**
 * Hook para gestionar el sistema de capas
 */
export function useLayersSystem({ layers }: { layers?: LayersConfig }) {
	const [config, setConfig] = useState(layers || {});

	// Obtener el orden de capas según la configuración
	const getLayers = () => {
		// Orden predeterminado si no hay uno definido explícitamente
		const defaultOrder = ['background', 'texture', 'grain', 'holographic', 'content', 'border', 'scanlines', 'glow'];

		// Usar orden personalizado o predeterminado
		const order = config.order || defaultOrder;

		// Filtrar capas deshabilitadas
		return order.filter((layer) => {
			// Capas específicas
			if (layer === 'background' && config.background?.enabled === false) return false;
			if (layer === 'frame' && config.frame?.enabled === false) return false;
			if (layer === 'content' && config.content?.enabled === false) return false;
			return true;
		});
	};

	// Actualizar la configuración de capas
	const updateLayersConfig = (newConfig: Partial<LayersConfig>) => {
		setConfig((current) => ({
			...current,
			...newConfig,
		}));
	};

	// Establecer la configuración de una capa específica
	const setLayerConfig = (layerId: string, layerConfig: Record<string, unknown>) => {
		setConfig((current) => ({
			...current,
			[layerId]: {
				...((current[layerId as keyof LayersConfig] as Record<string, unknown>) || {}),
				...layerConfig,
			},
		}));
	};

	return {
		layersSystem: {
			getLayers,
			updateLayersConfig,
			setLayerConfig,
			config,
		},
	};
}
