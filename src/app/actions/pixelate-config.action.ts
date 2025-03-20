'use server';

import {
    type PixelateConfig,
    entityParamsSchema,
    pixelateConfigSchema
} from '@/components/features/entity-cards/modules/layer-system/layers/pixelate/pixelate-schema';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene la configuración de pixelado para una entidad específica
 */
export async function getPixelateConfig(entityType: string, entityId?: string) {
	try {
		// Validar los parámetros de entrada
		const validationResult = entityParamsSchema.safeParse({ entityType, entityId });
		if (!validationResult.success) {
			return {
				success: false,
				error: 'Parámetros de entidad inválidos',
			};
		}

		// Buscar configuración existente
		const existingConfig = await prisma.layerConfig.findFirst({
			where: {
				entityType,
				entityId: entityId || null,
				type: 'pixelate',
			},
		});

		// Si existe, parsear y devolver
		if (existingConfig?.config) {
			const configData = JSON.parse(existingConfig.config as string) as PixelateConfig;
			return {
				success: true,
				data: configData,
			};
		}

		// Si no existe, devolver configuración por defecto
		return {
			success: true,
			data: {
				enabled: true,
				layerIndex: 4,
				pixelSize: 8,
				algorithm: 'simple',
				intensity: 1,
				colorReduction: 0,
				shape: 'square',
				visibleOnHover: false,
				preserveAlpha: true,
				zone: {
					enabled: false,
					centerX: 0.5,
					centerY: 0.5,
					radius: 0.3,
					feather: 0.1,
				},
				animated: false,
				animationSpeed: 1,
				transition: {
					enabled: false,
					duration: 1,
					easing: 'ease',
					autoplay: false,
					trigger: 'hover',
				},
				blendMode: 'normal',
			},
		};
	} catch (error) {
		console.error('Error al obtener la configuración de pixelado:', error);
		return {
			success: false,
			error: 'Error al obtener la configuración',
		};
	}
}

/**
 * Actualiza la configuración de pixelado para una entidad específica
 */
export async function updatePixelateConfig(entityType: string, config: PixelateConfig, entityId?: string) {
	try {
		// Validar los parámetros de entrada
		const paramsValidation = entityParamsSchema.safeParse({ entityType, entityId });
		if (!paramsValidation.success) {
			return {
				success: false,
				error: 'Parámetros de entidad inválidos',
			};
		}

		// Validar la configuración
		const configValidation = pixelateConfigSchema.safeParse(config);
		if (!configValidation.success) {
			return {
				success: false,
				error: 'Configuración de pixelado inválida',
			};
		}

		// Actualizar o crear la configuración
		await prisma.layerConfig.upsert({
			where: {
				entityType_entityId_type: {
					entityType,
					entityId: entityId || null,
					type: 'pixelate',
				},
			},
			update: {
				config: JSON.stringify(config),
				updatedAt: new Date(),
			},
			create: {
				entityType,
				entityId: entityId || null,
				type: 'pixelate',
				config: JSON.stringify(config),
			},
		});

		// Revalidar rutas para aplicar cambios inmediatamente
		revalidatePath(`/entities/${entityType}`);
		if (entityId) {
			revalidatePath(`/entities/${entityType}/${entityId}`);
		}

		return {
			success: true,
			data: config,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de pixelado:', error);
		return {
			success: false,
			error: 'Error al guardar la configuración',
		};
	}
}

/**
 * Elimina la configuración de pixelado para una entidad específica
 */
export async function deletePixelateConfig(entityType: string, entityId?: string) {
	try {
		// Validar los parámetros de entrada
		const validationResult = entityParamsSchema.safeParse({ entityType, entityId });
		if (!validationResult.success) {
			return {
				success: false,
				error: 'Parámetros de entidad inválidos',
			};
		}

		// Eliminar la configuración
		await prisma.layerConfig.delete({
			where: {
				entityType_entityId_type: {
					entityType,
					entityId: entityId || null,
					type: 'pixelate',
				},
			},
		});

		// Revalidar rutas para aplicar cambios inmediatamente
		revalidatePath(`/entities/${entityType}`);
		if (entityId) {
			revalidatePath(`/entities/${entityType}/${entityId}`);
		}

		return {
			success: true,
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de pixelado:', error);
		return {
			success: false,
			error: 'Error al eliminar la configuración',
		};
	}
}
