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

// Función auxiliar para validar la configuración
const validateHolographicConfig = (config: Partial<HolographicConfig>): string[] => {
	const errors: string[] = [];

	if (config.intensity !== undefined && (config.intensity < 0 || config.intensity > 1)) {
		errors.push('La intensidad debe estar entre 0 y 1');
	}
	if (config.speed !== undefined && (config.speed < 0.1 || config.speed > 5)) {
		errors.push('La velocidad debe estar entre 0.1 y 5');
	}
	if (config.scale !== undefined && (config.scale < 0.1 || config.scale > 3)) {
		errors.push('La escala debe estar entre 0.1 y 3');
	}
	if (config.angle !== undefined && (config.angle < -180 || config.angle > 180)) {
		errors.push('El ángulo debe estar entre -180 y 180 grados');
	}
	if (config.colors && (!Array.isArray(config.colors) || config.colors.length < 1)) {
		errors.push('Debe especificar al menos un color');
	}

	return errors;
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

		// Validar configuración
		const errors = validateHolographicConfig(config as HolographicConfig);
		if (errors.length > 0) {
			console.warn('Errores en la configuración holográfica:', errors);
			// Usar configuración por defecto si hay errores
			config = defaultConfig;
		}

		// Combinar la configuración por defecto con la configuración personalizada
		const effectConfig = {
			...defaultConfig,
			...config
		} as HolographicConfig;

		// Optimización de rendimiento
		const memoizedConfig = React.useMemo(() => effectConfig, [JSON.stringify(effectConfig)]);
		const memoizedMousePosition = React.useMemo(() => mousePosition, [mousePosition?.x, mousePosition?.y]);

		// Pasar la configuración al componente de efecto
		return (
			<HolographicEffectWrapper
				config={memoizedConfig}
				isHovered={!!isHovered}
				isExploded={!!isExploded}
				activeLayer={isActive ? 'holographic' : null}
				getExplodeLayerTransform={getExplodeTransform}
				mousePosition={memoizedMousePosition}
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