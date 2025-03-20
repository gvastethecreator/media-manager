'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { type FilterConfig, filterConfigSchema } from '../filter-schema';

/**
 * 📥 Obtiene la configuración de filtros para una entidad
 */
export async function getFilterConfig({
	entityType,
	entityId,
}: {
	entityType: string;
	entityId: string;
}): Promise<FilterConfig | null> {
	try {
		const config = await db.layerConfig.findUnique({
			where: {
				entityType_entityId_type: {
					entityType,
					entityId,
					type: 'filter',
				},
			},
			select: {
				config: true,
			},
		});

		if (!config) return null;

		const parsedConfig = filterConfigSchema.safeParse(config.config);
		if (!parsedConfig.success) {
			console.error('Error validando configuración de filtros:', parsedConfig.error);
			return null;
		}

		return parsedConfig.data;
	} catch (error) {
		console.error('Error obteniendo configuración de filtros:', error);
		return null;
	}
}

/**
 * 📤 Actualiza la configuración de filtros para una entidad
 */
export async function updateFilterConfig({
	entityType,
	entityId,
	config,
}: {
	entityType: string;
	entityId: string;
	config: Partial<FilterConfig>;
}): Promise<boolean> {
	try {
		const currentConfig = await getFilterConfig({ entityType, entityId });
		const newConfig = { ...currentConfig, ...config };

		const parsedConfig = filterConfigSchema.safeParse(newConfig);
		if (!parsedConfig.success) {
			console.error('Error validando configuración de filtros:', parsedConfig.error);
			return false;
		}

		await db.layerConfig.upsert({
			where: {
				entityType_entityId_type: {
					entityType,
					entityId,
					type: 'filter',
				},
			},
			create: {
				entityType,
				entityId,
				type: 'filter',
				config: parsedConfig.data,
			},
			update: {
				config: parsedConfig.data,
			},
		});

		revalidatePath(`/entities/${entityType}/${entityId}`);
		return true;
	} catch (error) {
		console.error('Error actualizando configuración de filtros:', error);
		return false;
	}
}

/**
 * 🗑️ Elimina la configuración de filtros para una entidad
 */
export async function deleteFilterConfig({
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
					type: 'filter',
				},
			},
		});

		revalidatePath(`/entities/${entityType}/${entityId}`);
		return true;
	} catch (error) {
		console.error('Error eliminando configuración de filtros:', error);
		return false;
	}
}
