'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const noiseTextureConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean(),
		density: z.number().min(0.01).max(2),
		opacity: z.number().min(0).max(1),
		visibleOnHover: z.boolean().optional(),
		pattern: z.enum(['perlin', 'simplex', 'fractalNoise', 'turbulence']).optional(),
		scale: z.number().min(0.1).max(10).optional(),
		octaves: z.number().int().min(1).max(8).optional(),
		seed: z.number().int().optional(),
		animated: z.boolean().optional(),
		animationSpeed: z.number().min(0).max(10).optional(),
		blendMode: z.enum(['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten']).optional(),
		color: z.string().optional(),
		intensity: z.number().min(0).max(1).optional(),
	}),
});

export type NoiseTextureConfig = z.infer<typeof noiseTextureConfigSchema>['config'];

interface NoiseTextureConfigResponse {
	success: boolean;
	message: string;
	data?: NoiseTextureConfig;
}

export async function getNoiseTextureConfig(
	entityType: string,
	entityId?: string
): Promise<NoiseTextureConfigResponse> {
	try {
		const validation = noiseTextureConfigSchema.safeParse({
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

		let config: NoiseTextureConfig | null = null;

		if (entityId) {
			config = await prisma.layerNoiseTextureConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			}) as NoiseTextureConfig | null;
		}

		if (!config) {
			config = await prisma.layerNoiseTextureConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			}) as NoiseTextureConfig | null;
		}

		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: {
					enabled: true,
					density: 0.6,
					opacity: 0.1,
					visibleOnHover: true,
					pattern: 'fractalNoise',
					scale: 1,
					octaves: 3,
					seed: 42,
					animated: false,
					animationSpeed: 1,
					blendMode: 'overlay',
					color: 'rgba(255, 255, 255, 0.5)',
					intensity: 0.5,
				},
			};
		}

		return {
			success: true,
			message: 'Configuración de noise texture obtenida correctamente',
			data: config as NoiseTextureConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de noise texture:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de noise texture',
		};
	}
}

export async function updateNoiseTextureConfig(
	entityType: string,
	config: NoiseTextureConfig,
	entityId?: string
): Promise<NoiseTextureConfigResponse> {
	try {
		const validation = noiseTextureConfigSchema.safeParse({
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

		const updatedConfig = await prisma.layerNoiseTextureConfig.upsert({
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
			message: 'Configuración de noise texture actualizada correctamente',
			data: updatedConfig as NoiseTextureConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de noise texture:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de noise texture',
		};
	}
}

export async function deleteNoiseTextureConfig(
	entityType: string,
	entityId?: string
): Promise<NoiseTextureConfigResponse> {
	try {
		const validation = noiseTextureConfigSchema.safeParse({
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

		await prisma.layerNoiseTextureConfig.delete({
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
			message: 'Configuración de noise texture eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de noise texture:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de noise texture',
		};
	}
}