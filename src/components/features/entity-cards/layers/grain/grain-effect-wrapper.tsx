'use client';

import { memo, useMemo } from 'react';
import type { LayerComponentProps } from '../layer-plugin-system';
import type { GrainConfig } from './actions/grain-config.action';
import { GrainEffectLayer } from './grain-effect-layer';

/**
 * Componente wrapper para adaptar la capa de efecto Grain al sistema de plugins.
 * Esta capa añade un efecto de grano que simula texturas de papel o película.
 *
 * @param props - Propiedades del componente según la interfaz LayerComponentProps
 * @returns Componente GrainEffectLayer o null si está deshabilitado
 */
export const GrainEffectWrapper = memo(function GrainEffectWrapper({
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

	// Combinar configuración - memoizado para evitar recálculos innecesarios
	const mergedConfig = useMemo(() => {
		return { ...defaultConfig, ...config };
	}, [config]);

	// Si no está habilitado, no renderizar nada
	if (!mergedConfig.enabled) {
		return null;
	}

	// Convertir configuración al formato esperado por GrainEffectLayer
	const grainOptions = useMemo(() => ({
		intensity: mergedConfig.intensity,
		density: mergedConfig.size, // Mapeo de 'size' a 'density' para compatibilidad
		animated: mergedConfig.animated || false,
		animationSpeed: mergedConfig.speed || 5,
		noise: mergedConfig.colorMode === 'color' ? 'digital' : 'film', // Mapeo de modo de color a tipo de ruido
		contrast: 1.2, // Valor por defecto
		opacity: mergedConfig.opacity || 0.5,
		visibleOnHover: false,
		layerIndex: 2,
	}), [mergedConfig]);

	return (
		<GrainEffectLayer
			isExploded={isExploded}
			isHovered={isHovered}
			activeLayer={activeLayer}
			getExplodeLayerTransform={getExplodeLayerTransform}
			options={grainOptions}
			data-testid="grain-effect-wrapper"
		/>
	);
});

export default GrainEffectWrapper;
