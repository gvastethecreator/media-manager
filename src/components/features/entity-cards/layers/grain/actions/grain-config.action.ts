'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const grainConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean(),
		intensity: z.number().min(0).max(1),
		size: z.number().min(0.1),
		animated: z.boolean().optional(),
		speed: z.number().min(0).optional(),
		colorMode: z.enum(['monochrome', 'color']).optional(),
		opacity: z.number().min(0).max(1).optional(),
		blend: z.enum(['normal', 'overlay', 'multiply', 'screen']).optional(),
		seed: z.number().int().min(0).optional(),
	}),
});

export type GrainConfig = z.infer<typeof grainConfigSchema>['config'];

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

		let config;

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
				data: {
					enabled: true,
					intensity: 0.3,
					size: 1,
					animated: true,
					speed: 1,
					colorMode: 'monochrome',
					opacity: 0.2,
					blend: 'overlay',
					seed: 12345,
				},
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
