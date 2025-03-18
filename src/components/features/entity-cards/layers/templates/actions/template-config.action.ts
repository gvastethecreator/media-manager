'use server';

import type { ActionResponse } from '@/components/features/entity-cards/types/central-types';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema para validación de la configuración
const templateConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean().default(true),
		layerIndex: z.number().min(0).default(5),
		color: z.string().default('#3b82f6'),
		intensity: z.number().min(0).max(1).default(0.5),
		mode: z.enum(['normal', 'intense', 'subtle']).default('normal'),
		visibleOnHover: z.boolean().default(false),
	}),
});

// Tipo para la configuración de la capa
export type TemplateLayerConfig = z.infer<typeof templateConfigSchema>['config'];

/**
 * Obtiene la configuración de la capa para una entidad
 * @param entityType Tipo de entidad
 * @param entityId ID de la entidad (opcional)
 */
export async function getTemplateConfig(entityType: string, entityId?: string): Promise<ActionResponse> {
	try {
		// Validar parámetros
		const validation = templateConfigSchema.safeParse({
			entityType,
			entityId,
			config: {},
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
				error: validation.error.format(),
			};
		}

		let config: TemplateLayerConfig | null = null;

		// Buscar configuración específica para la entidad
		if (entityId) {
			config = (await prisma.layerTemplateConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			})) as TemplateLayerConfig | null;
		}

		// Si no hay configuración específica, buscar configuración por defecto
		if (!config) {
			config = (await prisma.layerTemplateConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			})) as TemplateLayerConfig | null;
		}

		// Si no hay configuración, usar valores por defecto
		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: {
					enabled: true,
					layerIndex: 5,
					color: '#3b82f6',
					intensity: 0.5,
					mode: 'normal',
					visibleOnHover: false,
				} as TemplateLayerConfig,
			};
		}

		return {
			success: true,
			message: 'Configuración obtenida correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener configuración de template:', error);
		return {
			success: false,
			message: 'Error al obtener configuración',
			error,
		};
	}
}

/**
 * Actualiza la configuración de la capa para una entidad
 * @param entityType Tipo de entidad
 * @param config Configuración a guardar
 * @param entityId ID de la entidad (opcional)
 */
export async function updateTemplateConfig(
	entityType: string,
	config: TemplateLayerConfig,
	entityId?: string
): Promise<ActionResponse> {
	try {
		// Validar parámetros
		const validation = templateConfigSchema.safeParse({
			entityType,
			entityId,
			config,
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
				error: validation.error.format(),
			};
		}

		// Crear o actualizar la configuración
		const updatedConfig = await prisma.layerTemplateConfig.upsert({
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

		// Revalidar rutas que podrían usar esta configuración
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración actualizada correctamente',
			data: updatedConfig,
		};
	} catch (error) {
		console.error('Error al actualizar configuración de template:', error);
		return {
			success: false,
			message: 'Error al actualizar configuración',
			error,
		};
	}
}

/**
 * Elimina la configuración de la capa para una entidad
 * @param entityType Tipo de entidad
 * @param entityId ID de la entidad (opcional)
 */
export async function deleteTemplateConfig(entityType: string, entityId?: string): Promise<ActionResponse> {
	try {
		// Validar parámetros
		const validation = templateConfigSchema.safeParse({
			entityType,
			entityId,
			config: {},
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
				error: validation.error.format(),
			};
		}

		// Eliminar la configuración
		await prisma.layerTemplateConfig.delete({
			where: {
				entityType_entityId: {
					entityType,
					entityId: entityId || 'default',
				},
			},
		});

		// Revalidar rutas
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar configuración de template:', error);
		return {
			success: false,
			message: 'Error al eliminar configuración',
			error,
		};
	}
}
