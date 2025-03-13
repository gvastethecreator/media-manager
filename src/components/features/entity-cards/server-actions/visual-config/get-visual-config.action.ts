'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResponse, type BaseVisualConfig, actionResponseSchema, baseVisualConfigSchema, entityParamsSchema } from './schemas';

/**
 * Obtiene la configuración visual para una entidad
 */
export async function getVisualConfig(
	entityType: string,
	entityId?: string
): Promise<ActionResponse> {
	try {
		// Validar parámetros
		const validation = entityParamsSchema.safeParse({ entityType, entityId });
		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
				data: validation.error,
			};
		}

		let visualConfig: BaseVisualConfig | null = null;

		// Si tenemos un ID específico, buscar esa configuración
		if (entityId) {
			switch (entityType) {
				case 'folders':
					visualConfig = await prisma.folderVisualConfig.findFirst({
						where: {
							folder: {
								id: entityId,
							},
						},
					});
					break;
				case 'images':
					visualConfig = await prisma.imageVisualConfig.findFirst({
						where: {
							image: {
								id: entityId,
							},
						},
					});
					break;
				case 'videos':
					visualConfig = await prisma.videoVisualConfig.findFirst({
						where: {
							video: {
								id: entityId,
							},
						},
					});
					break;
				default:
					return {
						success: false,
						message: 'Tipo de entidad no válido',
					};
			}
		}

		// Si no hay configuración específica o no se proporcionó ID,
		// obtener la configuración por defecto del tipo de entidad
		if (!visualConfig) {
			visualConfig = await prisma.cardConfiguration.findFirst({
				where: { entityType },
			});
		}

		// Si no hay ninguna configuración, devolver valores por defecto
		if (!visualConfig) {
			const defaultConfig = baseVisualConfigSchema.parse({});
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: defaultConfig,
			};
		}

		// Validar y transformar la configuración
		const validatedConfig = baseVisualConfigSchema.parse(visualConfig);

		return {
			success: true,
			message: 'Configuración visual obtenida correctamente',
			data: validatedConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración visual:', error);

		if (error instanceof z.ZodError) {
			return {
				success: false,
				message: 'Error de validación en la configuración visual',
				data: error.errors,
			};
		}

		return {
			success: false,
			message: 'Error al obtener la configuración visual',
			data: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}