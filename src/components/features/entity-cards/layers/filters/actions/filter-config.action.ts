'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Esquema para configuración de filtro glow
const glowFilterSchema = z.object({
	enabled: z.boolean().default(false),
	color: z.string().default('rgba(0, 0, 255, 0.3)'),
	radius: z.number().min(0).max(100).default(10),
	intensity: z.number().min(0).max(1).default(0.5),
	animated: z.boolean().optional().default(false),
	animationSpeed: z.number().min(0).max(10).optional().default(1),
	visibleOnHover: z.boolean().optional().default(false),
});

// Esquema para configuración de filtro shadow
const shadowFilterSchema = z.object({
	enabled: z.boolean().default(false),
	color: z.string().default('rgba(0, 0, 0, 0.3)'),
	blur: z.number().min(0).max(100).default(5),
	offsetX: z.number().min(-50).max(50).default(0),
	offsetY: z.number().min(-50).max(50).default(5),
	inset: z.boolean().optional().default(false),
	visibleOnHover: z.boolean().optional().default(false),
});

// Esquema para configuración de filtro distortion
const distortionFilterSchema = z.object({
	enabled: z.boolean().default(false),
	type: z.enum(['wave', 'ripple', 'bulge', 'twist', 'noise']).default('wave'),
	amount: z.number().min(0).max(50).default(5),
	speed: z.number().min(0).max(10).default(1),
	animated: z.boolean().optional().default(false),
	frequency: z.number().min(0).max(10).optional().default(1),
	visibleOnHover: z.boolean().optional().default(false),
});

// Esquema principal para la configuración de filtros
const filterConfigSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
	config: z.object({
		enabled: z.boolean().default(true),
		visibleOnHover: z.boolean().optional().default(false),
		opacity: z.number().min(0).max(1).default(1),
		intensity: z.number().min(0).max(1).default(1),
		glow: glowFilterSchema.optional().default({}),
		shadow: shadowFilterSchema.optional().default({}),
		distortion: distortionFilterSchema.optional().default({}),
		layerIndex: z.number().int().min(0).default(5),
	}),
});

export type FilterConfig = z.infer<typeof filterConfigSchema>['config'];
export type GlowFilterConfig = z.infer<typeof glowFilterSchema>;
export type ShadowFilterConfig = z.infer<typeof shadowFilterSchema>;
export type DistortionFilterConfig = z.infer<typeof distortionFilterSchema>;

interface FilterConfigResponse {
	success: boolean;
	message: string;
	data?: FilterConfig;
}

export async function getFilterConfig(entityType: string, entityId?: string): Promise<FilterConfigResponse> {
	try {
		const validation = filterConfigSchema.safeParse({
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

		let config: FilterConfig | null = null;

		if (entityId) {
			config = await prisma.layerFilterConfig.findFirst({
				where: {
					entityType,
					entityId,
				},
			}) as FilterConfig | null;
		}

		if (!config) {
			config = await prisma.layerFilterConfig.findFirst({
				where: {
					entityType,
					isDefault: true,
				},
			}) as FilterConfig | null;
		}

		if (!config) {
			return {
				success: true,
				message: 'Usando configuración por defecto',
				data: {
					enabled: true,
					visibleOnHover: false,
					opacity: 1,
					intensity: 1,
					glow: {
						enabled: false,
						color: 'rgba(0, 0, 255, 0.3)',
						radius: 10,
						intensity: 0.5,
					},
					shadow: {
						enabled: true,
						color: 'rgba(0, 0, 0, 0.3)',
						blur: 5,
						offsetX: 0,
						offsetY: 5,
						inset: false,
					},
					distortion: {
						enabled: false,
						type: 'wave',
						amount: 5,
						speed: 1,
						animated: false,
					},
					layerIndex: 5,
				},
			};
		}

		return {
			success: true,
			message: 'Configuración de filtros obtenida correctamente',
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de filtros:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de filtros',
		};
	}
}

export async function updateFilterConfig(
	entityType: string,
	config: FilterConfig,
	entityId?: string
): Promise<FilterConfigResponse> {
	try {
		const validation = filterConfigSchema.safeParse({
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

		const updatedConfig = await prisma.layerFilterConfig.upsert({
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
			message: 'Configuración de filtros actualizada correctamente',
			data: updatedConfig as FilterConfig,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de filtros:', error);
		return {
			success: false,
			message: 'Error al actualizar la configuración de filtros',
		};
	}
}

export async function deleteFilterConfig(
	entityType: string,
	entityId?: string
): Promise<FilterConfigResponse> {
	try {
		const validation = filterConfigSchema.safeParse({
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

		await prisma.layerFilterConfig.delete({
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
			message: 'Configuración de filtros eliminada correctamente',
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de filtros:', error);
		return {
			success: false,
			message: 'Error al eliminar la configuración de filtros',
		};
	}
}