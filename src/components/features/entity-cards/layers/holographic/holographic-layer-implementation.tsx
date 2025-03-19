'use client';

/**
 * 🔮 Implementación de capa holográfica usando la nueva interfaz
 *
 * Este archivo define la implementación de la capa holográfica siguiendo
 * la interfaz LayerImplementation definida en el sistema de capas.
 */

import type React from 'react';
import type { LayerImplementation, LayerRenderProps, LayerSettingsProps } from '../types';
import type { HolographicConfig } from './actions/holographic-config.action';
import { HolographicEffectWrapper } from './holographic-effect-wrapper';
import { HolographicSettings } from './holographic-settings';

// Importamos función necesaria
import {
	deleteHolographicConfig,
	getHolographicConfig,
	updateHolographicConfig
} from './actions/holographic-config.action';

// Función auxiliar para transformaciones
const getExplodeTransform = (index: number): React.CSSProperties => {
	return {
		transform: `translateZ(${index * 10}px)`,
		zIndex: 100 - index,
	};
};

/**
 * Configuración por defecto de la capa holográfica
 */
const defaultConfig: HolographicConfig = {
	enabled: true,
	intensity: 0.7,
	pattern: 'rainbow',
	colors: ['rgba(255,0,128,0.8)', 'rgba(0,255,255,0.8)', 'rgba(128,0,255,0.8)'],
	speed: 1,
	angle: 45,
	scale: 1,
	blend: 'overlay',
	animated: true,
	interactiveMode: 'mouse',
};

/**
 * Implementación de la capa holográfica
 */
export const holographicLayerImplementation: LayerImplementation = {
	// Identificador único de la capa
	type: 'holographic',

	// Nombre amigable para mostrar en la UI
	name: 'Holográfico',

	// Descripción de la funcionalidad
	description: 'Añade efecto holográfico iridiscente a la tarjeta',

	// Categoría a la que pertenece
	category: 'effects',

	// Configuración por defecto
	defaultConfig,

	// Icono para representar la capa en la UI
	icon: {
		type: 'lucide-icon',
		name: 'triangle',
		properties: { size: 16 }
	},

	// Tipos de entidad compatibles
	compatibleEntityTypes: ['image', 'character', 'folder', 'album', 'tag', 'collection'],

	// Función para renderizar la capa
	render: (props: LayerRenderProps) => {
		const { config, isHovered, isActive, isExploded, mousePosition } = props;

		// Combinar la configuración por defecto con la configuración personalizada
		const effectConfig = {
			...defaultConfig,
			...config
		} as HolographicConfig;

		// Pasar la configuración al componente de efecto
		return (
			<HolographicEffectWrapper
				config={effectConfig}
				isHovered={!!isHovered}
				isExploded={!!isExploded}
				activeLayer={isActive ? 'holographic' : null}
				getExplodeLayerTransform={getExplodeTransform}
				mousePosition={mousePosition}
			/>
		);
	},

	// Componente para configurar la capa
	Settings: (props: LayerSettingsProps) => {
		const { config, onChange, entityType, entityId } = props;
		const typedConfig = config as unknown as HolographicConfig;

		return (
			<HolographicSettings
				entityType={entityType}
				entityId={entityId}
				initialConfig={typedConfig}
				onConfigUpdate={(newConfig) => onChange(newConfig as unknown as Record<string, unknown>)}
			/>
		);
	}
};

// Funciones de servidor asociadas a la capa
export const holographicServerActions = {
	getConfig: getHolographicConfig,
	updateConfig: updateHolographicConfig,
	deleteConfig: deleteHolographicConfig
};