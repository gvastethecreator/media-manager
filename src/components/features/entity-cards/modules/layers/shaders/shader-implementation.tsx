import { SparklesIcon } from 'lucide-react';
import type { LayerImplementation } from '../types';
import { ShaderLayer } from './components/shader-layer';
import { defaultShaderConfig, type ShaderConfig } from './shader-config-schema';

/**
 * 🌟 Implementación de la capa de shaders
 */
export const shaderImplementation: LayerImplementation<ShaderConfig> = {
	type: 'shader',
	name: 'Shader',
	description: 'Aplica efectos visuales avanzados usando shaders WebGL',
	icon: SparklesIcon,
	defaultConfig: defaultShaderConfig,
	render: ShaderLayer,
	presets: [
		{
			name: 'Onda Suave',
			config: {
				...defaultShaderConfig,
				type: 'wave',
				intensity: 0.5,
				speed: 1.0,
				blendMode: 'screen',
				animated: true,
			},
		},
		{
			name: 'Distorsión',
			config: {
				...defaultShaderConfig,
				type: 'distortion',
				intensity: 0.7,
				speed: 0.8,
				blendMode: 'overlay',
				animated: true,
			},
		},
		{
			name: 'Holograma',
			config: {
				...defaultShaderConfig,
				type: 'hologram',
				intensity: 0.6,
				speed: 1.2,
				blendMode: 'screen',
				animated: true,
				color: '#00c3ff',
			},
		},
		{
			name: 'Partículas',
			config: {
				...defaultShaderConfig,
				type: 'particle',
				intensity: 0.5,
				speed: 1.5,
				blendMode: 'screen',
				animated: true,
			},
		},
		{
			name: 'Base Colorida',
			config: {
				...defaultShaderConfig,
				type: 'base',
				intensity: 0.4,
				speed: 0.5,
				blendMode: 'lighten',
				animated: true,
			},
		},
	],
};