'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Importar tipos y configuraciones del archivo de cliente
import { distortionConfigSchema, type DistortionConfig, defaultDistortionConfig } from './distortion-config.action';

// 🌐 Interfaces para las respuestas
interface DistortionConfigResponse {
	success: boolean;
	message: string;
	data?: DistortionConfig;
}

/**
 * Obtiene la configuración de distorsión para una entidad
 */
export async function getDistortionConfig(entityType: string, entityId?: string): Promise<DistortionConfigResponse> {
	try {
		let config: DistortionConfig | null = null;

		// Buscar configuración específica para la entidad
		if (entityId) {
			const layerConfig = await prisma.layerConfig.findUnique({
				where: {
					entityType_entityId_layerType: {
						entityType,
						entityId,
						layerType: 'distortion',
					},
				},
			});

			if (layerConfig) {
				config = layerConfig.config as DistortionConfig;
			}
		}

		// Si no hay configuración específica, buscar la predeterminada
		if (!config) {
			const defaultLayerConfig = await prisma.layerConfig.findUnique({
				where: {
					entityType_entityId_layerType: {
						entityType,
						entityId: 'default',
						layerType: 'distortion',
					},
				},
			});

			if (defaultLayerConfig) {
				config = defaultLayerConfig.config as DistortionConfig;
			}
		}

		// Si no hay ninguna configuración, usar la predeterminada
		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: defaultDistortionConfig,
			};
		}

		return {
			success: true,
			message: 'Configuración de distorsión obtenida correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de distorsión:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de distorsión',
		};
	}
}

/**
 * Actualiza la configuración de distorsión para una entidad
 */
export async function updateDistortionConfig(
	entityType: string,
	config: DistortionConfig,
	entityId?: string
): Promise<DistortionConfigResponse> {
	try {
		// Validar la configuración
		const validation = distortionConfigSchema.safeParse(config);

		if (!validation.success) {
			return {
				success: false,
				message: 'Configuración inválida',
			};
		}

		// Actualizar o crear la configuración
		await prisma.layerConfig.upsert({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId || 'default',
					layerType: 'distortion',
				},
			},
			update: {
				config,
			},
			create: {
				entityType,
				entityId: entityId || 'default',
				layerType: 'distortion',
				config,
			},
		});

		// Revalidar rutas relevantes
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de distorsión actualizada correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de distorsión:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de distorsión',
		};
	}
}

/**
 * Elimina la configuración de distorsión para una entidad
 */
export async function deleteDistortionConfig(entityType: string, entityId?: string): Promise<DistortionConfigResponse> {
	try {
		// Eliminar la configuración
		await prisma.layerConfig.delete({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId || 'default',
					layerType: 'distortion',
				},
			},
		});

		// Revalidar rutas relevantes
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de distorsión eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de distorsión:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de distorsión',
		};
	}
}
