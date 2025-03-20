export { BaseShader } from './base-shader';
export { DistortionShader } from './distortion-shader';
export { HologramShader } from './hologram-shader';
export { ParticleShader } from './particle-shader';
export * from './shader-config-schema';
export { ShaderEffectLayer } from './shader-effect-layer';
export { ShaderSettings } from './shader-settings';
export { WaveShader } from './wave-shader';

// Componentes
export { ShaderConfig } from './components/shader-config';
export { ShaderLayer } from './components/shader-layer';

// Store y tipos
export { useShaderStore } from './actions/shader-config.action';
export type { ShaderConfig, ShaderType } from './actions/shader-config.action';

// Utilidades
export { initializeShader, updateShaderUniforms } from './utils/shader-utils';

import { deleteShaderConfig, getShaderConfig, updateShaderConfig } from '@/app/actions/shader-config.action';
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
