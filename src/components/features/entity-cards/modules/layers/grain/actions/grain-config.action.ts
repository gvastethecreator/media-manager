'use client';

import { z } from 'zod';
import { create } from 'zustand';

// Schema de configuración
export const grainConfigSchema = z.object({
	enabled: z.boolean(),
	intensity: z.number().min(0).max(1),
	size: z.number().min(0.1),
	animated: z.boolean(),
	speed: z.number().min(0).max(10),
	colorMode: z.enum(['monochrome', 'color']),
	opacity: z.number().min(0).max(1),
	blend: z.enum(['normal', 'overlay', 'multiply', 'screen']),
	seed: z.number().int().min(0),
	pattern: z.enum(['perlin', 'simplex', 'worley']),
	fractalNoise: z.boolean(),
	roughness: z.number().min(0).max(1),
	distribution: z.enum(['gaussian', 'uniform']),
	octaves: z.number().int().min(1).max(10),
	layerIndex: z.number().min(0).max(10),
});

// Tipo inferido del schema
export type GrainConfig = z.infer<typeof grainConfigSchema>;

// Configuración por defecto
export const defaultGrainConfig: GrainConfig = {
	enabled: true,
	intensity: 0.3,
	size: 1.0,
	animated: false,
	speed: 1.0,
	colorMode: 'monochrome',
	opacity: 0.5,
	blend: 'overlay',
	seed: 42,
	pattern: 'perlin',
	fractalNoise: false,
	roughness: 0.5,
	distribution: 'gaussian',
	octaves: 3,
	layerIndex: 4,
};

// Interfaz del store
interface GrainStore {
	config: GrainConfig;
	resetConfig: () => void;
	updateConfig: (config: Partial<GrainConfig>) => void;
	toggleEnabled: () => void;
	setIntensity: (intensity: number) => void;
	setSize: (size: number) => void;
	toggleAnimated: () => void;
	setSpeed: (speed: number) => void;
	setColorMode: (colorMode: GrainConfig['colorMode']) => void;
	setOpacity: (opacity: number) => void;
	setBlend: (blend: GrainConfig['blend']) => void;
	setSeed: (seed: number) => void;
	setPattern: (pattern: GrainConfig['pattern']) => void;
	toggleFractalNoise: () => void;
	setRoughness: (roughness: number) => void;
	setDistribution: (distribution: GrainConfig['distribution']) => void;
	setOctaves: (octaves: number) => void;
	setLayerIndex: (layerIndex: number) => void;
}

// Creación del store
export const useGrainStore = create<GrainStore>((set) => ({
	config: defaultGrainConfig,

	resetConfig: () => set({ config: defaultGrainConfig }),

	updateConfig: (newConfig) =>
		set((state) => ({
			config: { ...state.config, ...newConfig },
		})),

	toggleEnabled: () =>
		set((state) => ({
			config: { ...state.config, enabled: !state.config.enabled },
		})),

	setIntensity: (intensity) =>
		set((state) => ({
			config: { ...state.config, intensity },
		})),

	setSize: (size) =>
		set((state) => ({
			config: { ...state.config, size },
		})),

	toggleAnimated: () =>
		set((state) => ({
			config: { ...state.config, animated: !state.config.animated },
		})),

	setSpeed: (speed) =>
		set((state) => ({
			config: { ...state.config, speed },
		})),

	setColorMode: (colorMode) =>
		set((state) => ({
			config: { ...state.config, colorMode },
		})),

	setOpacity: (opacity) =>
		set((state) => ({
			config: { ...state.config, opacity },
		})),

	setBlend: (blend) =>
		set((state) => ({
			config: { ...state.config, blend },
		})),

	setSeed: (seed) =>
		set((state) => ({
			config: { ...state.config, seed },
		})),

	setPattern: (pattern) =>
		set((state) => ({
			config: { ...state.config, pattern },
		})),

	toggleFractalNoise: () =>
		set((state) => ({
			config: { ...state.config, fractalNoise: !state.config.fractalNoise },
		})),

	setRoughness: (roughness) =>
		set((state) => ({
			config: { ...state.config, roughness },
		})),

	setDistribution: (distribution) =>
		set((state) => ({
			config: { ...state.config, distribution },
		})),

	setOctaves: (octaves) =>
		set((state) => ({
			config: { ...state.config, octaves },
		})),

	setLayerIndex: (layerIndex) =>
		set((state) => ({
			config: { ...state.config, layerIndex },
		})),
}));
