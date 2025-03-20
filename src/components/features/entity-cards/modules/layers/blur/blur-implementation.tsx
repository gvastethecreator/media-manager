import type { LayerImplementation } from '@/types/entity-card';
import { BlurIcon } from 'lucide-react';
import { type BlurConfig, createDefaultBlurConfig } from './blur-schema';
import { BlurLayer } from './components/blur-layer';
import { BlurSettings } from './components/blur-settings';

/**
 * 🌫️ Implementación de la capa de desenfoque
 */
export const blurImplementation: LayerImplementation<BlurConfig> = {
	type: 'blur',
	name: 'Desenfoque',
	description: 'Aplica efectos de desenfoque a la imagen',
	icon: BlurIcon,
	defaultConfig: createDefaultBlurConfig(),
	render: BlurLayer,
	settings: BlurSettings,
	presets: [
		{
			name: 'Desenfoque Suave',
			config: {
				...createDefaultBlurConfig(),
				radius: 5,
				algorithm: 'gaussian',
				quality: 'high',
				preserveEdges: true,
				edgeThreshold: 30,
			},
		},
		{
			name: 'Desenfoque de Movimiento',
			config: {
				...createDefaultBlurConfig(),
				radius: 15,
				algorithm: 'motion',
				motion: {
					angle: 45,
					distance: 20,
				},
				animated: true,
				animationSpeed: 1,
			},
		},
		{
			name: 'Desenfoque Radial',
			config: {
				...createDefaultBlurConfig(),
				radius: 20,
				algorithm: 'radial',
				zone: {
					type: 'circle',
					center: { x: 0.5, y: 0.5 },
					radius: 0.3,
					feather: 0.1,
				},
			},
		},
		{
			name: 'Desenfoque de Zoom',
			config: {
				...createDefaultBlurConfig(),
				radius: 25,
				algorithm: 'zoom',
				zone: {
					type: 'circle',
					center: { x: 0.5, y: 0.5 },
					radius: 0.4,
					feather: 0.15,
				},
				animated: true,
				animationSpeed: 0.5,
			},
		},
		{
			name: 'Desenfoque Selectivo',
			config: {
				...createDefaultBlurConfig(),
				radius: 8,
				algorithm: 'box',
				zone: {
					type: 'rectangle',
					position: { x: 0.2, y: 0.2 },
					size: { width: 0.6, height: 0.6 },
					feather: 0.1,
				},
				preserveEdges: true,
				edgeThreshold: 40,
			},
		},
	],
};