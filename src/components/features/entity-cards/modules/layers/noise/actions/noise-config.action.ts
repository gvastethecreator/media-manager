'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { type NoiseConfig, noiseConfigSchema } from '../noise-schema';

/**
 * 📥 Obtiene la configuración de ruido para una entidad
 */
export async function getNoiseConfig({
	entityType,
	entityId,
}: {
	entityType: string;
	entityId: string;
}): Promise<NoiseConfig | null> {
	try {
		const config = await db.layerConfig.findUnique({
			where: {
				entityType_entityId_type: {
					entityType,
					entityId,
					type: 'noise',
				},
			},
			select: {
				config: true,
			},
		});

		if (!config) return null;

		const parsedConfig = noiseConfigSchema.safeParse(config.config);
		if (!parsedConfig.success) {
			console.error('Error validating noise config:', parsedConfig.error);
			return null;
		}

		return parsedConfig.data;
	} catch (error) {
		console.error('Error getting noise config:', error);
		return null;
	}
}

/**
 * 📤 Actualiza la configuración de ruido para una entidad
 */
export async function updateNoiseConfig({
	entityType,
	entityId,
	config,
}: {
	entityType: string;
	entityId: string;
	config: Partial<NoiseConfig>;
}): Promise<boolean> {
	try {
		const currentConfig = await getNoiseConfig({ entityType, entityId });
		const newConfig = { ...currentConfig, ...config };

		const parsedConfig = noiseConfigSchema.safeParse(newConfig);
		if (!parsedConfig.success) {
			console.error('Error validating noise config:', parsedConfig.error);
			return false;
		}

		await db.layerConfig.upsert({
			where: {
				entityType_entityId_type: {
					entityType,
					entityId,
					type: 'noise',
				},
			},
			create: {
				entityType,
				entityId,
				type: 'noise',
				config: parsedConfig.data,
			},
			update: {
				config: parsedConfig.data,
			},
		});

		revalidatePath(`/entities/${entityType}/${entityId}`);
		return true;
	} catch (error) {
		console.error('Error updating noise config:', error);
		return false;
	}
}

/**
 * 🗑️ Elimina la configuración de ruido para una entidad
 */
export async function deleteNoiseConfig({
	entityType,
	entityId,
}: {
	entityType: string;
	entityId: string;
}): Promise<boolean> {
	try {
		await db.layerConfig.delete({
			where: {
				entityType_entityId_type: {
					entityType,
					entityId,
					type: 'noise',
				},
			},
		});

		revalidatePath(`/entities/${entityType}/${entityId}`);
		return true;
	} catch (error) {
		console.error('Error deleting noise config:', error);
		return false;
	}
}
