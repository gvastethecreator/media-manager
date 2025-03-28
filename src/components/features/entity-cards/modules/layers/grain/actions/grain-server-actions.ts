'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Importar tipos y configuraciones del archivo de cliente
import { defaultGrainConfig, grainConfigSchema, type GrainConfig } from './grain-config.action';

interface GrainConfigResponse {
	success: boolean;
	message: string;
	data?: GrainConfig;
}

export async function getGrainConfig(entityType: string, entityId?: string): Promise<GrainConfigResponse> {
	try {
		const validation = grainConfigSchema.safeParse({
			enabled: true,
			intensity: 0.3,
			size: 1.0,
			animated: false,
			speed: 1.0,
			colorMode: 'monochrome',
			opacity: 0.5,
			blend: 'overlay',
			seed: 42,
			pattern: 'perlin',
			fractalNoise: false,
			roughness: 0.5,
			octaves: 3,
			layerIndex: 4,
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
			};
		}

		let config: GrainConfig | null = null;

		if (entityId) {
			const layerConfig = await prisma.layerConfig.findUnique({
				where: {
					entityType_entityId_layerType: {
						entityType,
						entityId,
						layerType: 'grain',
					},
				},
			});

			if (layerConfig) {
				config = layerConfig.config as GrainConfig;
			}
		}

		if (!config) {
			const defaultLayerConfig = await prisma.layerConfig.findUnique({
				where: {
					entityType_entityId_layerType: {
						entityType,
						entityId: 'default',
						layerType: 'grain',
					},
				},
			});

			if (defaultLayerConfig) {
				config = defaultLayerConfig.config as GrainConfig;
			}
		}

		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: defaultGrainConfig,
			};
		}

		return {
			success: true,
			message: 'Configuración de grain obtenida correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de grain:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de grain',
		};
	}
}

export async function updateGrainConfig(
	entityType: string,
	config: GrainConfig,
	entityId?: string
): Promise<GrainConfigResponse> {
	try {
		const validation = grainConfigSchema.safeParse(config);

		if (!validation.success) {
			return {
				success: false,
				message: 'Configuración inválida',
			};
		}

		await prisma.layerConfig.upsert({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId || 'default',
					layerType: 'grain',
				},
			},
			update: {
				config,
			},
			create: {
				entityType,
				entityId: entityId || 'default',
				layerType: 'grain',
				config,
			},
		});

		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de grain actualizada correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de grain:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de grain',
		};
	}
}

export async function deleteGrainConfig(entityType: string, entityId?: string): Promise<GrainConfigResponse> {
	try {
		await prisma.layerConfig.delete({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId || 'default',
					layerType: 'grain',
				},
			},
		});

		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de grain eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de grain:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de grain',
		};
	}
}
