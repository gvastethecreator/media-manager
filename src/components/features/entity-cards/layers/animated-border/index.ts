'use client';

import * as React from 'react';
import type { LayerComponent } from '../layer-plugin-system';
import { deleteAnimatedBorderConfig, getAnimatedBorderConfig, updateAnimatedBorderConfig } from './actions/animated-border-config.action';
import AnimatedBorderEffectLayerWithStyles, { type AnimatedBorderConfig } from './animated-border-effect-layer';
import { AnimatedBorderSettings } from './animated-border-settings';

// Registrar la capa para el sistema de plugins
export const animatedBorderLayer: LayerComponent<AnimatedBorderConfig> = {
  type: 'animated-border',
  Component: AnimatedBorderEffectLayerWithStyles,
  SettingsComponent: AnimatedBorderSettings,
  defaultConfig: {
    enabled: true,
    width: 2,
    color: '#ffffff',
    secondaryColor: '#00ffff',
    animationSpeed: 1,
    animationType: 'flow',
    glowAmount: 5,
    opacity: 0.8,
    glowColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
    layerIndex: 5,
  },
  getServerActions: () => ({
    getConfig: getAnimatedBorderConfig,
    updateConfig: updateAnimatedBorderConfig,
    deleteConfig: deleteAnimatedBorderConfig,
  }),
};

// Exportaciones adicionales
export { default as AnimatedBorderEffectLayer } from './animated-border-effect-layer';
export { AnimatedBorderSettings } from './animated-border-settings';
export * from './actions/animated-border-config.action';
export type { AnimatedBorderConfig } from './actions/animated-border-config.action';