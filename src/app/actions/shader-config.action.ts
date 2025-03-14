'use server';

import {
	type ShaderConfig,
	entityParamsSchema,
	shaderConfigResponseSchema,
	shaderConfigSchema,
} from '@/components/features/entity-cards/layers/shaders/shader-config-schema';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene la configuración de shader para una entidad específica
 */
export async function getShaderConfig(entityType: string, entityId?: string) {
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
				type: 'shader',
			},
		});

		// Si existe, parsear y devolver
		if (existingConfig?.config) {
			const configData = JSON.parse(existingConfig.config as string) as ShaderConfig;
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
				layerIndex: 5,
				type: 'base',
				intensity: 0.5,
				speed: 1,
				color: '#00aaff',
				blendMode: 'screen',
				visibleOnHover: false,
				animated: true,
			},
		};
	} catch (error) {
		console.error('Error al obtener la configuración de shader:', error);
		return {
			success: false,
			error: 'Error al obtener la configuración',
		};
	}
}

/**
 * Actualiza la configuración de shader para una entidad específica
 */
export async function updateShaderConfig(entityType: string, config: ShaderConfig, entityId?: string) {
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
		const configValidation = shaderConfigSchema.safeParse(config);
		if (!configValidation.success) {
			return {
				success: false,
				error: 'Configuración de shader inválida',
			};
		}

		// Actualizar o crear la configuración
		const _updatedConfig = await prisma.layerConfig.upsert({
			where: {
				entityType_entityId_type: {
					entityType,
					entityId: entityId || null,
					type: 'shader',
				},
			},
			update: {
				config: JSON.stringify(config),
				updatedAt: new Date(),
			},
			create: {
				entityType,
				entityId: entityId || null,
				type: 'shader',
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
		console.error('Error al actualizar la configuración de shader:', error);
		return {
			success: false,
			error: 'Error al guardar la configuración',
		};
	}
}

/**
 * Elimina la configuración de shader para una entidad específica
 */
export async function deleteShaderConfig(entityType: string, entityId?: string) {
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
					type: 'shader',
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
		console.error('Error al eliminar la configuración de shader:', error);
		return {
			success: false,
			error: 'Error al eliminar la configuración',
		};
	}
}
