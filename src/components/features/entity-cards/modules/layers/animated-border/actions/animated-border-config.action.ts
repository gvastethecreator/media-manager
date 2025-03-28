'use server';

/**
 * 🔄 Acciones de servidor para la configuración del borde animado
 *
 * Este archivo define las acciones del servidor para obtener, actualizar y eliminar
 * la configuración de la capa de borde animado.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { BaseLayerConfig } from '../../layer-config-base';

// Tipos de configuración de borde animado
export interface AnimatedBorderConfig extends BaseLayerConfig {
	width: number;
	color: string;
	secondaryColor: string;
	animationSpeed: number;
	animationType: 'flow' | 'pulse' | 'rainbow' | 'sparkle';
	glowAmount: number;
	dashArray?: string;
	opacity: number;
	glowColor: string;
	borderRadius: number;
	blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
	segments?: number;
}

// Schema para la validación de la configuración del borde animado
const animatedBorderConfigSchema = z.object({
	enabled: z.boolean().default(true),
	layerIndex: z.number().int().min(0).default(10),
	visibleOnHover: z.boolean().optional(),
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
	blendMode: z.enum(['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten']).optional(),
	segments: z.number().int().min(1).max(100).optional(),
});

/**
 * Respuesta estándar para las acciones de configuración
 */
export interface AnimatedBorderConfigResponse {
	success: boolean;
	message: string;
	data?: AnimatedBorderConfig;
}

/**
 * Obtiene la configuración actual del borde animado
 */
export async function getAnimatedBorderConfig(
	entityType: string,
	entityId?: string
): Promise<AnimatedBorderConfigResponse> {
	try {
		// Si no hay ID, devolvemos la configuración predeterminada
		if (!entityId) {
			return {
				success: true,
				message: 'Configuración predeterminada',
				data: await createDefaultAnimatedBorderConfig(),
			};
		}

		// Buscar configuración en la base de datos
		const config = await prisma.layerConfig.findFirst({
			where: {
				entityType,
				entityId,
				layerType: 'animatedBorder',
			},
		});

		// Si no existe, devolvemos la configuración predeterminada
		if (!config) {
			return {
				success: true,
				message: 'Configuración predeterminada',
				data: await createDefaultAnimatedBorderConfig(),
			};
		}

		// Devolver la configuración encontrada
		return {
			success: true,
			message: 'Configuración cargada correctamente',
			data: config.config as unknown as AnimatedBorderConfig,
		};
	} catch (error) {
		console.error('Error al obtener configuración de borde animado:', error);
		return {
			success: false,
			message: 'Error al cargar la configuración',
		};
	}
}

/**
 * Crea una configuración predeterminada para el borde animado
 */
export async function createDefaultAnimatedBorderConfig(): Promise<AnimatedBorderConfig> {
	return {
		enabled: true,
		layerIndex: 10,
		width: 2,
		color: '#ffffff',
		secondaryColor: '#00ffff',
		animationSpeed: 1,
		animationType: 'flow',
		glowAmount: 5,
		opacity: 0.8,
		glowColor: 'rgba(255, 255, 255, 0.5)',
		borderRadius: 4,
		blendMode: 'normal',
		segments: 4,
	};
}

/**
 * Actualiza la configuración del borde animado
 */
export async function updateAnimatedBorderConfig(
	entityType: string,
	config: Partial<AnimatedBorderConfig>,
	entityId?: string
): Promise<AnimatedBorderConfigResponse> {
	try {
		// Validar la configuración
		const validatedConfig = animatedBorderConfigSchema.partial().parse(config);

		// Si no hay ID, solo retornamos la configuración actualizada
		if (!entityId) {
			return {
				success: true,
				message: 'Configuración actualizada (solo cliente)',
				data: {
					...(await createDefaultAnimatedBorderConfig()),
					...validatedConfig,
				} as AnimatedBorderConfig,
			};
		}

		// Buscar configuración existente
		const existingConfig = await prisma.layerConfig.findFirst({
			where: {
				entityType,
				entityId,
				layerType: 'animatedBorder',
			},
		});

		// Actualizar o crear configuración
		if (existingConfig) {
			await prisma.layerConfig.update({
				where: { id: existingConfig.id },
				data: {
					config: {
						...existingConfig.config,
						...validatedConfig,
					} as any,
				},
			});
		} else {
			await prisma.layerConfig.create({
				data: {
					entityType,
					entityId,
					layerType: 'animatedBorder',
					config: {
						...(await createDefaultAnimatedBorderConfig()),
						...validatedConfig,
					} as any,
				},
			});
		}

		// Revalidar la ruta para reflejar los cambios
		revalidatePath(`/${entityType}/${entityId}`);

		return {
			success: true,
			message: 'Configuración actualizada correctamente',
			data: {
				...(await createDefaultAnimatedBorderConfig()),
				...validatedConfig,
			} as AnimatedBorderConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración del borde animado:', error);
		return {
			success: false,
			message: 'Error al guardar la configuración',
		};
	}
}

/**
 * Elimina la configuración del borde animado
 */
export async function deleteAnimatedBorderConfig(
	entityType: string,
	entityId?: string
): Promise<AnimatedBorderConfigResponse> {
	try {
		// Si no hay ID, no hay nada que eliminar
		if (!entityId) {
			return {
				success: true,
				message: 'Configuración eliminada (solo cliente)',
			};
		}

		// Eliminar configuración
		await prisma.layerConfig.deleteMany({
			where: {
				entityType,
				entityId,
				layerType: 'animatedBorder',
			},
		});

		// Revalidar la ruta para reflejar los cambios
		revalidatePath(`/${entityType}/${entityId}`);

		return {
			success: true,
			message: 'Configuración eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración del borde animado:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración',
		};
	}
}
