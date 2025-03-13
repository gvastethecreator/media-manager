'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResponse, actionResponseSchema, entityParamsSchema } from './schemas';

/**
 * Elimina la configuración visual para una entidad
 */
export async function deleteVisualConfig(
	entityType: string,
	entityId?: string
): Promise<ActionResponse> {
	try {
		// Validar parámetros
		const validation = entityParamsSchema.safeParse({
			entityType,
			entityId,
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
				data: validation.error,
			};
		}

		// Si tenemos un ID específico, eliminar esa configuración
		if (entityId) {
			switch (entityType) {
				case 'folders':
					await prisma.folderVisualConfig.delete({
						where: {
							folderId: entityId,
						},
					});
					break;
				case 'images':
					await prisma.imageVisualConfig.delete({
						where: {
							imageId: entityId,
						},
					});
					break;
				case 'videos':
					await prisma.videoVisualConfig.delete({
						where: {
							videoId: entityId,
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
			// Si no hay ID, eliminar la configuración por defecto del tipo de entidad
			await prisma.cardConfiguration.delete({
				where: {
					entityType,
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
			message: 'Configuración visual eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración visual:', error);

		if (error instanceof z.ZodError) {
			return {
				success: false,
				message: 'Error de validación en los parámetros',
				data: error.errors,
			};
		}

		return {
			success: false,
			message: 'Error al eliminar la configuración visual',
			data: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}