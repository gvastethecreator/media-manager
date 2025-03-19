'use client';

/**
 * 🎨 Implementación de capa para filtros visuales
 *
 * Este archivo define la implementación de la capa de filtros siguiendo
 * la interfaz LayerImplementation definida en el sistema de capas.
 */

import { SlidersHorizontal } from 'lucide-react';
import type { LayerImplementation } from '../types';
import type { FilterConfig } from './actions/filter-config.action';
import { deleteFilterConfig, getFilterConfig, updateFilterConfig } from './actions/filter-config.action';
import { FilterEffectLayer } from './filter-effect-layer';
import { FilterSettings } from './filter-settings';

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
	preset: 'none',
	customCSS: '',
};

/**
 * Implementación de la capa de filtros
 */
export const filterLayerImplementation: LayerImplementation = {
	// Identificador único de la capa
	type: 'filter',

	// Nombre amigable para mostrar en la UI
	name: 'Filtros',

	// Descripción de la funcionalidad
	description: 'Aplica filtros y efectos visuales a la tarjeta',

	// Categoría a la que pertenece
	category: 'effects',

	// Configuración por defecto
	defaultConfig,

	// Icono para representar la capa en la UI
	icon: <SlidersHorizontal size={16} />,

	// Tipos de entidad compatibles
	compatibleEntityTypes: ['image', 'album', 'folder', 'tag', 'collection'],

	// Componente para renderizar la capa
	render: ({ config, isHovered, isActive }) => {
		return (
			<FilterEffectLayer
				config={config as FilterConfig}
				isHovered={isHovered || false}
				isActive={isActive || false}
			/>
		);
	},

	// Componente para configurar la capa
	Settings: ({ config, onChange, entityType, entityId }) => {
		return (
			<FilterSettings
				entityType={entityType}
				entityId={entityId}
				initialConfig={config as FilterConfig}
				onConfigChange={(newConfig: FilterConfig) => onChange(newConfig)}
			/>
		);
	},

	// Funciones de servidor asociadas a la capa
	serverActions: {
		getConfig: getFilterConfig,
		updateConfig: updateFilterConfig,
		deleteConfig: deleteFilterConfig,
	},
};

export default filterLayerImplementation;