/**
 * 🎨 Implementación de capa para filtros visuales
 * @module FilterLayerImplementation
 */

'use client';

import { SlidersHorizontal } from 'lucide-react';
import * as React from 'react';
import type { LayerImplementation } from '../types';
import type { FilterConfig } from './actions/filter-config.action';
import { deleteFilterConfig, getFilterConfig, updateFilterConfig } from './actions/filter-config.action';
import { FilterEffectLayer } from './filter-effect-layer';
import { FilterSettings } from './filter-settings';
import { useVisualEffects } from './use-visual-effects';

/**
 * Tipos de presets disponibles para filtros
 */
export type FilterPreset = 'none' | 'vintage' | 'cool' | 'warm' | 'bw' | 'sepia' | 'sharp' | 'soft' | 'dramatic' | 'muted' | 'vibrant';

/**
 * Configuración por defecto de la capa de filtros
 */
const defaultConfig: FilterConfig = {
	enabled: true,
	layerIndex: 15,
	brightness: 100,
	contrast: 100,
	saturation: 100,
	hue: 0,
	blur: 0,
	grayscale: 0,
	sepia: 0,
	invert: 0,
	opacity: 100,
	preset: 'none' as FilterPreset,
	customCSS: '',
};

/**
 * Implementación de la capa de filtros
 * @type {LayerImplementation}
 */
export const filterLayerImplementation: LayerImplementation = {
	type: 'filter',
	name: 'Filtros',
	description: 'Aplica filtros y efectos visuales a la tarjeta',
	category: 'effects',
	defaultConfig,
	icon: <SlidersHorizontal size={16} />,
	compatibleEntityTypes: ['image', 'album', 'folder', 'tag', 'collection'],

	render: React.memo(({ config, isHovered, isActive }) => {
		// Procesar y validar configuración
		const processedConfig = React.useMemo(() => ({
			...defaultConfig,
			...(config as FilterConfig),
		}), [config]);

		// Usar hook personalizado para efectos visuales
		const { getFilterStyle } = useVisualEffects();

		// Calcular estilos de filtro
		const filterStyle = React.useMemo(() =>
			getFilterStyle(processedConfig),
			[getFilterStyle, processedConfig]);

		return (
			<FilterEffectLayer
				config={processedConfig}
				isHovered={isHovered || false}
				isActive={isActive || false}
				style={filterStyle}
			/>
		);
	}),

	Settings: React.memo(({ config, onChange, entityType, entityId }) => {
		// Manejar cambios de configuración de forma optimizada
		const handleConfigChange = React.useCallback((newConfig: FilterConfig) => {
			onChange(newConfig);
		}, [onChange]);

		return (
			<FilterSettings
				entityType={entityType}
				entityId={entityId}
				initialConfig={config as FilterConfig}
				onConfigChange={handleConfigChange}
			/>
		);
	}),

	// Funciones de servidor asociadas a la capa
	serverActions: {
		getConfig: getFilterConfig,
		updateConfig: updateFilterConfig,
		deleteConfig: deleteFilterConfig,
	},
};

// Exportar tipos y configuración por defecto
export { defaultConfig as defaultFilterConfig };
export type { FilterConfig };
export default filterLayerImplementation;