'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { type PixelateConfig, type PixelateConfigResponse, pixelateConfigSchema } from '../pixelate-schema';

// Definir el tipo para la configuración en la base de datos
type DbPixelateConfig = {
	enabled: boolean;
	layerIndex: number;
	pixelSize: number;
	algorithm: string;
	applyToSpot: boolean;
	spotRadius: number | null;
	spotPositionX: number | null;
	spotPositionY: number | null;
	transitionEffect: string | null;
	transitionDuration: number | null;
	colorReduction: boolean;
	colorLevels: number | null;
	[key: string]: unknown;
};

/**
 * Obtiene la configuración del efecto pixelate para una entidad
 */
export async function getPixelateConfig(entityType: string, entityId?: string): Promise<PixelateConfigResponse> {
	try {
		// Validar parámetros
		const validation = pixelateConfigSchema.safeParse({
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

		let config: DbPixelateConfig | null = null;

		// Si tenemos un ID específico, buscar esa configuración
		if (entityId) {
			config = (await prisma.layerPixelateConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			})) as DbPixelateConfig | null;
		}

		// Si no hay configuración específica, buscar la configuración por defecto
		if (!config) {
			config = (await prisma.layerPixelateConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			})) as DbPixelateConfig | null;
		}

		// Si no hay configuración, devolver valores por defecto
		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: {
					enabled: true,
					layerIndex: 4,
					pixelSize: 8,
					algorithm: 'simple',
					applyToSpot: false,
					spotRadius: 100,
					spotPosition: { x: 50, y: 50 },
					transitionEffect: 'none',
					transitionDuration: 0.3,
					colorReduction: false,
					colorLevels: 32,
				},
			};
		}

		// Transformar la configuración de la base de datos al formato esperado
		const transformedConfig: PixelateConfig = {
			enabled: config.enabled,
			layerIndex: config.layerIndex,
			pixelSize: config.pixelSize,
			algorithm: config.algorithm as 'simple' | 'weighted' | 'adaptative',
			applyToSpot: config.applyToSpot,
			spotRadius: config.spotRadius || undefined,
			spotPosition:
				config.spotPositionX && config.spotPositionY ? { x: config.spotPositionX, y: config.spotPositionY } : undefined,
			transitionEffect: config.transitionEffect as 'none' | 'fade' | 'zoom' | 'slide' | undefined,
			transitionDuration: config.transitionDuration || undefined,
			colorReduction: config.colorReduction,
			colorLevels: config.colorLevels || undefined,
		};

		return {
			success: true,
			message: 'Configuración de pixelate obtenida correctamente',
			data: transformedConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de pixelate:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de pixelate',
		};
	}
}

/**
 * Actualiza la configuración del efecto pixelate para una entidad
 */
export async function updatePixelateConfig(
	entityType: string,
	config: PixelateConfig,
	entityId?: string
): Promise<PixelateConfigResponse> {
	try {
		// Validar parámetros
		const validation = pixelateConfigSchema.safeParse({
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

		// Transformar la configuración al formato de la base de datos
		const dbConfig = {
			enabled: config.enabled,
			layerIndex: config.layerIndex,
			pixelSize: config.pixelSize,
			algorithm: config.algorithm,
			applyToSpot: config.applyToSpot || false,
			spotRadius: config.spotRadius,
			spotPositionX: config.spotPosition?.x,
			spotPositionY: config.spotPosition?.y,
			transitionEffect: config.transitionEffect,
			transitionDuration: config.transitionDuration,
			colorReduction: config.colorReduction || false,
			colorLevels: config.colorLevels,
		};

		// Actualizar o crear la configuración
		const updatedConfig = await prisma.layerPixelateConfig.upsert({
			where: {
				entityType_entityId: {
					entityType,
					entityId: entityId || 'default',
				},
			},
			update: {
				...dbConfig,
				isDefault: !entityId,
			},
			create: {
				entityType,
				entityId: entityId || 'default',
				isDefault: !entityId,
				...dbConfig,
			},
		});

		// Revalidar las rutas necesarias
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		// Transformar la configuración de la base de datos al formato esperado
		const transformedConfig: PixelateConfig = {
			enabled: updatedConfig.enabled,
			layerIndex: updatedConfig.layerIndex,
			pixelSize: updatedConfig.pixelSize,
			algorithm: updatedConfig.algorithm as 'simple' | 'weighted' | 'adaptative',
			applyToSpot: updatedConfig.applyToSpot,
			spotRadius: updatedConfig.spotRadius || undefined,
			spotPosition:
				updatedConfig.spotPositionX && updatedConfig.spotPositionY
					? { x: updatedConfig.spotPositionX, y: updatedConfig.spotPositionY }
					: undefined,
			transitionEffect: updatedConfig.transitionEffect as 'none' | 'fade' | 'zoom' | 'slide' | undefined,
			transitionDuration: updatedConfig.transitionDuration || undefined,
			colorReduction: updatedConfig.colorReduction,
			colorLevels: updatedConfig.colorLevels || undefined,
		};

		return {
			success: true,
			message: 'Configuración de pixelate actualizada correctamente',
			data: transformedConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de pixelate:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de pixelate',
		};
	}
}

/**
 * Elimina la configuración del efecto pixelate para una entidad
 */
export async function deletePixelateConfig(entityType: string, entityId?: string): Promise<PixelateConfigResponse> {
	try {
		// Validar parámetros
		const validation = pixelateConfigSchema.safeParse({
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
		await prisma.layerPixelateConfig.delete({
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
			message: 'Configuración de pixelate eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de pixelate:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de pixelate',
		};
	}
}
