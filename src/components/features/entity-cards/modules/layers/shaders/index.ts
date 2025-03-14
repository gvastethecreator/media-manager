export { BaseShader } from './base-shader';
export { DistortionShader } from './distortion-shader';
export { ParticleShader } from './particle-shader';
export { WaveShader } from './wave-shader';
export { HologramShader } from './hologram-shader';
export { ShaderEffectLayer } from './shader-effect-layer';
export * from './shader-config-schema';
export { ShaderSettings } from './shader-settings';

import {
  deleteShaderConfig,
  getShaderConfig,
  updateShaderConfig,
} from '@/app/actions/shader-config.action';
import type { LayerComponent } from '../layer-plugin-system';
import { defaultShaderConfig } from './shader-config-schema';
import { ShaderEffectLayer } from './shader-effect-layer';
import { ShaderSettings } from './shader-settings';

// Definición de la capa de shader para el sistema de plugins
export const shaderLayer: LayerComponent = {
  type: 'shader',
  Component: ShaderEffectLayer,
  defaultConfig: defaultShaderConfig,
  SettingsComponent: ShaderSettings,
  getServerActions: () => ({
    getConfig: getShaderConfig,
    updateConfig: updateShaderConfig,
    deleteConfig: deleteShaderConfig,
  }),
};
