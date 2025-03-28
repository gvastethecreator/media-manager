'use client';

/**
 * 🌈 Implementación de capa de aberración cromática
 *
 * Este archivo define la implementación de la capa de aberración cromática
 * siguiendo la interfaz LayerImplementation definida en el sistema de capas.
 */

import { Zap } from 'lucide-react';
import type { LayerImplementation, LayerRenderProps, LayerSettingsProps } from '../types';
import ChromaticAberrationEffectLayer, { type ChromaticAberrationConfig } from './chromatic-aberration-effect-layer';
import { ChromaticAberrationSettings } from './chromatic-aberration-settings';

/**
 * Configuración por defecto para la capa de aberración cromática
 */
const defaultConfig: ChromaticAberrationConfig = {
	enabled: true,
	offset: 2,
	intensity: 0.5,
	redOffset: 2,
	greenOffset: 0,
	blueOffset: -2,
	visibleOnHover: true,
	quality: 'medium',
	mode: 'simple',
	layerIndex: 4,
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
 * Implementación de la capa de aberración cromática
 */
export const chromaticAberrationLayerImplementation: LayerImplementation = {
	// Identificador único de la capa
	type: 'chromatic-aberration',

	// Nombre amigable para mostrar en la UI
	name: 'Aberración Cromática',

	// Descripción de la funcionalidad
	description: 'Añade efecto de aberración cromática simulando distorsiones de lentes',

	// Categoría a la que pertenece
	category: 'effects',

	// Configuración por defecto
	defaultConfig,

	// Icono para representar la capa en la UI
	icon: <Zap size={16} />,

	// Tipos de entidad compatibles
	compatibleEntityTypes: ['image', 'folder', 'album', 'tag', 'collection'],

	// Función para renderizar la capa
	render: (props: LayerRenderProps) => {
		const { config, isHovered, isActive, isExploded, entityType, entityId, mousePosition } = props;

		const effectConfig = {
			...defaultConfig,
			...config,
		} as ChromaticAberrationConfig;

		// Pasar la configuración al componente de efecto
		return (
			<ChromaticAberrationEffectLayer
				config={effectConfig}
				isHovered={!!isHovered}
				isExploded={!!isExploded}
				activeLayer={isActive ? 'chromatic-aberration' : null}
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
		const typedConfig = config as unknown as ChromaticAberrationConfig;

		return (
			<ChromaticAberrationSettings
				entityType={entityType}
				entityId={entityId}
				initialConfig={typedConfig}
				onConfigUpdate={(newConfig) => onChange(newConfig as unknown as Record<string, unknown>)}
			/>
		);
	},
};

/**
 * Exportar el componente por defecto
 */
export default chromaticAberrationLayerImplementation;
