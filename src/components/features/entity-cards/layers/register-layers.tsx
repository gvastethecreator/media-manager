'use client';

import { useEffect } from 'react';
import { useLayerPlugin } from './layer-plugin-system';

import { animatedBorderLayer } from './animated-border';
import { borderLayer } from './border';
import { chromaticAberrationLayer } from './chromatic-aberration';
import { filterLayer } from './filters';
import { glitchLayer } from './glitch';
// Importar todas las capas implementadas
import { glowLayer } from './glow';
import { grainLayer } from './grain';
import { holographicLayer } from './holographic';
import { noiseTextureLayer } from './noise-texture';
import { patternLayer } from './patterns';
import { pixelateLayer } from './pixelate';
import { scanlinesLayer } from './scanlines';
// Importar las capas que ya están implementadas pero no registradas
import { shaderLayer } from './shaders';
import { textureLayer } from './textures';

/**
 * Componente que registra automáticamente todas las capas disponibles en el sistema de plugins.
 * Debe ser incluido en la aplicación en un nivel alto para que las capas estén disponibles globalmente.
 */
export function RegisterLayers() {
	const { registerLayer } = useLayerPlugin();

	useEffect(() => {
		// Registrar todas las capas disponibles
		registerLayer(glowLayer);
		registerLayer(borderLayer);

		// Registrar las demás capas implementadas
		registerLayer(scanlinesLayer);
		registerLayer(animatedBorderLayer);
		registerLayer(chromaticAberrationLayer);
		registerLayer(glitchLayer);
		registerLayer(grainLayer);
		registerLayer(holographicLayer);
		registerLayer(noiseTextureLayer);
		registerLayer(filterLayer);
		registerLayer(patternLayer);
		registerLayer(pixelateLayer);

		// Registrar la capa de shader que ya está implementada
		registerLayer(shaderLayer);

		// Registrar la capa de textura
		registerLayer(textureLayer);

		// No es necesario una función de limpieza porque las capas deben estar
		// disponibles mientras la aplicación esté en ejecución
	}, [registerLayer]);

	// Este componente no renderiza nada
	return null;
}
