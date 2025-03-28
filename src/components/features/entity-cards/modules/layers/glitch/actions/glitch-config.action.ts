'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { type GlitchConfig, glitchConfigSchema } from '../glitch-schema';

/**
 * 📥 Obtiene la configuración de glitch para una entidad
 */
export async function getGlitchConfig({
	entityType,
	entityId,
}: {
	entityType: string;
	entityId: string;
}): Promise<GlitchConfig | null> {
	try {
		const config = await db.layerConfig.findUnique({
			where: {
				entityType_entityId_type: {
					entityType,
					entityId,
					type: 'glitch',
				},
			},
			select: {
				config: true,
			},
		});

		if (!config) return null;

		const parsedConfig = glitchConfigSchema.safeParse(config.config);
		if (!parsedConfig.success) {
			console.error('Error validando configuración de glitch:', parsedConfig.error);
			return null;
		}

		return parsedConfig.data;
	} catch (error) {
		console.error('Error obteniendo configuración de glitch:', error);
		return null;
	}
}

/**
 * 📤 Actualiza la configuración de glitch para una entidad
 */
export async function updateGlitchConfig({
	entityType,
	entityId,
	config,
}: {
	entityType: string;
	entityId: string;
	config: Partial<GlitchConfig>;
}): Promise<boolean> {
	try {
		const currentConfig = await getGlitchConfig({ entityType, entityId });
		const newConfig = { ...currentConfig, ...config };

		const parsedConfig = glitchConfigSchema.safeParse(newConfig);
		if (!parsedConfig.success) {
			console.error('Error validando configuración de glitch:', parsedConfig.error);
			return false;
		}

		await db.layerConfig.upsert({
			where: {
				entityType_entityId_type: {
					entityType,
					entityId,
					type: 'glitch',
				},
			},
			create: {
				entityType,
				entityId,
				type: 'glitch',
				config: parsedConfig.data,
			},
			update: {
				config: parsedConfig.data,
			},
		});

		revalidatePath(`/entities/${entityType}/${entityId}`);
		return true;
	} catch (error) {
		console.error('Error actualizando configuración de glitch:', error);
		return false;
	}
}

/**
 * 🗑️ Elimina la configuración de glitch para una entidad
 */
export async function deleteGlitchConfig({
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
					type: 'glitch',
				},
			},
		});

		revalidatePath(`/entities/${entityType}/${entityId}`);
		return true;
	} catch (error) {
		console.error('Error eliminando configuración de glitch:', error);
		return false;
	}
}
