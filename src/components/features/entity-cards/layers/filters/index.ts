'use client';

import * as React from 'react';
import type { LayerComponent } from '../layer-plugin-system';
import { deleteFilterConfig, getFilterConfig, updateFilterConfig } from './actions/filter-config.action';
import type { FilterConfig } from './actions/filter-config.action';
import FilterEffectLayerWithStyles from './filter-effect-layer';
import { FilterSettings } from './filter-settings';

// Exportar componentes base
export { BaseFilter } from './base-filter';
export { GlowFilter } from './glow-filter';
export { ShadowFilter } from './shadow-filter';
export { DistortionFilter } from './distortion-filter';

// Exportar utilidades de presets
export { applyFilterPreset, getAvailablePresets, filterPresets } from './filter-presets';
export type { FilterPreset } from './filter-presets';

// Registrar la capa para el sistema de plugins
export const filterLayer: LayerComponent<FilterConfig> = {
  type: 'filter',
  Component: FilterEffectLayerWithStyles,
  SettingsComponent: FilterSettings,
  defaultConfig: {
    enabled: true,
    visibleOnHover: false,
    opacity: 1,
    intensity: 1,
    glow: {
      enabled: false,
      color: 'rgba(0, 0, 255, 0.3)',
      radius: 10,
      intensity: 0.5,
    },
    shadow: {
      enabled: true,
      color: 'rgba(0, 0, 0, 0.3)',
      blur: 5,
      offsetX: 0,
      offsetY: 5,
      inset: false,
    },
    distortion: {
      enabled: false,
      type: 'wave',
      amount: 5,
      speed: 1,
      animated: false,
    },
    layerIndex: 5,
  },
  getServerActions: () => ({
    getConfig: getFilterConfig,
    updateConfig: updateFilterConfig,
    deleteConfig: deleteFilterConfig,
  }),
};

// Exportar componentes principales y acciones
export { default as FilterEffectLayer } from './filter-effect-layer';
export { FilterSettings } from './filter-settings';
export { getFilterConfig, updateFilterConfig, deleteFilterConfig } from './actions/filter-config.action';
export type { FilterConfig } from './actions/filter-config.action';
