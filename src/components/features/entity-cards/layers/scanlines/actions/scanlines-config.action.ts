'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { BaseLayerConfig } from '../../types';

const scanlinesConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean(),
		opacity: z.number().min(0).max(1),
		color: z.string(),
		spacing: z.number().min(1),
		thickness: z.number().min(0.1),
		angle: z.number().min(-180).max(180),
		animated: z.boolean().optional(),
		animationSpeed: z.number().min(0).optional(),
		blend: z.enum(['normal', 'overlay', 'multiply', 'screen']).optional(),
	}),
});

export type ScanlinesConfig = z.infer<typeof scanlinesConfigSchema>['config'];

interface ScanlinesConfigResponse {
	success: boolean;
	message: string;
	data?: ScanlinesConfig;
}

export async function getScanlinesConfig(entityType: string, entityId?: string): Promise<ScanlinesConfigResponse> {
	try {
		const validation = scanlinesConfigSchema.safeParse({
			entityType,
			entityId,
			config: {},
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
			};
		}

		let config: ScanlinesConfig | null = null;

		if (entityId) {
			config = await prisma.layerScanlinesConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			});
		}

		if (!config) {
			config = await prisma.layerScanlinesConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			});
		}

		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: {
					enabled: true,
					opacity: 0.3,
					color: '#000000',
					spacing: 2,
					thickness: 0.5,
					angle: 0,
					animated: false,
					animationSpeed: 1,
					blend: 'overlay',
				},
			};
		}

		return {
			success: true,
			message: 'Configuración de scanlines obtenida correctamente',
			data: config as ScanlinesConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de scanlines:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de scanlines',
		};
	}
}

export async function updateScanlinesConfig(
	entityType: string,
	config: ScanlinesConfig,
	entityId?: string
): Promise<ScanlinesConfigResponse> {
	try {
		const validation = scanlinesConfigSchema.safeParse({
			entityType,
			entityId,
			config,
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
			};
		}

		const updatedConfig = await prisma.layerScanlinesConfig.upsert({
			where: {
				entityType_entityId: {
					entityType,
					entityId: entityId || 'default',
				},
			},
			update: {
				...config,
				isDefault: !entityId,
			},
			create: {
				entityType,
				entityId: entityId || 'default',
				isDefault: !entityId,
				...config,
			},
		});

		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de scanlines actualizada correctamente',
			data: updatedConfig as ScanlinesConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de scanlines:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de scanlines',
		};
	}
}

export async function deleteScanlinesConfig(entityType: string, entityId?: string): Promise<ScanlinesConfigResponse> {
	try {
		const validation = scanlinesConfigSchema.safeParse({
			entityType,
			entityId,
			config: {},
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
			};
		}

		await prisma.layerScanlinesConfig.delete({
			where: {
				entityType_entityId: {
					entityType,
					entityId: entityId || 'default',
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
			message: 'Configuración de scanlines eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de scanlines:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de scanlines',
		};
	}
}

export interface ScanlinesConfig extends BaseLayerConfig {
	opacity: number;
	lineWidth: number;
	lineSpacing: number;
	speed: number;
	color: string;
	blendMode: string;
	direction: 'horizontal' | 'vertical';
	animated: boolean;
	offset: number;
}

// 🔍 Obtiene la configuración de líneas de escaneo para una entidad
export async function getScanlinesConfig(entityId: string): Promise<ScanlinesConfig | null> {
	try {
		// TODO: Implementar la lógica de base de datos
		return null;
	} catch (error) {
		console.error('Error al obtener la configuración de líneas de escaneo:', error);
		return null;
	}
}

// 💾 Actualiza la configuración de líneas de escaneo para una entidad
export async function updateScanlinesConfig(
	entityId: string,
	config: Partial<ScanlinesConfig>
): Promise<boolean> {
	try {
		// TODO: Implementar la lógica de base de datos
		return true;
	} catch (error) {
		console.error('Error al actualizar la configuración de líneas de escaneo:', error);
		return false;
	}
}

// 🗑️ Elimina la configuración de líneas de escaneo para una entidad
export async function deleteScanlinesConfig(entityId: string): Promise<boolean> {
	try {
		// TODO: Implementar la lógica de base de datos
		return true;
	} catch (error) {
		console.error('Error al eliminar la configuración de líneas de escaneo:', error);
		return false;
	}
}

// 🎨 Modos de fusión disponibles
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

// 📏 Direcciones de líneas disponibles
export const LINE_DIRECTIONS = [
	'horizontal',
	'vertical',
] as const;

// 🎨 Colores predefinidos
export const PRESET_COLORS = {
	BLACK: 'rgba(0, 0, 0, 0.1)',
	WHITE: 'rgba(255, 255, 255, 0.1)',
	RED: 'rgba(255, 0, 0, 0.1)',
	GREEN: 'rgba(0, 255, 0, 0.1)',
	BLUE: 'rgba(0, 0, 255, 0.1)',
	CYAN: 'rgba(0, 255, 255, 0.1)',
	MAGENTA: 'rgba(255, 0, 255, 0.1)',
	YELLOW: 'rgba(255, 255, 0, 0.1)',
} as const;
