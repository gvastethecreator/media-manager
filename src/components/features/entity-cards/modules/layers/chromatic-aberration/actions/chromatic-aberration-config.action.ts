'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema para la validación de la configuración de aberración cromática
const chromaticAberrationConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean().default(true),
		offset: z.number().min(0).max(20).default(2),
		intensity: z.number().min(0).max(1).default(0.5),
		visibleOnHover: z.boolean().default(true),
		redOffset: z.number().default(2),
		greenOffset: z.number().default(0),
		blueOffset: z.number().default(-2),
		direction: z.enum(['horizontal', 'vertical', 'radial', 'custom']).default('horizontal'),
		blendMode: z.enum(['screen', 'overlay', 'multiply', 'difference', 'exclusion']).default('screen'),
		animateOnHover: z.boolean().default(false),
		animationSpeed: z.number().min(0.1).max(10).default(1),
		animationType: z.enum(['pulse', 'wave', 'random']).default('pulse'),
		blurAmount: z.number().min(0).max(10).default(0.5),
		quality: z.enum(['low', 'medium', 'high']).default('medium'),
		colorMode: z.enum(['rgb', 'cmyk', 'custom']).default('rgb'),
	}),
});

// Tipo inferido para la configuración
export type ChromaticAberrationConfig = z.infer<typeof chromaticAberrationConfigSchema>['config'];

// Tipo para la respuesta de las acciones
interface ChromaticAberrationConfigResponse {
	success: boolean;
	message: string;
	data?: ChromaticAberrationConfig;
}

/**
 * Obtiene la configuración de aberración cromática para una entidad
 */
export async function getChromaticAberrationConfig(
	entityType: string,
	entityId?: string
): Promise<ChromaticAberrationConfigResponse> {
	try {
		// Validar parámetros
		const validation = chromaticAberrationConfigSchema.safeParse({
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

		let config: ChromaticAberrationConfig | null = null;

		// Buscar configuración específica si se proporciona un ID
		if (entityId) {
			config = (await prisma.layerChromaticAberrationConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			})) as ChromaticAberrationConfig | null;
		}

		// Si no hay configuración específica, buscar la configuración por defecto
		if (!config) {
			config = (await prisma.layerChromaticAberrationConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			})) as ChromaticAberrationConfig | null;
		}

		// Si no se encuentra ninguna configuración, usar valores por defecto
		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: {
					enabled: true,
					offset: 2,
					intensity: 0.5,
					visibleOnHover: true,
					redOffset: 2,
					greenOffset: 0,
					blueOffset: -2,
					direction: 'horizontal',
					blendMode: 'screen',
					animateOnHover: false,
					animationSpeed: 1,
					animationType: 'pulse',
					blurAmount: 0.5,
					quality: 'medium',
					colorMode: 'rgb',
				},
			};
		}

		return {
			success: true,
			message: 'Configuración de aberración cromática obtenida correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de aberración cromática:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de aberración cromática',
			data: error instanceof Error ? ({ enabled: false } as ChromaticAberrationConfig) : undefined,
		};
	}
}

/**
 * Actualiza la configuración de aberración cromática para una entidad
 */
export async function updateChromaticAberrationConfig(
	entityType: string,
	config: ChromaticAberrationConfig,
	entityId?: string
): Promise<ChromaticAberrationConfigResponse> {
	try {
		// Validar parámetros
		const validation = chromaticAberrationConfigSchema.safeParse({
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
		const updatedConfig = await prisma.layerChromaticAberrationConfig.upsert({
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
			message: 'Configuración de aberración cromática actualizada correctamente',
			data: updatedConfig as ChromaticAberrationConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de aberración cromática:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de aberración cromática',
		};
	}
}

/**
 * Elimina la configuración de aberración cromática para una entidad
 */
export async function deleteChromaticAberrationConfig(
	entityType: string,
	entityId?: string
): Promise<ChromaticAberrationConfigResponse> {
	try {
		// Validar parámetros
		const validation = chromaticAberrationConfigSchema.safeParse({
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
		await prisma.layerChromaticAberrationConfig.delete({
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
			message: 'Configuración de aberración cromática eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de aberración cromática:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de aberración cromática',
		};
	}
}
