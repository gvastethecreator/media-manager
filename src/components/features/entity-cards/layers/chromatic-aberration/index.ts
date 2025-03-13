'use client';

import * as React from 'react';
import { getChromaticAberrationConfig, updateChromaticAberrationConfig, deleteChromaticAberrationConfig } from './actions';
import ChromaticAberrationEffectLayer, { type ChromaticAberrationConfig } from './chromatic-aberration-effect-layer';
import { ChromaticAberrationSettings } from './chromatic-aberration-settings';
import type { LayerComponent } from '../layer-plugin-system';

// Registrar la capa para el sistema de plugins
export const chromaticAberrationLayer: LayerComponent<ChromaticAberrationConfig> = {
  type: 'chromatic-aberration',
  Component: ChromaticAberrationEffectLayer,
  SettingsComponent: ChromaticAberrationSettings,
  defaultConfig: {
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
  },
  getServerActions: () => ({
    getConfig: getChromaticAberrationConfig,
    updateConfig: updateChromaticAberrationConfig,
    deleteConfig: deleteChromaticAberrationConfig,
  }),
};

// Exportaciones adicionales
export { default as ChromaticAberrationEffectLayer } from './chromatic-aberration-effect-layer';
export { ChromaticAberrationSettings } from './chromatic-aberration-settings';
export * from './actions';