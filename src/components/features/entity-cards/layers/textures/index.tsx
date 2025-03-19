'use client';

/**
 * 🧩 Implementación de capa para textura usando la nueva interfaz
 *
 * Este archivo define la implementación de la capa de textura siguiendo
 * la interfaz LayerImplementation definida en el sistema de capas.
 */

import type { Grid3X3 } from 'lucide-react';
import type { TextureEffectLayer } from './texture-effect-layer';
import type { LayerImplementation } from '../types';
import type { TextureConfig } from './texture-layer-schema';

// Importamos los componentes y acciones necesarios
import type { TextureAdvancedOptions } from './texture-advanced-options';

// Simulamos las acciones del servidor, en un entorno real deberían implementarse
const getTextureConfig = async (entityType: string, entityId?: string) => {
	return {
		success: true,
		message: 'Configuración obtenida',
		data: defaultConfig
	};
};

const updateTextureConfig = async (entityType: string, config: TextureConfig, entityId?: string) => {
	return {
		success: true,
		message: 'Configuración actualizada',
		data: config
	};
};

const deleteTextureConfig = async (entityType: string, entityId?: string) => {
	return {
		success: true,
		message: 'Configuración eliminada',
		data: {}
	};
};

/**
 * Configuración por defecto de la capa de textura
 */
const defaultConfig = {
	enabled: true,
	layerIndex: 2,
	textureType: 'noise',
	color: 'rgba(255, 255, 255, 0.1)',
	opacity: 0.25,
	scale: 1,
	density: 0.5,
	rotation: 0,
	flipX: false,
	flipY: false,
	animated: false,
	animationSpeed: 1,
	visibleOnHover: false,
	customPattern: ''
} as TextureConfig;

/**
 * Implementación de la capa de textura
 */
export const textureLayerImplementation: LayerImplementation = {
	// Identificador único de la capa
	type: 'texture',

	// Nombre amigable para mostrar en la UI
	name: 'Textura',

	// Descripción de la funcionalidad
	description: 'Añade patrones y texturas personalizables a la tarjeta',

	// Categoría a la que pertenece
	category: 'effects',

	// Configuración por defecto
	defaultConfig,

	// Icono para representar la capa en la UI
	icon: <Grid3X3 size={16} />,

	// Tipos de entidad compatibles
	compatibleEntityTypes: ['image', 'folder', 'album', 'tag', 'collection'],

	// Función para renderizar la capa
	render: ({ config, isHovered, mousePosition, isActive, isExploded, entityType }) => {
		return (
			<TextureEffectLayer
				isExploded={isExploded || false}
				isHovered={isHovered || false}
				mousePosition={mousePosition || { x: 50, y: 50 }}
				activeLayer={isActive ? 'texture' : null}
				getExplodeLayerTransform={(index) => ({
					transform: `translateZ(${index * 10}px)`,
					zIndex: 100 - index,
				})}
				config={config as TextureConfig}
				entityType={entityType}
				entityId={undefined}
			/>
		);
	},

	// Componente para configurar la capa
	Settings: ({ config, onChange, entityType, entityId }) => {
		return (
			<TextureAdvancedOptions
				config={config as TextureConfig}
				onChange={(newConfig) => onChange(newConfig)}
			/>
		);
	}
};

// Funciones de servidor asociadas a la capa
export const textureServerActions = {
	getConfig: getTextureConfig,
	updateConfig: updateTextureConfig,
	deleteConfig: deleteTextureConfig
};

// Exportaciones adicionales
export { TextureEffectLayer } from './texture-effect-layer';
export { TextureAdvancedOptions } from './texture-advanced-options';
