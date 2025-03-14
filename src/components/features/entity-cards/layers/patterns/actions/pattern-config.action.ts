'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Esquema para la configuración de patrones
const patternConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean().default(true),
		patternType: z.enum(['dots', 'lines', 'grid', 'hexagon']).default('dots'),
		color: z.string().default('rgba(255, 255, 255, 0.15)'),
		secondaryColor: z.string().optional(),
		opacity: z.number().min(0).max(1).default(0.15),
		size: z.number().min(1).max(100).default(5),
		spacing: z.number().min(1).max(100).default(10),
		rotation: z.number().min(0).max(360).default(0),
		visibleOnHover: z.boolean().optional().default(false),
		animated: z.boolean().optional().default(false),
		animationSpeed: z.number().min(0).max(10).optional().default(1),
		blendMode: z.enum(['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten']).optional().default('normal'),
		density: z.number().min(0.1).max(10).optional().default(1),
		strokeWidth: z.number().min(0).max(10).optional().default(1),
		layerIndex: z.number().int().min(0).default(2),
	}),
});

export type PatternConfig = z.infer<typeof patternConfigSchema>['config'];

interface PatternConfigResponse {
	success: boolean;
	message: string;
	data?: PatternConfig;
}

export async function getPatternConfig(entityType: string, entityId?: string): Promise<PatternConfigResponse> {
	try {
		const validation = patternConfigSchema.safeParse({
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

		let config: PatternConfig | null = null;

		if (entityId) {
			config = (await prisma.layerPatternConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			})) as PatternConfig | null;
		}

		if (!config) {
			config = (await prisma.layerPatternConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			})) as PatternConfig | null;
		}

		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: {
					enabled: true,
					patternType: 'dots',
					color: 'rgba(255, 255, 255, 0.15)',
					opacity: 0.15,
					size: 5,
					spacing: 10,
					rotation: 0,
					visibleOnHover: false,
					animated: false,
					animationSpeed: 1,
					blendMode: 'normal',
					density: 1,
					strokeWidth: 1,
					layerIndex: 2,
				},
			};
		}

		return {
			success: true,
			message: 'Configuración de patrones obtenida correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de patrones:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de patrones',
		};
	}
}

export async function updatePatternConfig(
	entityType: string,
	config: PatternConfig,
	entityId?: string
): Promise<PatternConfigResponse> {
	try {
		const validation = patternConfigSchema.safeParse({
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

		const updatedConfig = await prisma.layerPatternConfig.upsert({
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
			message: 'Configuración de patrones actualizada correctamente',
			data: updatedConfig as PatternConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de patrones:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de patrones',
		};
	}
}

export async function deletePatternConfig(entityType: string, entityId?: string): Promise<PatternConfigResponse> {
	try {
		const validation = patternConfigSchema.safeParse({
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

		await prisma.layerPatternConfig.delete({
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
			message: 'Configuración de patrones eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de patrones:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de patrones',
		};
	}
}
