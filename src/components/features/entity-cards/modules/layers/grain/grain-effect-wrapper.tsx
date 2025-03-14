'use client';

import * as React from 'react';
import type { LayerComponentProps } from '../layer-plugin-system';
import type { GrainConfig } from './actions/grain-config.action';
import { GrainEffectLayer } from './grain-effect-layer';

/**
 * Componente wrapper para adaptar la capa de efecto Grain al sistema de plugins.
 * Esta capa añade un efecto de grano que simula texturas de papel o película.
 */
export function GrainEffectWrapper({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: LayerComponentProps<GrainConfig>) {
	// Valores por defecto
	const defaultConfig: GrainConfig = {
		enabled: true,
		intensity: 0.15,
		size: 1,
		animated: false,
		speed: 5,
		colorMode: 'monochrome',
		opacity: 0.5,
		blend: 'overlay',
		seed: 42,
	};

	// Combinar configuración
	const mergedConfig = { ...defaultConfig, ...config };

	// Si no está habilitado, no renderizar nada
	if (!mergedConfig.enabled) {
		return null;
	}

	// Convertir configuración al formato esperado por GrainEffectLayer
	const grainOptions = {
		intensity: mergedConfig.intensity,
		size: mergedConfig.size,
		animated: mergedConfig.animated || false,
		animationSpeed: mergedConfig.speed || 5,
		colorMode: mergedConfig.colorMode || 'monochrome',
		opacity: mergedConfig.opacity || 0.5,
		blendMode: mergedConfig.blend || 'overlay',
		seed: mergedConfig.seed || 42,
		visibleOnHover: false,
		layerIndex: 2,
	};

	return (
		<GrainEffectLayer
			isExploded={isExploded}
			isHovered={isHovered}
			activeLayer={activeLayer}
			getExplodeLayerTransform={getExplodeLayerTransform}
			options={grainOptions}
		/>
	);
}

export default GrainEffectWrapper;
