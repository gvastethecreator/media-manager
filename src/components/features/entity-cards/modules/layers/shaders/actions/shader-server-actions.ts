'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
// Importar tipos y valores por defecto del archivo de configuración del cliente
import type { ShaderConfig } from './shader-config.action';
import { defaultShaders } from './shader-config.action';

/**
 * Obtiene la configuración de shader para una entidad
 */
export async function getShaderConfig(entityType: string, entityId?: string) {
	try {
		const configKey = entityId ? `${entityType}_${entityId}` : entityType;

		// Buscar configuración en la base de datos
		const config = await prisma.layerConfig.findUnique({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId || 'default',
					layerType: 'shader',
				},
			},
		});

		// Si no existe, devolver configuración por defecto
		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: defaultShaders.distortion, // Configuración por defecto
			};
		}

		return {
			success: true,
			message: 'Configuración obtenida correctamente',
			data: config.config as ShaderConfig,
		};
	} catch (error) {
		console.error('Error al obtener configuración de shader:', error);
		return {
			success: false,
			message: 'Error al obtener configuración',
			error: String(error),
		};
	}
}

/**
 * Actualiza la configuración de shader para una entidad
 */
export async function updateShaderConfig(config: ShaderConfig, entityType: string, entityId?: string) {
	try {
		// Validar y guardar en la base de datos
		await prisma.layerConfig.upsert({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId || 'default',
					layerType: 'shader',
				},
			},
			update: {
				config: config,
			},
			create: {
				entityType,
				entityId: entityId || 'default',
				layerType: 'shader',
				config: config,
			},
		});

		// Revalidar rutas relevantes
		revalidatePath(`/${entityType}${entityId ? `/${entityId}` : ''}`);
		revalidatePath(`/settings/${entityType}${entityId ? `/${entityId}` : ''}`);

		return {
			success: true,
			message: 'Configuración actualizada correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al actualizar configuración de shader:', error);
		return {
			success: false,
			message: 'Error al actualizar configuración',
			error: String(error),
		};
	}
}

/**
 * Elimina la configuración de shader para una entidad
 */
export async function deleteShaderConfig(entityType: string, entityId?: string) {
	try {
		await prisma.layerConfig.delete({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId || 'default',
					layerType: 'shader',
				},
			},
		});

		// Revalidar rutas relevantes
		revalidatePath(`/${entityType}${entityId ? `/${entityId}` : ''}`);
		revalidatePath(`/settings/${entityType}${entityId ? `/${entityId}` : ''}`);

		return {
			success: true,
			message: 'Configuración eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar configuración de shader:', error);
		return {
			success: false,
			message: 'Error al eliminar configuración',
			error: String(error),
		};
	}
}
