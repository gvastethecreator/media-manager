'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema de validación para la configuración del glow
const glowConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean(),
		intensity: z.number().min(0).max(1),
		color: z.string(),
		size: z.number().min(0),
		blurAmount: z.number().min(0),
		animationType: z.enum(['none', 'pulse', 'wave', 'sparkle']).optional(),
		pulseSpeed: z.number().min(0).optional(),
		visibleOnHover: z.boolean().optional(),
	}),
});

// Tipo para la configuración del glow
export type GlowConfig = z.infer<typeof glowConfigSchema>['config'];

// Tipo para la respuesta
interface GlowConfigResponse {
	success: boolean;
	message: string;
	data?: GlowConfig;
}

/**
 * Obtiene la configuración del efecto glow para una entidad
 */
export async function getGlowConfig(entityType: string, entityId?: string): Promise<GlowConfigResponse> {
	try {
		// Validar parámetros
		const validation = glowConfigSchema.safeParse({
			entityType,
			entityId,
			config: {}, // Validamos solo entityType y entityId
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
			};
		}

		let config: GlowConfig | null = null;

		// Si tenemos un ID específico, buscar esa configuración
		if (entityId) {
			config = await prisma.layerGlowConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			});
		}

		// Si no hay configuración específica, buscar la configuración por defecto
		if (!config) {
			config = await prisma.layerGlowConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			});
		}

		// Si no hay configuración, devolver valores por defecto
		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: {
					enabled: true,
					intensity: 0.5,
					color: '#ffffff',
					size: 20,
					blurAmount: 10,
					animationType: 'none',
					pulseSpeed: 1,
					visibleOnHover: false,
				},
			};
		}

		return {
			success: true,
			message: 'Configuración de glow obtenida correctamente',
			data: config as GlowConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de glow:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de glow',
		};
	}
}

/**
 * Actualiza la configuración del efecto glow para una entidad
 */
export async function updateGlowConfig(
	entityType: string,
	config: GlowConfig,
	entityId?: string
): Promise<GlowConfigResponse> {
	try {
		// Validar parámetros
		const validation = glowConfigSchema.safeParse({
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
		const updatedConfig = await prisma.layerGlowConfig.upsert({
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
			message: 'Configuración de glow actualizada correctamente',
			data: updatedConfig as GlowConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de glow:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de glow',
		};
	}
}

/**
 * Elimina la configuración del efecto glow para una entidad
 */
export async function deleteGlowConfig(entityType: string, entityId?: string): Promise<GlowConfigResponse> {
	try {
		// Validar parámetros
		const validation = glowConfigSchema.safeParse({
			entityType,
			entityId,
			config: {}, // Validamos solo entityType y entityId
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
			};
		}

		// Eliminar la configuración
		await prisma.layerGlowConfig.delete({
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
			message: 'Configuración de glow eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de glow:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de glow',
		};
	}
}
