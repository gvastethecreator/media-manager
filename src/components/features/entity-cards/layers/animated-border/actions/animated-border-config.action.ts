'use server';

/**
 * 🔄 Acciones de servidor para la configuración del borde animado
 *
 * Este archivo define las acciones del servidor para obtener, actualizar y eliminar
 * la configuración de la capa de borde animado.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { AnimatedBorderConfig } from '../animated-border-effect-layer';

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
		// En una implementación real, aquí se leería la configuración desde la base de datos o API
		// Por ahora, retornamos una configuración predeterminada
		return {
			success: true,
			message: 'Configuración cargada correctamente',
			data: {
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
				borderRadius: 4
			}
		};
	} catch (error) {
		console.error('Error al cargar la configuración del borde animado:', error);
		return {
			success: false,
			message: 'Error al cargar la configuración'
		};
	}
}

/**
 * Actualiza la configuración del borde animado
 */
export async function updateAnimatedBorderConfig(
	entityType: string,
	config: AnimatedBorderConfig,
	entityId?: string
): Promise<AnimatedBorderConfigResponse> {
	try {
		// En una implementación real, aquí se guardaría la configuración en la base de datos o API
		console.log('Actualizando configuración del borde animado:', { entityType, entityId, config });

		// Revalidar la ruta para reflejar los cambios
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		} else {
			revalidatePath(`/${entityType}`);
		}

		return {
			success: true,
			message: 'Configuración actualizada correctamente',
			data: config
		};
	} catch (error) {
		console.error('Error al actualizar la configuración del borde animado:', error);
		return {
			success: false,
			message: 'Error al guardar la configuración'
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
		// En una implementación real, aquí se eliminaría la configuración de la base de datos o API
		console.log('Eliminando configuración del borde animado:', { entityType, entityId });

		// Revalidar la ruta para reflejar los cambios
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		} else {
			revalidatePath(`/${entityType}`);
		}

		return {
			success: true,
			message: 'Configuración eliminada correctamente'
		};
	} catch (error) {
		console.error('Error al eliminar la configuración del borde animado:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración'
		};
	}
}
