'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResponse, type BaseVisualConfig, actionResponseSchema, baseVisualConfigSchema, entityParamsSchema } from './schemas';

// Schema para la validación de la actualización
const updateVisualConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: baseVisualConfigSchema.partial(),
});

/**
 * Actualiza la configuración visual para una entidad
 */
export async function updateVisualConfig(
	entityType: string,
	config: Partial<BaseVisualConfig>,
	entityId?: string
): Promise<ActionResponse> {
	try {
		// Validar parámetros
		const validation = updateVisualConfigSchema.safeParse({
			entityType,
			entityId,
			config,
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
				data: validation.error,
			};
		}

		// Si tenemos un ID específico, actualizar esa configuración
		if (entityId) {
			switch (entityType) {
				case 'folders':
					await prisma.folderVisualConfig.upsert({
						where: {
							folderId: entityId,
						},
						update: {
							...config,
						},
						create: {
							folderId: entityId,
							...config,
						},
					});
					break;
				case 'images':
					await prisma.imageVisualConfig.upsert({
						where: {
							imageId: entityId,
						},
						update: {
							...config,
						},
						create: {
							imageId: entityId,
							...config,
						},
					});
					break;
				case 'videos':
					await prisma.videoVisualConfig.upsert({
						where: {
							videoId: entityId,
						},
						update: {
							...config,
						},
						create: {
							videoId: entityId,
							...config,
						},
					});
					break;
				default:
					return {
						success: false,
						message: 'Tipo de entidad no válido',
					};
			}
		} else {
			// Si no hay ID, actualizar la configuración por defecto del tipo de entidad
			await prisma.cardConfiguration.upsert({
				where: {
					entityType,
				},
				update: {
					...config,
				},
				create: {
					entityType,
					...config,
				},
			});
		}

		// Revalidar las rutas necesarias
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración visual actualizada correctamente',
		};
	} catch (error) {
		console.error('Error al actualizar la configuración visual:', error);

		if (error instanceof z.ZodError) {
			return {
				success: false,
				message: 'Error de validación en la configuración visual',
				data: error.errors,
			};
		}

		return {
			success: false,
			message: 'Error al actualizar la configuración visual',
			data: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}