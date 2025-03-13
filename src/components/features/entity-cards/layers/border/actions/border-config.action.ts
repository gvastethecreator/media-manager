'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const borderConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean(),
		width: z.number().min(0),
		style: z.enum(['solid', 'dashed', 'dotted', 'double']),
		color: z.string(),
		radius: z.number().min(0).optional(),
		animated: z.boolean().optional(),
		animationType: z.enum(['none', 'pulse', 'flow', 'rainbow']).optional(),
		animationSpeed: z.number().min(0).optional(),
		glowAmount: z.number().min(0).optional(),
		opacity: z.number().min(0).max(1).optional(),
	}),
});

export type BorderConfig = z.infer<typeof borderConfigSchema>['config'];

interface BorderConfigResponse {
	success: boolean;
	message: string;
	data?: BorderConfig;
}

export async function getBorderConfig(
	entityType: string,
	entityId?: string
): Promise<BorderConfigResponse> {
	try {
		const validation = borderConfigSchema.safeParse({
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
			config = await prisma.layerBorderConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			});
		}

		if (!config) {
			config = await prisma.layerBorderConfig.findFirst({
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
					width: 2,
					style: 'solid',
					color: '#ffffff',
					radius: 8,
					animated: false,
					animationType: 'none',
					animationSpeed: 1,
					glowAmount: 0,
					opacity: 1,
				},
			};
		}

		return {
			success: true,
			message: 'Configuración de borde obtenida correctamente',
			data: config as BorderConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de borde:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de borde',
		};
	}
}

export async function updateBorderConfig(
	entityType: string,
	config: BorderConfig,
	entityId?: string
): Promise<BorderConfigResponse> {
	try {
		const validation = borderConfigSchema.safeParse({
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

		const updatedConfig = await prisma.layerBorderConfig.upsert({
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
			message: 'Configuración de borde actualizada correctamente',
			data: updatedConfig as BorderConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de borde:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de borde',
		};
	}
}

export async function deleteBorderConfig(
	entityType: string,
	entityId?: string
): Promise<BorderConfigResponse> {
	try {
		const validation = borderConfigSchema.safeParse({
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

		await prisma.layerBorderConfig.delete({
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
			message: 'Configuración de borde eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de borde:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de borde',
		};
	}
}