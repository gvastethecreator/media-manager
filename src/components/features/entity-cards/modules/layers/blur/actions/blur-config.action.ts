'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { BlurConfig } from '../blur-schema';
import { blurConfigSchema } from '../blur-schema';

/**
 * 🌫️ Obtiene la configuración de desenfoque para una entidad
 */
export async function getBlurConfig({
	entityType,
	entityId,
}: {
	entityType: string;
	entityId?: string;
}): Promise<BlurConfig | null> {
	try {
		// Buscar configuración en la base de datos
		const config = await prisma.layerBlurConfig.findUnique({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId ?? '',
					layerType: 'blur',
				},
			},
		});

		// Si no hay configuración, retornar null
		if (!config) {
			return null;
		}

		// Validar y retornar la configuración
		return blurConfigSchema.parse(config.data);
	} catch (error) {
		console.error('Error al obtener configuración de desenfoque:', error);
		return null;
	}
}

/**
 * 🌫️ Actualiza la configuración de desenfoque para una entidad
 */
export async function updateBlurConfig({
	entityType,
	entityId,
	config,
}: {
	entityType: string;
	entityId?: string;
	config: Partial<BlurConfig>;
}): Promise<BlurConfig | null> {
	try {
		// Validar configuración parcial
		const validatedConfig = blurConfigSchema.partial().parse(config);

		// Actualizar o crear configuración
		const updatedConfig = await prisma.layerBlurConfig.upsert({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId ?? '',
					layerType: 'blur',
				},
			},
			create: {
				entityType,
				entityId: entityId ?? '',
				layerType: 'blur',
				data: validatedConfig,
			},
			update: {
				data: {
					...validatedConfig,
				},
			},
		});

		// Revalidar rutas afectadas
		revalidatePath(`/api/layers/${entityType}/${entityId ?? ''}/blur`);
		revalidatePath(`/${entityType}/${entityId ?? ''}`);

		// Validar y retornar la configuración actualizada
		return blurConfigSchema.parse(updatedConfig.data);
	} catch (error) {
		console.error('Error al actualizar configuración de desenfoque:', error);
		return null;
	}
}

/**
 * 🌫️ Elimina la configuración de desenfoque para una entidad
 */
export async function deleteBlurConfig({
	entityType,
	entityId,
}: {
	entityType: string;
	entityId?: string;
}): Promise<boolean> {
	try {
		// Eliminar configuración
		await prisma.layerBlurConfig.delete({
			where: {
				entityType_entityId_layerType: {
					entityType,
					entityId: entityId ?? '',
					layerType: 'blur',
				},
			},
		});

		// Revalidar rutas afectadas
		revalidatePath(`/api/layers/${entityType}/${entityId ?? ''}/blur`);
		revalidatePath(`/${entityType}/${entityId ?? ''}`);

		return true;
	} catch (error) {
		console.error('Error al eliminar configuración de desenfoque:', error);
		return false;
	}
}
