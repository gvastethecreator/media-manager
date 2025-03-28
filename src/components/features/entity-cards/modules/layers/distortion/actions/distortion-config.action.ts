'use client';

import { z } from 'zod';
import { create } from 'zustand';

// 🔄 Schema de configuración
export const distortionConfigSchema = z.object({
	enabled: z.boolean(),
	visibleOnHover: z.boolean(),
	intensity: z.number().min(0).max(1),
	glitchEffect: z.object({
		enabled: z.boolean(),
		visibleOnHover: z.boolean(),
		intensity: z.number().min(0).max(1),
		frequency: z.number().min(0).max(1),
		duration: z.number().min(0).max(5),
	}),
	chromaticAberration: z.object({
		enabled: z.boolean(),
		visibleOnHover: z.boolean(),
		intensity: z.number().min(0).max(1),
		offsetX: z.number().min(-50).max(50),
		offsetY: z.number().min(-50).max(50),
	}),
	pixelate: z.object({
		enabled: z.boolean(),
		visibleOnHover: z.boolean(),
		pixelSize: z.number().min(1).max(50),
		animated: z.boolean(),
		animationSpeed: z.number().min(0).max(10),
	}),
	noiseAmount: z.number().min(0).max(1),
	scanlines: z.object({
		enabled: z.boolean(),
		visibleOnHover: z.boolean(),
		intensity: z.number().min(0).max(1),
		speed: z.number().min(0).max(10),
	}),
	layerIndex: z.number().min(0).max(10),
});

// 📝 Tipo inferido del schema
export type DistortionConfig = z.infer<typeof distortionConfigSchema>;

// 🏭 Configuración por defecto
export const defaultDistortionConfig: DistortionConfig = {
	enabled: false,
	visibleOnHover: false,
	intensity: 0.2,
	glitchEffect: {
		enabled: false,
		visibleOnHover: false,
		intensity: 0.3,
		frequency: 0.2,
		duration: 0.5,
	},
	chromaticAberration: {
		enabled: false,
		visibleOnHover: false,
		intensity: 0.2,
		offsetX: 5,
		offsetY: 3,
	},
	pixelate: {
		enabled: false,
		visibleOnHover: false,
		pixelSize: 4,
		animated: false,
		animationSpeed: 1,
	},
	noiseAmount: 0.05,
	scanlines: {
		enabled: false,
		visibleOnHover: false,
		intensity: 0.3,
		speed: 1,
	},
	layerIndex: 6,
};

// 🏪 Interfaz del store
interface DistortionStore {
	config: DistortionConfig;
	updateConfig: (config: Partial<DistortionConfig>) => void;
	resetConfig: () => void;
	toggleEnabled: () => void;
	toggleGlitch: () => void;
	toggleChromatic: () => void;
	togglePixelate: () => void;
	updateGlitch: (config: Partial<DistortionConfig['glitchEffect']>) => void;
	updateChromatic: (config: Partial<DistortionConfig['chromaticAberration']>) => void;
	updatePixelate: (config: Partial<DistortionConfig['pixelate']>) => void;
}

// 🎯 Creación del store
export const useDistortionStore = create<DistortionStore>((set) => ({
	config: defaultDistortionConfig,

	updateConfig: (newConfig) =>
		set((state) => ({
			config: { ...state.config, ...newConfig },
		})),

	resetConfig: () => set({ config: defaultDistortionConfig }),

	toggleEnabled: () =>
		set((state) => ({
			config: { ...state.config, enabled: !state.config.enabled },
		})),

	toggleGlitch: () =>
		set((state) => ({
			config: {
				...state.config,
				glitchEffect: {
					...state.config.glitchEffect,
					enabled: !state.config.glitchEffect.enabled,
				},
			},
		})),

	toggleChromatic: () =>
		set((state) => ({
			config: {
				...state.config,
				chromaticAberration: {
					...state.config.chromaticAberration,
					enabled: !state.config.chromaticAberration.enabled,
				},
			},
		})),

	togglePixelate: () =>
		set((state) => ({
			config: {
				...state.config,
				pixelate: {
					...state.config.pixelate,
					enabled: !state.config.pixelate.enabled,
				},
			},
		})),

	updateGlitch: (glitchConfig) =>
		set((state) => ({
			config: {
				...state.config,
				glitchEffect: {
					...state.config.glitchEffect,
					...glitchConfig,
				},
			},
		})),

	updateChromatic: (chromaticConfig) =>
		set((state) => ({
			config: {
				...state.config,
				chromaticAberration: {
					...state.config.chromaticAberration,
					...chromaticConfig,
				},
			},
		})),

	updatePixelate: (pixelateConfig) =>
		set((state) => ({
			config: {
				...state.config,
				pixelate: {
					...state.config.pixelate,
					...pixelateConfig,
				},
			},
		})),
}));
