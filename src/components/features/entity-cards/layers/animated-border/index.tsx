'use client';

/**
 * 🔵 Implementación de capa de borde animado
 *
 * Este archivo define la implementación de la capa de borde animado siguiendo
 * la interfaz LayerImplementation definida en el sistema de capas.
 */

import { Zap } from 'lucide-react';
import { type LayerImplementation, type LayerRenderProps, type LayerSettingsProps } from '../types';
import AnimatedBorderEffectLayerWithStyles, { type AnimatedBorderConfig } from './animated-border-effect-layer';
import { AnimatedBorderSettings } from './animated-border-settings';

/**
 * Configuración por defecto para la capa de borde animado
 */
const defaultConfig: AnimatedBorderConfig = {
	enabled: true,
	layerIndex: 10,
	width: 2,
	color: '#ffffff',
	secondaryColor: '#00ffff',
	animationSpeed: 1,
	animationType: 'flow',
	glowAmount: 5,
	opacity: 0.8,
	glowColor: 'rgba(255, 255, 255, 0.5)',
	borderRadius: 4
};

// Función auxiliar para transformar los layers en modo explotado
const getExplodeTransform = (index: number): React.CSSProperties => {
	const offset = 20 * index;
	return {
		transform: `translate3d(${offset}px, ${offset}px, 0)`,
		zIndex: 10 + index,
	};
};

/**
 * Implementación de la capa de borde animado
 */
export const animatedBorderLayerImplementation: LayerImplementation = {
	// Identificador único de la capa
	type: 'animated-border',

	// Nombre amigable para mostrar en la UI
	name: 'Borde Animado',

	// Descripción de la funcionalidad
	description: 'Añade bordes con efectos de animación y brillo a la tarjeta',

	// Categoría a la que pertenece
	category: 'effects',

	// Configuración por defecto
	defaultConfig,

	// Icono para representar la capa en la UI
	icon: <Zap size={16} />,

	// Tipos de entidad compatibles
	compatibleEntityTypes: ['image', 'folder', 'album', 'tag', 'collection', 'character'],

	// Función para renderizar la capa
	render: (props: LayerRenderProps) => {
		const { config, isHovered, isActive, isExploded, entityType, entityId, mousePosition } = props;

		const effectConfig = {
			...defaultConfig,
			...config
		} as AnimatedBorderConfig;

		// Pasar la configuración al componente de efecto
		return (
			<AnimatedBorderEffectLayerWithStyles
				config={effectConfig}
				isHovered={!!isHovered}
				isExploded={!!isExploded}
				activeLayer={isActive ? 'animated-border' : null}
				entityType={entityType}
				entityId={entityId}
				mousePosition={mousePosition || { x: 0, y: 0 }}
				getExplodeLayerTransform={getExplodeTransform}
			/>
		);
	},

	// Componente para configurar la capa
	Settings: (props: LayerSettingsProps) => {
		const { config, onChange, entityType, entityId } = props;
		const typedConfig = config as unknown as AnimatedBorderConfig;

		return (
			<AnimatedBorderSettings
				entityType={entityType}
				entityId={entityId}
				initialConfig={typedConfig}
				onConfigUpdate={(newConfig) => onChange(newConfig as any)}
			/>
		);
	}
};

/**
 * Exportar el componente por defecto
 */
export default animatedBorderLayerImplementation;
