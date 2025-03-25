'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { BLEND_MODES, GRID_COLORS, GRID_TYPES, type GridConfig } from '../grid-config-types';

// ✅ Esquema de validación
const gridConfigSchema = z.object({
    enabled: z.boolean(),
    visibleOnHover: z.boolean().optional(),
    layerIndex: z.number().int().min(0),
    gridType: z.enum(GRID_TYPES),
    spacing: z.number().min(5).max(100),
    thickness: z.number().min(0.5).max(10),
    color: z.string(),
    opacity: z.number().min(0).max(1),
    blendMode: z.enum(BLEND_MODES),
    angle: z.number().min(0).max(360).optional(),
    showSubgrid: z.boolean().optional(),
    subgridDivisions: z.number().int().min(2).max(10).optional(),
    subgridOpacity: z.number().min(0).max(1).optional(),
    animateOnHover: z.boolean().optional(),
    animationSpeed: z.number().min(0).max(10).optional(),
    colorMode: z.enum(GRID_COLORS).optional(),
});

// 🔄 Interfaz de respuesta
interface GridConfigResponse {
    success: boolean;
    message: string;
    data?: GridConfig;
}

/**
 * Crea una configuración predeterminada para la capa grid
 */
export async function createDefaultGridConfig(): Promise<GridConfig> {
    return {
        enabled: true,
        visibleOnHover: false,
        layerIndex: 1,
        gridType: 'lines',
        spacing: 20,
        thickness: 1,
        color: '#000000',
        opacity: 0.1,
        blendMode: 'normal',
        angle: 0,
        showSubgrid: false,
        subgridDivisions: 2,
        subgridOpacity: 0.05,
        animateOnHover: false,
        animationSpeed: 1,
        colorMode: 'auto',
    };
}

/**
 * Obtiene la configuración de grid para una entidad
 */
export async function getGridConfig(entityType: string, entityId?: string): Promise<GridConfigResponse> {
    try {
        // Si no hay ID de entidad, devolver configuración predeterminada
        if (!entityId) {
            return {
                success: true,
                message: 'Configuración predeterminada cargada',
                data: await createDefaultGridConfig(),
            };
        }

        // Buscar configuración existente
        const existingConfig = await prisma.layerConfig.findFirst({
            where: {
                entityType,
                entityId,
                layerType: 'grid',
            },
        });

        // Si existe, devolver la configuración
        if (existingConfig && existingConfig.config) {
            return {
                success: true,
                message: 'Configuración cargada',
                data: existingConfig.config as unknown as GridConfig,
            };
        }

        // Si no existe, devolver configuración predeterminada
        return {
            success: true,
            message: 'Configuración predeterminada cargada',
            data: await createDefaultGridConfig(),
        };
    } catch (error) {
        console.error('Error al obtener configuración de grid:', error);
        return {
            success: false,
            message: 'Error al cargar la configuración',
        };
    }
}

/**
 * Actualiza la configuración de grid para una entidad
 */
export async function updateGridConfig(
    entityType: string,
    config: GridConfig,
    entityId?: string
): Promise<GridConfigResponse> {
    try {
        // Validar la configuración
        const validationResult = gridConfigSchema.safeParse(config);
        if (!validationResult.success) {
            return {
                success: false,
                message: 'Configuración inválida: ' + JSON.stringify(validationResult.error.errors),
            };
        }

        // Si no hay ID de entidad, simplemente devolver la configuración validada
        if (!entityId) {
            return {
                success: true,
                message: 'Configuración actualizada (sólo cliente)',
                data: config,
            };
        }

        // Buscar configuración existente
        const existingConfig = await prisma.layerConfig.findFirst({
            where: {
                entityType,
                entityId,
                layerType: 'grid',
            },
        });

        // Actualizar o crear la configuración
        if (existingConfig) {
            await prisma.layerConfig.update({
                where: { id: existingConfig.id },
                data: { config: config as any },
            });
        } else {
            await prisma.layerConfig.create({
                data: {
                    entityType,
                    entityId,
                    layerType: 'grid',
                    config: config as any,
                },
            });
        }

        // Revalidar la ruta
        revalidatePath(`/${entityType}/${entityId}`);

        return {
            success: true,
            message: 'Configuración guardada',
            data: config,
        };
    } catch (error) {
        console.error('Error al actualizar configuración de grid:', error);
        return {
            success: false,
            message: 'Error al guardar la configuración',
        };
    }
}

/**
 * Elimina la configuración de grid para una entidad
 */
export async function deleteGridConfig(entityType: string, entityId?: string): Promise<GridConfigResponse> {
    try {
        // Si no hay ID de entidad, no se puede eliminar
        if (!entityId) {
            return {
                success: false,
                message: 'No se especificó el ID de la entidad',
            };
        }

        // Buscar y eliminar la configuración
        const existingConfig = await prisma.layerConfig.findFirst({
            where: {
                entityType,
                entityId,
                layerType: 'grid',
            },
        });

        if (!existingConfig) {
            return {
                success: false,
                message: 'La configuración no existe',
            };
        }

        await prisma.layerConfig.delete({
            where: { id: existingConfig.id },
        });

        // Revalidar la ruta
        revalidatePath(`/${entityType}/${entityId}`);

        return {
            success: true,
            message: 'Configuración eliminada',
        };
    } catch (error) {
        console.error('Error al eliminar configuración de grid:', error);
        return {
            success: false,
            message: 'Error al eliminar la configuración',
        };
    }
}