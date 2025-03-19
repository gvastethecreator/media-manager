'use client';

/**
 * 📺 Implementación de capa para scanlines usando la nueva interfaz
 *
 * Este archivo define la implementación de la capa de líneas de escaneo siguiendo
 * la interfaz LayerImplementation definida en el sistema de capas.
 */

import type { LayerImplementation } from '../types';

// Importamos los componentes directamente
import type { LayerComponent } from '../layer-plugin-system';
import ScanlinesEffectLayerWithStyles from './scanlines-effect-layer';
import { ScanlinesSettings } from './scanlines-settings';

// Simulamos las acciones del servidor, en un entorno real deberían implementarse
const getScanlinesConfig = async (entityType, entityId) => {
	return {
		success: true,
		message: 'Configuración obtenida',
		data: defaultConfig
	};
};

const updateScanlinesConfig = async (entityType, config, entityId) => {
	return {
		success: true,
		message: 'Configuración actualizada',
		data: config
	};
};

const deleteScanlinesConfig = async (entityType, entityId) => {
	return {
		success: true,
		message: 'Configuración eliminada',
		data: {}
	};
};

/**
 * Configuración por defecto de la capa de scanlines
 */
const defaultConfig = {
	enabled: true,
	opacity: 0.2,
	spacing: 4,
	color: 'rgba(255,255,255,0.15)',
	animate: false,
	direction: 'horizontal',
	visibleOnHover: false,
	layerIndex: 3,
};

/**
 * Definición del componente de capa para el sistema de plugins
 */
export const ScanlinesLayer: LayerComponent = {
	type: 'scanlines',
	Component: ScanlinesEffectLayerWithStyles,
	SettingsComponent: ScanlinesSettings,
	defaultConfig,
	getServerActions: () => ({
		getConfig: getScanlinesConfig,
		updateConfig: updateScanlinesConfig,
		deleteConfig: deleteScanlinesConfig,
	}),
};

/**
 * Implementación de la capa de scanlines
 */
export const scanlinesLayerImplementation: LayerImplementation = {
	// Identificador único de la capa
	type: 'scanlines',

	// Nombre amigable para mostrar en la UI
	name: 'Líneas de Escaneo',

	// Descripción de la funcionalidad
	description: 'Añade efecto retro de líneas de escaneo a la tarjeta',

	// Categoría a la que pertenece
	category: 'effects',

	// Configuración por defecto
	defaultConfig,

	// Icono para representar la capa en la UI
	icon: {
		type: 'lucide-icon',
		name: 'scanline',
		properties: { size: 16 }
	},

	// Tipos de entidad compatibles
	compatibleEntityTypes: ['image', 'folder', 'album', 'tag', 'collection'],

	// Función para renderizar la capa
	render: (props) => (
		<ScanlinesEffectLayerWithStyles
			{...props}
			isExploded={props.isExploded || false}
			isHovered={props.isHovered || false}
			activeLayer={props.isActive ? 'scanlines' : null}
			getExplodeLayerTransform={(index) => ({
				transform: `translateZ(${index * 10}px)`,
				zIndex: 100 - index,
			})}
			config={props.config}
		/>
	),

	// Componente para configurar la capa
	Settings: (props) => (
		<ScanlinesSettings
			{...props}
			config={props.config}
			onChange={props.onChange}
		/>
	)
};

// Funciones de servidor asociadas a la capa
export const scanlinesServerActions = {
	getConfig: getScanlinesConfig,
	updateConfig: updateScanlinesConfig,
	deleteConfig: deleteScanlinesConfig
};

// Exportaciones adicionales
export * from './actions';
export { ScanlinesEffectLayerWithStyles } from './scanlines-effect-layer';
export { ScanlinesSettings } from './scanlines-settings';

