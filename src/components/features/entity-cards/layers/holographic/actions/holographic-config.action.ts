'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const holographicConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean(),
		intensity: z.number().min(0).max(1),
		pattern: z.enum(['rainbow', 'linear', 'radial', 'custom']),
		colors: z.array(z.string()).min(1),
		speed: z.number().min(0).optional(),
		angle: z.number().min(-180).max(180).optional(),
		scale: z.number().min(0).optional(),
		blend: z.enum(['normal', 'screen', 'overlay', 'soft-light']).optional(),
		animated: z.boolean().optional(),
		interactiveMode: z.enum(['none', 'tilt', 'mouse']).optional(),
	}),
});

export type HolographicConfig = z.infer<typeof holographicConfigSchema>['config'];

interface HolographicConfigResponse {
	success: boolean;
	message: string;
	data?: HolographicConfig;
}

export async function getHolographicConfig(entityType: string, entityId?: string): Promise<HolographicConfigResponse> {
	try {
		const validation = holographicConfigSchema.safeParse({
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

		let config: HolographicConfig | null = null;

		if (entityId) {
			config = await prisma.layerHolographicConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			});
		}

		if (!config) {
			config = await prisma.layerHolographicConfig.findFirst({
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
					intensity: 0.5,
					pattern: 'rainbow',
					colors: ['#ff0000', '#00ff00', '#0000ff'],
					speed: 1,
					angle: 45,
					scale: 1,
					blend: 'overlay',
					animated: true,
					interactiveMode: 'tilt',
				},
			};
		}

		return {
			success: true,
			message: 'Configuración holográfica obtenida correctamente',
			data: config as HolographicConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración holográfica:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración holográfica',
		};
	}
}

export async function updateHolographicConfig(
	entityType: string,
	config: HolographicConfig,
	entityId?: string
): Promise<HolographicConfigResponse> {
	try {
		const validation = holographicConfigSchema.safeParse({
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

		const updatedConfig = await prisma.layerHolographicConfig.upsert({
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
			message: 'Configuración holográfica actualizada correctamente',
			data: updatedConfig as HolographicConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración holográfica:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración holográfica',
		};
	}
}

export async function deleteHolographicConfig(
	entityType: string,
	entityId?: string
): Promise<HolographicConfigResponse> {
	try {
		const validation = holographicConfigSchema.safeParse({
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

		await prisma.layerHolographicConfig.delete({
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
			message: 'Configuración holográfica eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración holográfica:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración holográfica',
		};
	}
}
