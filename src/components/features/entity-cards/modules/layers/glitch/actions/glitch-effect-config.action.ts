'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema para la validación de la configuración del efecto glitch
const glitchEffectConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean().default(true),
		intensity: z.number().min(0).max(1).default(0.1),
		frequency: z.number().min(0).max(10).default(0.05),
		duration: z.number().min(0).max(10).default(0.2),
		visibleOnHover: z.boolean().default(true),
		triggerOnHover: z.boolean().default(false),
		randomTrigger: z.boolean().default(false),
		randomFrequency: z.number().min(0).max(1).default(0.1),
		sliceCount: z.number().int().min(0).max(50).default(10),
		sliceOffset: z.number().min(0).max(20).default(5),
		colorShiftAmount: z.number().min(0).max(1).default(0.1),
		noiseIntensity: z.number().min(0).max(1).default(0.2),
		scanlineEffect: z.boolean().default(true),
		distortionType: z.enum(['digital', 'analog', 'vhs', 'custom']).default('digital'),
		blendMode: z.enum(['normal', 'overlay', 'screen', 'multiply', 'difference']).default('overlay'),
		stopAfterSeconds: z.number().min(0).max(10).nullish().default(2),
		affectContent: z.boolean().default(true),
		rgbShiftEnabled: z.boolean().default(true),
		brightnessNoise: z.number().min(0).max(1).default(0.1),
		staticNoise: z.number().min(0).max(1).default(0.05),
	}),
});

// Tipo inferido para la configuración
export type GlitchEffectConfig = z.infer<typeof glitchEffectConfigSchema>['config'];

// Tipo para la respuesta de las acciones
interface GlitchEffectConfigResponse {
	success: boolean;
	message: string;
	data?: GlitchEffectConfig;
}

/**
 * Obtiene la configuración del efecto glitch para una entidad
 */
export async function getGlitchEffectConfig(
	entityType: string,
	entityId?: string
): Promise<GlitchEffectConfigResponse> {
	try {
		// Validar parámetros
		const validation = glitchEffectConfigSchema.safeParse({
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

		let config: GlitchEffectConfig | null = null;

		// Buscar configuración específica si se proporciona un ID
		if (entityId) {
			config = (await prisma.layerGlitchEffectConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			})) as GlitchEffectConfig | null;
		}

		// Si no hay configuración específica, buscar la configuración por defecto
		if (!config) {
			config = (await prisma.layerGlitchEffectConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			})) as GlitchEffectConfig | null;
		}

		// Si no se encuentra ninguna configuración, usar valores por defecto
		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: {
					enabled: true,
					intensity: 0.1,
					frequency: 0.05,
					duration: 0.2,
					visibleOnHover: true,
					triggerOnHover: false,
					randomTrigger: false,
					randomFrequency: 0.1,
					sliceCount: 10,
					sliceOffset: 5,
					colorShiftAmount: 0.1,
					noiseIntensity: 0.2,
					scanlineEffect: true,
					distortionType: 'digital',
					blendMode: 'overlay',
					stopAfterSeconds: 2,
					affectContent: true,
					rgbShiftEnabled: true,
					brightnessNoise: 0.1,
					staticNoise: 0.05,
				},
			};
		}

		return {
			success: true,
			message: 'Configuración de efecto glitch obtenida correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de efecto glitch:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de efecto glitch',
			data: error instanceof Error ? ({ enabled: false } as GlitchEffectConfig) : undefined,
		};
	}
}

/**
 * Actualiza la configuración del efecto glitch para una entidad
 */
export async function updateGlitchEffectConfig(
	entityType: string,
	config: GlitchEffectConfig,
	entityId?: string
): Promise<GlitchEffectConfigResponse> {
	try {
		// Validar parámetros
		const validation = glitchEffectConfigSchema.safeParse({
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

		// Actualizar o crear la configuración
		const updatedConfig = await prisma.layerGlitchEffectConfig.upsert({
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

		// Revalidar las rutas necesarias
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de efecto glitch actualizada correctamente',
			data: updatedConfig as GlitchEffectConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de efecto glitch:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de efecto glitch',
		};
	}
}

/**
 * Elimina la configuración del efecto glitch para una entidad
 */
export async function deleteGlitchEffectConfig(
	entityType: string,
	entityId?: string
): Promise<GlitchEffectConfigResponse> {
	try {
		// Validar parámetros
		const validation = glitchEffectConfigSchema.safeParse({
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

		// Eliminar la configuración
		await prisma.layerGlitchEffectConfig.delete({
			where: {
				entityType_entityId: {
					entityType,
					entityId: entityId || 'default',
				},
			},
		});

		// Revalidar las rutas necesarias
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: 'Configuración de efecto glitch eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de efecto glitch:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de efecto glitch',
		};
	}
}
