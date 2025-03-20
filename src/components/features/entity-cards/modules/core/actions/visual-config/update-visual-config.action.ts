import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionResponse, BaseVisualConfig, VisualConfigType } from '../../../types';
import type { DesignSystemConfig, VisualConfigBase } from '../../../types/visual-config.types';

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
 * Actualiza la configuración visual para una entidad
 */
export async function updateVisualConfig(
    entityType: VisualConfigType,
    entityId: string,
    config: Partial<VisualConfigBase>
): Promise<ActionResponse<BaseVisualConfig>> {
    const validation = visualConfigSchema.partial().safeParse(config);

    if (!validation.success) {
        return {
            success: false,
            message: 'Error de validación',
            data: validation.error,
        };
    }

    try {
        let updatedConfig: BaseVisualConfig;

        switch (entityType) {
            case 'folder': {
                const existingConfig = await prisma.folderVisualConfig.findUnique({
                    where: { folder: entityId },
                });

                if (existingConfig) {
                    updatedConfig = await prisma.folderVisualConfig.update({
                        where: { folder: entityId },
                        data: {
                            ...config,
                            designSystem: config.designSystem ? JSON.stringify(config.designSystem) : undefined,
                        },
                    });
                } else {
                    updatedConfig = await prisma.folderVisualConfig.create({
                        data: {
                            folder: entityId,
                            ...config,
                            designSystem: config.designSystem ? JSON.stringify(config.designSystem) : null,
                        },
                    });
                }
                break;
            }
            case 'image': {
                const existingConfig = await prisma.imageVisualConfig.findUnique({
                    where: { image: entityId },
                });

                if (existingConfig) {
                    updatedConfig = await prisma.imageVisualConfig.update({
                        where: { image: entityId },
                        data: {
                            ...config,
                            designSystem: config.designSystem ? JSON.stringify(config.designSystem) : undefined,
                        },
                    });
                } else {
                    updatedConfig = await prisma.imageVisualConfig.create({
                        data: {
                            image: entityId,
                            ...config,
                            designSystem: config.designSystem ? JSON.stringify(config.designSystem) : null,
                        },
                    });
                }
                break;
            }
            case 'video': {
                const existingConfig = await prisma.videoVisualConfig.findUnique({
                    where: { video: entityId },
                });

                if (existingConfig) {
                    updatedConfig = await prisma.videoVisualConfig.update({
                        where: { video: entityId },
                        data: {
                            ...config,
                            designSystem: config.designSystem ? JSON.stringify(config.designSystem) : undefined,
                        },
                    });
                } else {
                    updatedConfig = await prisma.videoVisualConfig.create({
                        data: {
                            video: entityId,
                            ...config,
                            designSystem: config.designSystem ? JSON.stringify(config.designSystem) : null,
                        },
                    });
                }
                break;
            }
            default:
                throw new Error(`Tipo de entidad no soportado: ${entityType}`);
        }

        revalidatePath('/');

        return {
            success: true,
            message: 'Configuración visual actualizada correctamente',
            data: {
                ...updatedConfig,
                designSystem: updatedConfig.designSystem ? JSON.parse(updatedConfig.designSystem) : null,
            },
        };
    } catch (error) {
        logger.error('Error al actualizar la configuración visual:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: 'Error de validación',
                data: error.errors,
            };
        }

        return {
            success: false,
            message: 'Error al actualizar la configuración visual',
            data: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}
