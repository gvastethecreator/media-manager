'use client';

/**
 * 🔄 Componente para registrar todas las capas disponibles en el sistema
 *
 * Este componente centraliza el registro de todas las capas implementadas,
 * simplificando la integración con los componentes que utilizan el sistema de capas.
 */

import { useEffect } from 'react';
import { useLayerPlugin } from './layer-plugin-system';

// Importar todas las implementaciones de capas
import { animatedBorderLayerImplementation } from './animated-border';
import { borderLayerImplementation } from './border/border-layer-implementation';
import { chromaticAberrationLayerImplementation } from './chromatic-aberration';
import { contentLayerImplementation } from './content';
import { distortionLayerImplementation } from './distortion';
import { filterLayerImplementation } from './filters';
import { glitchLayer } from './glitch';
import { glowLayerImplementation } from './glow/glow-layer-implementation';
import { grainLayer } from './grain';
import { holographicLayer } from './holographic';
import { imageLayerImplementation } from './image';
import { metadataLayerImplementation } from './metadata';
import { noiseTextureLayer } from './noise-texture';
import { patternLayer } from './patterns';
import { pixelateLayer } from './pixelate';
import { scanlinesLayerImplementation } from './scanlines';
import { shaderLayer } from './shaders';
import { textureLayerImplementation } from './textures';

/**
 * Componente que registra automáticamente todas las capas disponibles
 */
export function RegisterAllLayers() {
	const { registerLayer, unregisterAllLayers } = useLayerPlugin();

	useEffect(() => {
		// Limpiar capas existentes
		unregisterAllLayers();

		// Registrar capas con la nueva implementación (LayerImplementation)
		registerLayer(animatedBorderLayerImplementation);
		registerLayer(borderLayerImplementation);
		registerLayer(chromaticAberrationLayerImplementation);
		registerLayer(contentLayerImplementation);
		registerLayer(distortionLayerImplementation);
		registerLayer(glowLayerImplementation);
		registerLayer(imageLayerImplementation);
		registerLayer(metadataLayerImplementation);
		registerLayer(scanlinesLayerImplementation);
		registerLayer(textureLayerImplementation);

		// Registrar capas con la implementación legacy
		registerLayer({
			type: 'filter',
			Component: filterLayerImplementation.Component,
			defaultConfig: filterLayerImplementation.defaultConfig,
		});

		registerLayer({
			type: 'glitch',
			Component: glitchLayer.Component,
			defaultConfig: glitchLayer.defaultConfig,
		});

		registerLayer({
			type: 'grain',
			Component: grainLayer.Component,
			defaultConfig: grainLayer.defaultConfig,
		});

		registerLayer({
			type: 'holographic',
			Component: holographicLayer.Component,
			defaultConfig: holographicLayer.defaultConfig,
		});

		registerLayer({
			type: 'noise-texture',
			Component: noiseTextureLayer.Component,
			defaultConfig: noiseTextureLayer.defaultConfig,
		});

		registerLayer({
			type: 'pattern',
			Component: patternLayer.Component,
			defaultConfig: patternLayer.defaultConfig,
		});

		registerLayer({
			type: 'pixelate',
			Component: pixelateLayer.Component,
			defaultConfig: pixelateLayer.defaultConfig,
		});

		registerLayer({
			type: 'shader',
			Component: shaderLayer.Component,
			defaultConfig: shaderLayer.defaultConfig,
		});

		// Limpiar al desmontar
		return () => {
			unregisterAllLayers();
		};
	}, [registerLayer, unregisterAllLayers]);

	// Este componente no renderiza nada
	return null;
}