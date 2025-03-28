'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Importar tipos y configuraciones del archivo de cliente
import { defaultPatternConfig, patternConfigSchema, type PatternConfig } from './pattern-config.action';

interface PatternConfigResponse {
	success: boolean;
	message: string;
	data?: PatternConfig;
}

/**
 * Obtiene la configuración de patrones para una entidad
 */
export async function getPatternConfig(entityType: string, entityId?: string): Promise<PatternConfigResponse> {
	try {
		// Buscar configuración específica para la entidad
		let config: PatternConfig | null = null;

		if (entityId) {
			const layerConfig = await prisma.layerConfig.findUnique({
				where: {
					entityType_entityId_layerType: {
						entityType,
						entityId,
						layerType: 'pattern',
					},
				},
			});

			if (layerConfig) {
				config = layerConfig.config as PatternConfig;
			}
		}

		// Si no hay configuración específica, buscar la predeterminada
		if (!config) {
			const defaultLayerConfig = await prisma.layerConfig.findUnique({
				where: {
					entityType_entityId_layerType: {
						entityType,
						entityId: 'default',
						layerType: 'pattern',
					},
				},
			});

			if (defaultLayerConfig) {
				config = defaultLayerConfig.config as PatternConfig;
			}
		}

		// Si no hay ninguna configuración, usar la predeterminada
		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: defaultPatternConfig,
			};
		}

		return {
			success: true,
			message: 'Configuración de patrones obtenida correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de patrones:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de patrones',
		};
	}
}

/**
 * Actualiza la configuración de patrones para una entidad
 */
export async function updatePatternConfig(
	entityType: string,
	config: PatternConfig,
	entityId?: string
): Promise<PatternConfigResponse> {
	try {
		// Validar la configuración
		const validation = patternConfigSchema.safeParse(config);

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
					layerType: 'pattern',
				},
			},
			update: {
				config,
			},
			create: {
				entityType,
				entityId: entityId || 'default',
				layerType: 'pattern',
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
			message: 'Configuración de patrones actualizada correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de patrones:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de patrones',
		};
	}
}

/**
 * Elimina la configuración de patrones para una entidad
 */
export async function deletePatternConfig(entityType: string, entityId?: string): Promise<PatternConfigResponse> {
	try {
		// Eliminar la configuración
		await prisma.layerConfig.delete({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId || 'default',
					layerType: 'pattern',
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
			message: 'Configuración de patrones eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de patrones:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de patrones',
		};
	}
}
