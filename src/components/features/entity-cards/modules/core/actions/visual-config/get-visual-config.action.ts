import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import type { ActionResponse } from '@/types/actions';
import { visualConfigSchema } from '../../../types/visual-config.types';
import type { VisualConfig } from '../../../types/visual-config.types';

/**
 * Obtiene la configuración visual para una entidad
 * @param entityId - ID de la entidad
 * @param entityType - Tipo de entidad (folder, image, video)
 */
export async function getVisualConfig(
	entityId: string,
	entityType: 'folder' | 'image' | 'video'
): Promise<ActionResponse<VisualConfig>> {
	try {
		let config: VisualConfig | null = null;

		switch (entityType) {
			case 'folder': {
				const folderConfig = await prisma.folderVisualConfig.findFirst({
					where: { folder: { id: entityId } },
				});
				if (folderConfig) {
					config = {
						...folderConfig,
						designSystem: folderConfig.designSystem ? JSON.parse(folderConfig.designSystem) : null,
					};
				}
				break;
			}
			case 'image': {
				const imageConfig = await prisma.imageVisualConfig.findFirst({
					where: { image: { id: entityId } },
				});
				if (imageConfig) {
					config = {
						...imageConfig,
						designSystem: imageConfig.designSystem ? JSON.parse(imageConfig.designSystem) : null,
					};
				}
				break;
			}
			case 'video': {
				const videoConfig = await prisma.videoVisualConfig.findFirst({
					where: { video: { id: entityId } },
				});
				if (videoConfig) {
					config = {
						...videoConfig,
						designSystem: videoConfig.designSystem ? JSON.parse(videoConfig.designSystem) : null,
					};
				}
				break;
			}
		}

		if (!config) {
			return {
				success: false,
				message: 'No se encontró configuración visual',
				data: null,
			};
		}

		const validation = visualConfigSchema.safeParse(config);
		if (!validation.success) {
			serverLogger.error('Error de validación en configuración visual', {
				error: validation.error,
				entityId,
				entityType,
			});
			return {
				success: false,
				message: 'Error de validación',
				data: validation.error,
			};
		}

		return {
			success: true,
			message: 'Configuración visual obtenida correctamente',
			data: validation.data,
		};
	} catch (error) {
		serverLogger.error('Error al obtener configuración visual', {
			error,
			entityId,
			entityType,
		});
		return {
			success: false,
			message: 'Error al obtener configuración visual',
			data: error,
		};
	}
}
