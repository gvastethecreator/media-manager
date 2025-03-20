import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
    type ActionResponse,
    type BaseVisualConfig,
    type VisualConfigType,
} from '../../../types';
import { 
    type DesignSystemConfig,
    type VisualConfigBase
} from '../../../types/visual-config.types';

const designSystemSchema = z.object({
    preset: z.string(),
    cornerStyle: z.string(),
    elevation: z.number(),
});

const visualConfigSchema = z.object({
    enable3DEffect: z.boolean(),
    designSystem: designSystemSchema,
    enableHolographicEffect: z.boolean(),
    enableGlowEffect: z.boolean(),
    enableAnimatedBorder: z.boolean(),
    enableLightHalo: z.boolean(),
    effects: z.string().nullable(),
    layerSystem: z.object({
        layers: z.array(z.object({
            id: z.string(),
            type: z.string(),
            visible: z.boolean(),
            opacity: z.number(),
        })),
    }),
    states: z.object({
        hover: z.boolean(),
        focus: z.boolean(),
        active: z.boolean(),
    }),
});

/**
 * Obtiene la configuración visual para una entidad
 */
export async function getVisualConfig(
    entityType: VisualConfigType,
    entityId: string
): Promise<ActionResponse<BaseVisualConfig>> {
    try {
        let config: BaseVisualConfig | null = null;

        switch (entityType) {
            case 'folder': {
                const folderConfig = await prisma.folderVisualConfig.findUnique({
                    where: { folder: entityId },
                });

                if (folderConfig) {
                    config = {
                        ...folderConfig,
                        designSystem: folderConfig.designSystem ? JSON.parse(folderConfig.designSystem) : null,
                    } as BaseVisualConfig;
                }
                break;
            }
            case 'image': {
                const imageConfig = await prisma.imageVisualConfig.findUnique({
                    where: { image: entityId },
                });

                if (imageConfig) {
                    config = {
                        ...imageConfig,
                        designSystem: imageConfig.designSystem ? JSON.parse(imageConfig.designSystem) : null,
                    } as BaseVisualConfig;
                }
                break;
            }
            case 'video': {
                const videoConfig = await prisma.videoVisualConfig.findUnique({
                    where: { video: entityId },
                });

                if (videoConfig) {
                    config = {
                        ...videoConfig,
                        designSystem: videoConfig.designSystem ? JSON.parse(videoConfig.designSystem) : null,
                    } as BaseVisualConfig;
                }
                break;
            }
            default:
                throw new Error(`Tipo de entidad no soportado: ${entityType}`);
        }

        if (!config) {
            return {
                success: false,
                message: 'No se encontró la configuración visual',
                data: null,
            };
        }

        const validation = visualConfigSchema.safeParse(config);

        if (!validation.success) {
            return {
                success: false,
                message: 'Error de validación',
                data: validation.error,
            };
        }

        return {
            success: true,
            message: 'Configuración visual obtenida correctamente',
            data: config,
        };
    } catch (error) {
        logger.error('Error al obtener la configuración visual:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: 'Error de validación',
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
