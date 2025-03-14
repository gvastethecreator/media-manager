'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema para la validación de la configuración del borde animado
const animatedBorderConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean().default(true),
		width: z.number().min(0.5).default(2),
		color: z.string().default('#ffffff'),
		secondaryColor: z.string().default('#00ffff'),
		animationSpeed: z.number().min(0.1).max(10).default(1),
		animationType: z.enum(['flow', 'pulse', 'rainbow', 'sparkle']).default('flow'),
		glowAmount: z.number().min(0).max(20).default(5),
		dashArray: z.string().optional(),
		opacity: z.number().min(0).max(1).default(0.8),
		glowColor: z.string().default('rgba(255, 255, 255, 0.5)'),
		borderRadius: z.number().min(0).default(4),
	}),
});

// Tipo inferido para la configuración
export type AnimatedBorderConfig = z.infer<typeof animatedBorderConfigSchema>['config'];

// Tipo para la respuesta de las acciones
interface AnimatedBorderConfigResponse {
	success: boolean;
	message: string;
	data?: AnimatedBorderConfig;
}

/**
 * Obtiene la configuración del borde animado para una entidad
 */
export async function getAnimatedBorderConfig(
	entityType: string,
	entityId?: string
): Promise<AnimatedBorderConfigResponse> {
	try {
		// Validar parámetros
		const validation = animatedBorderConfigSchema.safeParse({
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

		let config: AnimatedBorderConfig | null = null;

		// Buscar configuración específica si se proporciona un ID
		if (entityId) {
			config = (await prisma.layerAnimatedBorderConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			})) as AnimatedBorderConfig | null;
		}

		// Si no hay configuración específica, buscar la configuración por defecto
		if (!config) {
			config = (await prisma.layerAnimatedBorderConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			})) as AnimatedBorderConfig | null;
		}

		// Si no se encuentra ninguna configuración, usar valores por defecto
		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: {
					enabled: true,
					width: 2,
					color: '#ffffff',
					secondaryColor: '#00ffff',
					animationSpeed: 1,
					animationType: 'flow',
					glowAmount: 5,
					opacity: 0.8,
					glowColor: 'rgba(255, 255, 255, 0.5)',
					borderRadius: 4,
				},
			};
		}

		return {
			success: true,
			message: 'Configuración de borde animado obtenida correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de borde animado:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de borde animado',
			data: error instanceof Error ? ({ enabled: false } as AnimatedBorderConfig) : undefined,
		};
	}
}

/**
 * Actualiza la configuración del borde animado para una entidad
 */
export async function updateAnimatedBorderConfig(
	entityType: string,
	config: AnimatedBorderConfig,
	entityId?: string
): Promise<AnimatedBorderConfigResponse> {
	try {
		// Validar parámetros
		const validation = animatedBorderConfigSchema.safeParse({
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

		// Actualizar o crear la configuración
		const updatedConfig = await prisma.layerAnimatedBorderConfig.upsert({
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

		// Revalidar las rutas necesarias
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de borde animado actualizada correctamente',
			data: updatedConfig as AnimatedBorderConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de borde animado:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de borde animado',
		};
	}
}

/**
 * Elimina la configuración del borde animado para una entidad
 */
export async function deleteAnimatedBorderConfig(
	entityType: string,
	entityId?: string
): Promise<AnimatedBorderConfigResponse> {
	try {
		// Validar parámetros
		const validation = animatedBorderConfigSchema.safeParse({
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

		// Eliminar la configuración
		await prisma.layerAnimatedBorderConfig.delete({
			where: {
				entityType_entityId: {
					entityType,
					entityId: entityId || 'default',
				},
			},
		});

		// Revalidar las rutas necesarias
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de borde animado eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de borde animado:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de borde animado',
		};
	}
}
