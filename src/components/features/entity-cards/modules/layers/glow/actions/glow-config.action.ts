'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Caché simple para almacenar configuraciones y reducir llamadas a la base de datos
// Estructura: entityType_entityId -> config
const configCache = new Map<string, {
	data: any;
	timestamp: number;
	ttl: number;
}>();

// Tiempo de vida de la caché en ms (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

// Función auxiliar para obtener clave de caché
const getCacheKey = (entityType: string, entityId?: string) =>
	`glow_${entityType}_${entityId || 'default'}`;

// Función para obtener datos de caché
const getFromCache = (key: string) => {
	const cached = configCache.get(key);
	if (!cached) return null;

	// Comprobar si ha expirado
	if (Date.now() - cached.timestamp > cached.ttl) {
		configCache.delete(key);
		return null;
	}

	return cached.data;
};

// Función para guardar en caché
const saveToCache = (key: string, data: any, ttl = CACHE_TTL) => {
	configCache.set(key, {
		data,
		timestamp: Date.now(),
		ttl
	});
};

// Schema de validación para la configuración del glow
const glowConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean(),
		intensity: z.number().min(0).max(1),
		color: z.string(),
		size: z.number().min(0),
		blurAmount: z.number().min(0),
		animationType: z.enum(['none', 'pulse', 'wave', 'sparkle']).optional(),
		pulseSpeed: z.number().min(0).optional(),
		visibleOnHover: z.boolean().optional(),
		layerIndex: z.number().optional(),
	}),
});

// Tipo para la configuración del glow
export type GlowConfig = z.infer<typeof glowConfigSchema>['config'];

// Tipo para la respuesta
interface GlowConfigResponse {
	success: boolean;
	message: string;
	data?: GlowConfig;
	error?: string;
}

/**
 * Obtiene la configuración del efecto glow para una entidad
 */
export async function getGlowConfig(entityType: string, entityId?: string): Promise<GlowConfigResponse> {
	try {
		// Validar parámetros
		const validation = glowConfigSchema.safeParse({
			entityType,
			entityId,
			config: {}, // Validamos solo entityType y entityId
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
				error: validation.error.message
			};
		}

		// Intentar obtener de la caché
		const cacheKey = getCacheKey(entityType, entityId);
		const cachedConfig = getFromCache(cacheKey);

		if (cachedConfig) {
			return {
				success: true,
				message: 'Configuración de glow obtenida de caché',
				data: cachedConfig,
			};
		}

		let config: GlowConfig | null = null;

		// Si tenemos un ID específico, buscar esa configuración
		if (entityId) {
			config = await prisma.layerGlowConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			});
		}

		// Si no hay configuración específica, buscar la configuración por defecto
		if (!config) {
			config = await prisma.layerGlowConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			});
		}

		// Si no hay configuración, devolver valores por defecto
		if (!config) {
			const defaultConfig = {
				enabled: true,
				intensity: 0.5,
				color: '#ffffff',
				size: 20,
				blurAmount: 10,
				animationType: 'none',
				pulseSpeed: 1,
				visibleOnHover: false,
				layerIndex: 2,
			};

			// Guardar en caché los valores por defecto
			saveToCache(cacheKey, defaultConfig);

			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: defaultConfig,
			};
		}

		// Guardar en caché
		saveToCache(cacheKey, config);

		return {
			success: true,
			message: 'Configuración de glow obtenida correctamente',
			data: config as GlowConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de glow:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de glow',
			error: error instanceof Error ? error.message : String(error)
		};
	}
}

/**
 * Actualiza la configuración del efecto glow para una entidad
 */
export async function updateGlowConfig(
	entityType: string,
	entityId: string,
	config: GlowConfig
): Promise<GlowConfigResponse> {
	try {
		// Validar parámetros
		const validation = glowConfigSchema.safeParse({
			entityType,
			entityId,
			config,
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
				error: validation.error.message
			};
		}

		// Actualizar o crear la configuración
		const updatedConfig = await prisma.layerGlowConfig.upsert({
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

		// Actualizar la caché con los nuevos datos
		const cacheKey = getCacheKey(entityType, entityId);
		saveToCache(cacheKey, updatedConfig);

		// Revalidar las rutas necesarias
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de glow actualizada correctamente',
			data: updatedConfig as GlowConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de glow:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de glow',
			error: error instanceof Error ? error.message : String(error)
		};
	}
}

/**
 * Elimina la configuración del efecto glow para una entidad
 */
export async function deleteGlowConfig(entityType: string, entityId?: string): Promise<GlowConfigResponse> {
	try {
		// Validar parámetros
		const validation = glowConfigSchema.safeParse({
			entityType,
			entityId,
			config: {}, // Validamos solo entityType y entityId
		});

		if (!validation.success) {
			return {
				success: false,
				message: 'Parámetros inválidos',
				error: validation.error.message
			};
		}

		// Eliminar la configuración
		await prisma.layerGlowConfig.delete({
			where: {
				entityType_entityId: {
					entityType,
					entityId: entityId || 'default',
				},
			},
		});

		// Eliminar de la caché
		const cacheKey = getCacheKey(entityType, entityId);
		configCache.delete(cacheKey);

		// Revalidar las rutas necesarias
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de glow eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de glow:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de glow',
			error: error instanceof Error ? error.message : String(error)
		};
	}
}
