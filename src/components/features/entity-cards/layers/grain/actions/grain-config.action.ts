'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
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
	layerIndex: z.number().min(0),
});

// Tipo de configuración
export type GrainConfig = z.infer<typeof grainConfigSchema>;

// Configuración por defecto
const defaultConfig: GrainConfig = {
	enabled: true,
	intensity: 0.15,
	size: 1,
	animated: false,
	speed: 5,
	colorMode: 'monochrome',
	opacity: 0.5,
	blend: 'overlay',
	seed: 42,
	pattern: 'perlin',
	fractalNoise: false,
	roughness: 0.5,
	distribution: 'gaussian',
	layerIndex: 6,
};

// Interface del store
interface GrainStore {
	config: GrainConfig;
	updateConfig: (config: Partial<GrainConfig>) => void;
	resetConfig: () => void;
	toggleEnabled: () => void;
	setIntensity: (intensity: number) => void;
	setSize: (size: number) => void;
	toggleAnimated: () => void;
	setSpeed: (speed: number) => void;
	setColorMode: (mode: GrainConfig['colorMode']) => void;
	setOpacity: (opacity: number) => void;
	setBlend: (blend: GrainConfig['blend']) => void;
	setSeed: (seed: number) => void;
	setPattern: (pattern: GrainConfig['pattern']) => void;
	toggleFractalNoise: () => void;
	setRoughness: (roughness: number) => void;
	setDistribution: (distribution: GrainConfig['distribution']) => void;
}

// Crear store con Zustand
export const useGrainStore = create<GrainStore>((set) => ({
	config: defaultConfig,

	updateConfig: (newConfig) =>
		set((state) => ({
			config: { ...state.config, ...newConfig },
		})),

	resetConfig: () => set({ config: defaultConfig }),

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
}));

interface GrainConfigResponse {
	success: boolean;
	message: string;
	data?: GrainConfig;
}

export async function getGrainConfig(entityType: string, entityId?: string): Promise<GrainConfigResponse> {
	try {
		const validation = grainConfigSchema.safeParse({
			entityType,
			entityId,
			config: {},
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
			};
		}

		let config: GrainConfig | null = null;

		if (entityId) {
			config = await prisma.layerGrainConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			});
		}

		if (!config) {
			config = await prisma.layerGrainConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			});
		}

		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: defaultConfig,
			};
		}

		return {
			success: true,
			message: 'Configuración de grain obtenida correctamente',
			data: config as GrainConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de grain:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de grain',
		};
	}
}

export async function updateGrainConfig(
	entityType: string,
	config: GrainConfig,
	entityId?: string
): Promise<GrainConfigResponse> {
	try {
		const validation = grainConfigSchema.safeParse({
			entityType,
			entityId,
			config,
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
			};
		}

		const updatedConfig = await prisma.layerGrainConfig.upsert({
			where: {
				entityType_entityId: {
					entityType,
					entityId: entityId || 'default',
				},
			},
			update: {
				...config,
				isDefault: !entityId,
			},
			create: {
				entityType,
				entityId: entityId || 'default',
				isDefault: !entityId,
				...config,
			},
		});

		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de grain actualizada correctamente',
			data: updatedConfig as GrainConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de grain:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de grain',
		};
	}
}

export async function deleteGrainConfig(entityType: string, entityId?: string): Promise<GrainConfigResponse> {
	try {
		const validation = grainConfigSchema.safeParse({
			entityType,
			entityId,
			config: {},
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
			};
		}

		await prisma.layerGrainConfig.delete({
			where: {
				entityType_entityId: {
					entityType,
					entityId: entityId || 'default',
				},
			},
		});

		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de grain eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de grain:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de grain',
		};
	}
}
