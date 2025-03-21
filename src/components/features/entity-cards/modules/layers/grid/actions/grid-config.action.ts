'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { BaseLayerConfig } from '../../types';

// 🎨 Constantes
export const GRID_TYPES = ['lines', 'dots', 'squares', 'hexagons', 'diamonds'] as const;
export const GRID_COLORS = ['auto', 'primary', 'secondary', 'custom'] as const;

export const BLEND_MODES = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
] as const;

// 🧩 Presets de grids
export const GRID_PRESETS = {
    BLUEPRINT: {
        name: 'Plano técnico',
        description: 'Grid de estilo plano arquitectónico',
        type: 'lines',
        spacing: 20,
        thickness: 1,
        color: '#1a73e8',
        opacity: 0.15,
    },
    GRAPH_PAPER: {
        name: 'Papel cuadriculado',
        description: 'Grid de cuadros estilo papel de matemáticas',
        type: 'squares',
        spacing: 15,
        thickness: 1,
        color: '#202124',
        opacity: 0.08,
    },
    DOT_MATRIX: {
        name: 'Matriz de puntos',
        description: 'Patrón de puntos equidistantes',
        type: 'dots',
        spacing: 20,
        thickness: 2,
        color: '#5f6368',
        opacity: 0.12,
    },
    ISOMETRIC: {
        name: 'Isométrico',
        description: 'Patrón de diamantes para diseño 3D',
        type: 'diamonds',
        spacing: 25,
        thickness: 1,
        color: '#4285f4',
        opacity: 0.1,
    },
    HEXAGONAL: {
        name: 'Panal',
        description: 'Patrón de hexágonos tipo panal',
        type: 'hexagons',
        spacing: 30,
        thickness: 1.5,
        color: '#34a853',
        opacity: 0.12,
    },
};

// 🔄 Interfaz de la configuración
export interface GridConfig extends BaseLayerConfig {
    gridType: typeof GRID_TYPES[number];
    spacing: number;
    thickness: number;
    color: string;
    opacity: number;
    blendMode: typeof BLEND_MODES[number];
    angle: number;
    showSubgrid: boolean;
    subgridDivisions: number;
    subgridOpacity: number;
    animateOnHover: boolean;
    animationSpeed: number;
    colorMode: typeof GRID_COLORS[number];
}

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
export function createDefaultGridConfig(): GridConfig {
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
                data: createDefaultGridConfig(),
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
            data: createDefaultGridConfig(),
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
        console.error('Error al guardar configuración de grid:', error);
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
        // Si no hay ID de entidad, devolver éxito (no había nada que eliminar)
        if (!entityId) {
            return {
                success: true,
                message: 'Configuración eliminada (sólo cliente)',
            };
        }

        // Eliminar la configuración
        await prisma.layerConfig.deleteMany({
            where: {
                entityType,
                entityId,
                layerType: 'grid',
            },
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