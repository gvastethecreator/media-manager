'use client';

import * as React from 'react';
import type { LayerComponent } from '../layer-plugin-system';
import { deleteScanlinesConfig, getScanlinesConfig, updateScanlinesConfig } from './actions';
import ScanlinesEffectLayerWithStyles, { ScanlinesEffectLayer, type ScanlinesConfig } from './scanlines-effect-layer';
import { ScanlinesSettings } from './scanlines-settings';

// Registrar la capa para el sistema de plugins
export const scanlinesLayer: LayerComponent<ScanlinesConfig> = {
  type: 'scanlines',
  Component: ScanlinesEffectLayerWithStyles,
  SettingsComponent: ScanlinesSettings,
  defaultConfig: {
    enabled: true,
    opacity: 0.2,
    spacing: 4,
    color: 'rgba(255,255,255,0.15)',
    animate: false,
    direction: 'horizontal',
    visibleOnHover: false,
    layerIndex: 3,
  },
  getServerActions: () => ({
    getConfig: getScanlinesConfig,
    updateConfig: updateScanlinesConfig,
    deleteConfig: deleteScanlinesConfig,
  }),
};

// Exportaciones adicionales
export { ScanlinesEffectLayer } from './scanlines-effect-layer';
export { ScanlinesSettings } from './scanlines-settings';
export * from './actions';