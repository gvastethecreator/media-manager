import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import type { ActionResponse } from '@/types/actions';
import { visualConfigSchema } from '../../../types/visual-config.types';
import type { VisualConfig } from '../../../types/visual-config.types';

/**
 * Actualiza la configuración visual de una entidad
 * @param entityId - ID de la entidad
 * @param entityType - Tipo de entidad (folder, image, video)
 * @param config - Nueva configuración visual
 */
export async function updateVisualConfig(
	entityId: string,
	entityType: 'folder' | 'image' | 'video',
	config: VisualConfig
): Promise<ActionResponse<VisualConfig>> {
	try {
		const validation = visualConfigSchema.safeParse(config);
		if (!validation.success) {
			serverLogger.error('Error de validación en configuración visual', {
				error: validation.error,
				entityId,
				entityType,
				config,
			});
			return {
				success: false,
				message: 'Error de validación',
				data: validation.error,
			};
		}

		const validatedConfig = validation.data;
		let updatedConfig: VisualConfig | null = null;

		switch (entityType) {
			case 'folder': {
				const result = await prisma.folderVisualConfig.upsert({
					where: { folder: { id: entityId } },
					create: {
						...validatedConfig,
						folder: { connect: { id: entityId } },
						designSystem: validatedConfig.designSystem ? JSON.stringify(validatedConfig.designSystem) : null,
					},
					update: {
						...validatedConfig,
						designSystem: validatedConfig.designSystem ? JSON.stringify(validatedConfig.designSystem) : null,
					},
				});
				updatedConfig = {
					...result,
					designSystem: result.designSystem ? JSON.parse(result.designSystem) : null,
				};
				break;
			}
			case 'image': {
				const result = await prisma.imageVisualConfig.upsert({
					where: { image: { id: entityId } },
					create: {
						...validatedConfig,
						image: { connect: { id: entityId } },
						designSystem: validatedConfig.designSystem ? JSON.stringify(validatedConfig.designSystem) : null,
					},
					update: {
						...validatedConfig,
						designSystem: validatedConfig.designSystem ? JSON.stringify(validatedConfig.designSystem) : null,
					},
				});
				updatedConfig = {
					...result,
					designSystem: result.designSystem ? JSON.parse(result.designSystem) : null,
				};
				break;
			}
			case 'video': {
				const result = await prisma.videoVisualConfig.upsert({
					where: { video: { id: entityId } },
					create: {
						...validatedConfig,
						video: { connect: { id: entityId } },
						designSystem: validatedConfig.designSystem ? JSON.stringify(validatedConfig.designSystem) : null,
					},
					update: {
						...validatedConfig,
						designSystem: validatedConfig.designSystem ? JSON.stringify(validatedConfig.designSystem) : null,
					},
				});
				updatedConfig = {
					...result,
					designSystem: result.designSystem ? JSON.parse(result.designSystem) : null,
				};
				break;
			}
		}

		if (!updatedConfig) {
			serverLogger.error('Error al actualizar configuración visual', {
				error: 'No se pudo actualizar la configuración',
				entityId,
				entityType,
				config,
			});
			return {
				success: false,
				message: 'Error al actualizar configuración visual',
				data: null,
			};
		}

		return {
			success: true,
			message: 'Configuración visual actualizada correctamente',
			data: updatedConfig,
		};
	} catch (error) {
		serverLogger.error('Error al actualizar configuración visual', {
			error,
			entityId,
			entityType,
			config,
		});
		return {
			success: false,
			message: 'Error al actualizar configuración visual',
			data: error,
		};
	}
}
