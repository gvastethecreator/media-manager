'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { BLEND_MODES, DEFAULT_CONFIG, TILE_MODES, type TextureConfig } from '../texture-config-types';

// Esquema de validación
const textureConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean(),
		visibleOnHover: z.boolean(),
		layerIndex: z.number().int().min(0),
		textureUrl: z.string().url(),
		opacity: z.number().min(0).max(1),
		scale: z.number().min(0.1).max(10),
		rotation: z.number().min(-360).max(360),
		blendMode: z.enum(BLEND_MODES),
		offsetX: z.number(),
		offsetY: z.number(),
		tileMode: z.enum(TILE_MODES),
		filters: z.object({
			brightness: z.number().min(0).max(200).optional(),
			contrast: z.number().min(0).max(200).optional(),
			saturation: z.number().min(0).max(200).optional(),
			blur: z.number().min(0).max(20).optional(),
		}).optional(),
	}),
});

interface TextureConfigResponse {
	success: boolean;
	message: string;
	data?: TextureConfig;
}

// 🔍 Obtiene la configuración de textura
export async function getTextureConfig(entityType: string, entityId?: string): Promise<TextureConfigResponse> {
	try {
		const validation = textureConfigSchema.safeParse({
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

		const config = await prisma.layerTextureConfig.findFirst({
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
		console.error('Error al obtener la configuración de textura:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de textura',
		};
	}
}

// 💾 Actualiza la configuración de textura
export async function updateTextureConfig(
	entityType: string,
	config: TextureConfig,
	entityId?: string
): Promise<TextureConfigResponse> {
	try {
		const validation = textureConfigSchema.safeParse({
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

		const updatedConfig = await prisma.layerTextureConfig.upsert({
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
			data: updatedConfig as TextureConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de textura:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de textura',
		};
	}
}

// 🗑️ Elimina la configuración de textura
export async function deleteTextureConfig(entityType: string, entityId?: string): Promise<TextureConfigResponse> {
	try {
		const validation = textureConfigSchema.safeParse({
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

		await prisma.layerTextureConfig.delete({
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
		console.error('Error al eliminar la configuración de textura:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de textura',
		};
	}
}