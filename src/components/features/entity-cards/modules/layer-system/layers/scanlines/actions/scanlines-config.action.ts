'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { BaseLayerConfig } from '../../types';

// 🎨 Constantes
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
	'hue',
	'saturation',
	'color',
	'luminosity',
] as const;

export const LINE_DIRECTIONS = ['horizontal', 'vertical'] as const;

export const PRESET_COLORS = {
	BLACK: '#000000',
	WHITE: '#FFFFFF',
	RED: '#FF0000',
	GREEN: '#00FF00',
	BLUE: '#0000FF',
	CYAN: '#00FFFF',
	MAGENTA: '#FF00FF',
	YELLOW: '#FFFF00',
} as const;

// 📝 Tipos y esquemas
export interface ScanlinesConfig extends BaseLayerConfig {
	opacity: number;
	lineWidth: number;
	lineSpacing: number;
	speed: number;
	color: string;
	blendMode: typeof BLEND_MODES[number];
	direction: typeof LINE_DIRECTIONS[number];
	animated: boolean;
	offset: number;
}

const scanlinesConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean(),
		visibleOnHover: z.boolean(),
		layerIndex: z.number().int().min(0),
		opacity: z.number().min(0).max(1),
		lineWidth: z.number().min(0.5).max(5),
		lineSpacing: z.number().min(1).max(20),
		speed: z.number().min(0).max(10),
		color: z.string(),
		blendMode: z.enum(BLEND_MODES),
		direction: z.enum(LINE_DIRECTIONS),
		animated: z.boolean(),
		offset: z.number().min(-20).max(20),
	}),
});

interface ScanlinesConfigResponse {
	success: boolean;
	message: string;
	data?: ScanlinesConfig;
}

// 🔍 Configuración por defecto
const DEFAULT_CONFIG: ScanlinesConfig = {
	enabled: true,
	visibleOnHover: false,
	layerIndex: 3,
	opacity: 0.15,
	lineWidth: 1,
	lineSpacing: 3,
	speed: 0,
	color: PRESET_COLORS.BLACK,
	blendMode: 'multiply',
	direction: 'horizontal',
	animated: false,
	offset: 0,
};

// 🔍 Obtiene la configuración de líneas de escaneo
export async function getScanlinesConfig(entityType: string, entityId?: string): Promise<ScanlinesConfigResponse> {
	try {
		const validation = scanlinesConfigSchema.safeParse({
			entityType,
			entityId,
			config: DEFAULT_CONFIG,
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
			};
		}

		const config = await prisma.layerScanlinesConfig.findFirst({
			where: entityId
				? { entityType, entityId }
				: { entityType, isDefault: true },
		});

		return {
			success: true,
			message: config ? 'Configuración obtenida correctamente' : 'Usando configuración por defecto',
			data: config ?? DEFAULT_CONFIG,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de scanlines:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de scanlines',
		};
	}
}

// 💾 Actualiza la configuración de líneas de escaneo
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

		// Revalidar rutas afectadas
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración actualizada correctamente',
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

// 🗑️ Elimina la configuración de líneas de escaneo
export async function deleteScanlinesConfig(entityType: string, entityId?: string): Promise<ScanlinesConfigResponse> {
	try {
		const validation = scanlinesConfigSchema.safeParse({
			entityType,
			entityId,
			config: DEFAULT_CONFIG,
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

		// Revalidar rutas afectadas
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración eliminada correctamente',
			data: DEFAULT_CONFIG,
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de scanlines:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de scanlines',
		};
	}
}
