export * from './texture-manager';
export * from './texture-editor';
export * from './texture-list';
export * from './texture-preview';
export * from './pattern-selector';
export * from './texture-advanced-options';
export * from './texture-layer-schema';
export * from './texture-effect-layer';

import {
  deleteTextureConfig,
  getTextureConfig,
  updateTextureConfig,
} from '@/app/actions/texture-config.action';
import type { LayerComponent } from '../layer-plugin-system';
import { TextureEffectLayer } from './texture-effect-layer';
import { defaultTextureConfig } from './texture-layer-schema';

// Definición de la capa de textura para el sistema de plugins
export const textureLayer: LayerComponent = {
  type: 'texture',
  Component: TextureEffectLayer,
  defaultConfig: defaultTextureConfig,
  // No se define SettingsComponent por ahora, se puede añadir después
  getServerActions: () => ({
    getConfig: getTextureConfig,
    updateConfig: updateTextureConfig,
    deleteConfig: deleteTextureConfig,
  }),
};
