'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { PixelateConfig } from '../pixelate-schema';
import { pixelateConfigSchema } from '../pixelate-schema';

/**
 * 🎮 Obtiene la configuración de pixelado para una entidad
 */
export async function getPixelateConfig({
	entityType,
	entityId,
}: {
	entityType: string;
	entityId?: string;
}): Promise<PixelateConfig | null> {
	try {
		// Buscar configuración en la base de datos
		const config = await db.layerConfig.findUnique({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId ?? '',
					layerType: 'pixelate',
				},
			},
		});

		// Si no hay configuración, retornar null
		if (!config) {
			return null;
		}

		// Validar y retornar la configuración
		return pixelateConfigSchema.parse(config.data);
	} catch (error) {
		console.error('Error al obtener configuración de pixelado:', error);
		return null;
	}
}

/**
 * 🎮 Actualiza la configuración de pixelado para una entidad
 */
export async function updatePixelateConfig({
	entityType,
	entityId,
	config,
}: {
	entityType: string;
	entityId?: string;
	config: Partial<PixelateConfig>;
}): Promise<PixelateConfig | null> {
	try {
		// Validar configuración parcial
		const validatedConfig = pixelateConfigSchema.partial().parse(config);

		// Actualizar o crear configuración
		const updatedConfig = await db.layerConfig.upsert({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId ?? '',
					layerType: 'pixelate',
				},
			},
			create: {
				entityType,
				entityId: entityId ?? '',
				layerType: 'pixelate',
				data: validatedConfig,
			},
			update: {
				data: {
					...validatedConfig,
				},
			},
		});

		// Revalidar rutas afectadas
		revalidatePath(`/api/layers/${entityType}/${entityId ?? ''}/pixelate`);
		revalidatePath(`/${entityType}/${entityId ?? ''}`);

		// Validar y retornar la configuración actualizada
		return pixelateConfigSchema.parse(updatedConfig.data);
	} catch (error) {
		console.error('Error al actualizar configuración de pixelado:', error);
		return null;
	}
}

/**
 * 🎮 Elimina la configuración de pixelado para una entidad
 */
export async function deletePixelateConfig({
	entityType,
	entityId,
}: {
	entityType: string;
	entityId?: string;
}): Promise<boolean> {
	try {
		// Eliminar configuración
		await db.layerConfig.delete({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId ?? '',
					layerType: 'pixelate',
				},
			},
		});

		// Revalidar rutas afectadas
		revalidatePath(`/api/layers/${entityType}/${entityId ?? ''}/pixelate`);
		revalidatePath(`/${entityType}/${entityId ?? ''}`);

		return true;
	} catch (error) {
		console.error('Error al eliminar configuración de pixelado:', error);
		return false;
	}
}
