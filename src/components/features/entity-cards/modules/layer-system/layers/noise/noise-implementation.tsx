import type { LayerImplementation } from '@/types/entity-card';
import { WavesIcon } from 'lucide-react';
import { NoiseLayer } from './components/noise-layer';
import { NoiseSettings } from './components/noise-settings';
import { createDefaultNoiseConfig, type NoiseConfig } from './noise-schema';

/**
 * 🌊 Implementación de la capa de ruido
 */
export const noiseImplementation: LayerImplementation<NoiseConfig> = {
	type: 'noise',
	name: 'Ruido',
	description: 'Aplica efectos de ruido procedural a la imagen',
	icon: WavesIcon,
	defaultConfig: createDefaultNoiseConfig(),
	render: NoiseLayer,
	settings: NoiseSettings,
	presets: [
		{
			name: 'Ruido Suave',
			config: {
				...createDefaultNoiseConfig(),
				noiseType: 'perlin',
				scale: 20,
				intensity: 0.3,
				colorMode: 'monochrome',
			},
		},
		{
			name: 'Ruido RGB',
			config: {
				...createDefaultNoiseConfig(),
				noiseType: 'simplex',
				scale: 15,
				intensity: 0.4,
				colorMode: 'rgb',
				animated: true,
				animationSpeed: 0.5,
			},
		},
		{
			name: 'Patrón Celular',
			config: {
				...createDefaultNoiseConfig(),
				noiseType: 'worley',
				scale: 8,
				intensity: 0.6,
				colorMode: 'hsl',
			},
		},
		{
			name: 'Terreno Fractal',
			config: {
				...createDefaultNoiseConfig(),
				noiseType: 'fractal',
				scale: 30,
				intensity: 0.7,
				colorMode: 'monochrome',
				fractalConfig: {
					octaves: 5,
					persistence: 0.5,
					lacunarity: 2,
				},
			},
		},
		{
			name: 'Vórtice Animado',
			config: {
				...createDefaultNoiseConfig(),
				noiseType: 'simplex',
				scale: 12,
				intensity: 0.5,
				colorMode: 'hsl',
				animated: true,
				animationSpeed: 1,
				zone: {
					type: 'circle',
					center: { x: 0.5, y: 0.5 },
					radius: 0.4,
					feather: 0.2,
				},
			},
		},
	],
};