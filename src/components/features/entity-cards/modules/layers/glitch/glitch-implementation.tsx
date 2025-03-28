import type { LayerImplementation } from '../types';
import { ZapIcon } from 'lucide-react';
import { GlitchLayer } from './components/glitch-layer';

import { createDefaultGlitchConfig, type GlitchConfig } from './glitch-schema';

/**
 * ⚡ Implementación de la capa de glitch
 */
export const glitchImplementation: LayerImplementation<GlitchConfig> = {
	type: 'glitch',
	name: 'Glitch',
	description: 'Aplica efectos de distorsión y glitch a la imagen',
	icon: ZapIcon,
	defaultConfig: createDefaultGlitchConfig(),
	render: GlitchLayer,
	presets: [
		{
			name: 'Glitch Digital',
			config: {
				...createDefaultGlitchConfig(),
				glitchType: 'digital',
				intensity: 0.6,
				noise: 0.3,
				compression: 0.4,
				colorChannels: {
					red: { offset: { x: 0.02, y: 0 }, intensity: 0.5 },
					blue: { offset: { x: -0.02, y: 0 }, intensity: 0.5 },
				},
				animation: {
					frequency: 2,
					duration: 100,
					randomness: 0.5,
				},
			},
		},
		{
			name: 'VHS Analógico',
			config: {
				...createDefaultGlitchConfig(),
				glitchType: 'analog',
				intensity: 0.7,
				scanlines: true,
				noise: 0.4,
				colorChannels: {
					red: { offset: { x: 0.01, y: 0.01 }, intensity: 0.3 },
					green: { offset: { x: 0, y: 0.01 }, intensity: 0.3 },
					blue: { offset: { x: -0.01, y: 0.01 }, intensity: 0.3 },
				},
				animation: {
					frequency: 1,
					duration: 200,
					randomness: 0.3,
				},
			},
		},
		{
			name: 'RGB Split',
			config: {
				...createDefaultGlitchConfig(),
				glitchType: 'rgb',
				intensity: 0.5,
				colorChannels: {
					red: { offset: { x: 0.03, y: 0 }, intensity: 1 },
					green: { offset: { x: 0, y: 0 }, intensity: 1 },
					blue: { offset: { x: -0.03, y: 0 }, intensity: 1 },
				},
				animation: {
					frequency: 0.5,
					duration: 500,
					randomness: 0.2,
				},
			},
		},
		{
			name: 'Cortes Aleatorios',
			config: {
				...createDefaultGlitchConfig(),
				glitchType: 'slice',
				intensity: 0.8,
				zone: {
					type: 'random',
					size: 0.3,
					feather: 0.1,
				},
				animation: {
					frequency: 4,
					duration: 50,
					randomness: 0.8,
				},
			},
		},
		{
			name: 'Corrupción de Datos',
			config: {
				...createDefaultGlitchConfig(),
				glitchType: 'corruption',
				intensity: 0.5,
				compression: 0.7,
				noise: 0.6,
				zone: {
					type: 'horizontal',
					size: 0.4,
					feather: 0.2,
					position: { x: 0.5, y: 0.5 },
				},
				animation: {
					frequency: 3,
					duration: 150,
					randomness: 0.6,
				},
			},
		},
		{
			name: 'Cyberpunk',
			config: {
				...createDefaultGlitchConfig(),
				glitchType: 'digital',
				intensity: 0.7,
				scanlines: true,
				noise: 0.3,
				compression: 0.5,
				colorChannels: {
					red: { offset: { x: 0.04, y: 0 }, intensity: 0.8 },
					green: { offset: { x: 0, y: 0.02 }, intensity: 0.5 },
					blue: { offset: { x: -0.04, y: 0 }, intensity: 0.8 },
				},
				animation: {
					frequency: 2.5,
					duration: 120,
					randomness: 0.7,
				},
			},
		},
	],
};
