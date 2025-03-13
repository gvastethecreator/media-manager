'use client';

import * as React from 'react';
import type { LayerComponent } from '../layer-plugin-system';
import { deletePatternConfig, getPatternConfig, updatePatternConfig } from './actions/pattern-config.action';
import type { PatternConfig } from './actions/pattern-config.action';
import { BasePattern } from './base-pattern';
import { DotsPattern } from './dots-pattern';
import { GridPattern } from './grid-pattern';
import { HexagonPattern } from './hexagon-pattern';
import { LinesPattern } from './lines-pattern';
import PatternEffectLayerWithStyles from './pattern-effect-layer';
import { PatternSettings } from './pattern-settings';

// Exportar componentes base
export { BasePattern } from './base-pattern';
export { DotsPattern } from './dots-pattern';
export { GridPattern } from './grid-pattern';
export { HexagonPattern } from './hexagon-pattern';
export { LinesPattern } from './lines-pattern';

// Registrar la capa para el sistema de plugins
export const patternLayer: LayerComponent<PatternConfig> = {
  type: 'pattern',
  Component: PatternEffectLayerWithStyles,
  SettingsComponent: PatternSettings,
  defaultConfig: {
    enabled: true,
    patternType: 'dots',
    color: 'rgba(255, 255, 255, 0.15)',
    opacity: 0.15,
    size: 5,
    spacing: 10,
    rotation: 0,
    visibleOnHover: false,
    animated: false,
    animationSpeed: 1,
    blendMode: 'normal',
    density: 1,
    strokeWidth: 1,
    layerIndex: 2,
  },
  getServerActions: () => ({
    getConfig: getPatternConfig,
    updateConfig: updatePatternConfig,
    deleteConfig: deletePatternConfig,
  }),
};

// Exportar componentes principales y acciones
export { default as PatternEffectLayer } from './pattern-effect-layer';
export { PatternSettings } from './pattern-settings';
export { getPatternConfig, updatePatternConfig, deletePatternConfig } from './actions/pattern-config.action';
export type { PatternConfig } from './actions/pattern-config.action';
