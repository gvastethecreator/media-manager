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
import { scanlinesLayer } from './scanlines';
// Importar las capas que ya están implementadas pero no registradas
// Estas importaciones se activarán a medida que se implementen las capas
// import { pixelateLayer } from './pixelate';
// import { shaderLayer } from './shaders';

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

    // Capas pendientes de implementación
    // registerLayer(pixelateLayer);
    // registerLayer(shaderLayer);

    // No es necesario una función de limpieza porque las capas deben estar
    // disponibles mientras la aplicación esté en ejecución
  }, [registerLayer]);

  // Este componente no renderiza nada
  return null;
}