'use server';

import type { TextureConfig, TextureSystem } from '@/components/features/entity-cards/base/base-card-types';
import type { CardConfigurationDto } from '@/components/features/entity-cards/types/card-types';
import { prisma } from '@/lib/prisma';
import type { Rarity as PrismaRarity, Texture as PrismaTexture } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Tipo para las opciones de la tarjeta
export interface CardOptions {
	enable3DEffect: boolean;
	enableHolographicEffect: boolean;
	enableScanlines: boolean;
	enableLightHalo: boolean;
	enableAnimatedBorder: boolean;
	enableGlowEffect: boolean;
	enableGrainEffect: boolean;
	hoverLiftHeight: number;
	maxRotation: number;
	primaryColor: string;
	secondaryColor: string;
	raritySystem: boolean;
	categorySystem: boolean;
	textureSystem: boolean;

	// Opciones para efectos específicos
	holographicOptions?: {
		patternType?: string;
		intensity?: number;
		animationSpeed?: number;
		visibleOnHover?: boolean;
	};

	scanlinesOptions?: {
		opacity?: number;
		spacing?: number;
		direction?: string;
		animate?: boolean;
		visibleOnHover?: boolean;
	};

	glowOptions?: {
		intensity?: number;
		size?: number;
		blurAmount?: number;
		animationType?: string;
		pulseSpeed?: number;
		visibleOnHover?: boolean;
	};

	borderOptions?: {
		width?: number;
		pattern?: string;
		animationType?: string;
		animationSpeed?: number;
		animationDuration?: number;
		glowIntensity?: number;
		glowOnHover?: boolean;
	};

	grainOptions?: {
		intensity?: number;
		density?: number;
		contrast?: number;
		noise?: string;
		animated?: boolean;
		visibleOnHover?: boolean;
	};
}

// Tipo para un elemento de rareza
export interface RarityItem {
	id: string;
	name: string;
	color: string;
	borderEffect?: string;
	glowColor?: string;
	description?: string;
	position: number;
	chance: number; // Porcentaje de probabilidad
	order?: number; // Para ordenar las rarezas en la UI
	entityType?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

// Tipo para el sistema de rarezas
export interface RaritySystem {
	enabled: boolean;
	rarities: RarityItem[];
	entityType?: string;
}

// Tipo para un elemento de textura
export interface TextureItem {
	id: string;
	name: string;
	imageUrl?: string;
	patternType?: string;
	pattern?: string; // Para compatibilidad con la UI
	color: string;
	primaryColor?: string; // Para compatibilidad con la UI
	secondaryColor?: string; // Para compatibilidad con la UI
	opacity: number;
	description?: string;
	order?: number; // Para ordenar las texturas en la UI
	entityType?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

// Tipo para respuestas de las acciones
export interface ActionResponse {
	success: boolean;
	message: string;
	data?: unknown;
}

/**
 * Obtiene la configuración de tarjeta para una entidad específica
 */
export async function getEntityCardConfig(entityType: string): Promise<ActionResponse> {
	try {
		// Buscar la configuración existente en la base de datos
		const config = await prisma.cardConfiguration.findUnique({
			where: { entityType },
		});

		// Si no existe configuración, crear una por defecto
		if (!config) {
			const defaultConfig: CardOptions = {
				enable3DEffect: true,
				enableHolographicEffect: true,
				enableScanlines: true,
				enableLightHalo: true,
				enableAnimatedBorder: true,
				enableGlowEffect: true,
				enableGrainEffect: true,
				hoverLiftHeight: 10,
				maxRotation: 15,
				primaryColor: '#3b82f6',
				secondaryColor: '#8b5cf6',
				raritySystem: false,
				categorySystem: true,
				textureSystem: false,
			};

			return {
				success: true,
				message: `Configuración por defecto para ${entityType}`,
				data: defaultConfig,
			};
		}

		return {
			success: true,
			message: `Configuración de tarjeta cargada para ${entityType}`,
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de tarjeta:', error);
		return {
			success: false,
			message: 'No se pudo obtener la configuración de tarjeta',
		};
	}
}

/**
 * Guarda la configuración de tarjeta para una entidad específica
 */
export async function saveEntityCardConfig(entityType: string, options: CardConfigurationDto): Promise<ActionResponse> {
	try {
		// Guardar la configuración en la base de datos usando upsert
		await prisma.cardConfiguration.upsert({
			where: { entityType },
			update: {
				enable3DEffect: options.enable3DEffect,
				enableHolographicEffect: options.enableHolographicEffect,
				enableScanlines: options.enableScanlines,
				enableLightHalo: options.enableLightHalo,
				enableAnimatedBorder: options.enableAnimatedBorder,
				enableGlowEffect: options.enableGlowEffect,
				enableGrainEffect: options.enableGrainEffect,
				hoverLiftHeight: options.hoverLiftHeight,
				maxRotation: options.maxRotation,
				primaryColor: options.primaryColor,
				secondaryColor: options.secondaryColor,
				raritySystem: options.raritySystem,
				categorySystem: options.categorySystem,
				textureSystem: options.textureSystem,
			},
			create: {
				entityType,
				enable3DEffect: options.enable3DEffect,
				enableHolographicEffect: options.enableHolographicEffect,
				enableScanlines: options.enableScanlines,
				enableLightHalo: options.enableLightHalo,
				enableAnimatedBorder: options.enableAnimatedBorder,
				enableGlowEffect: options.enableGlowEffect,
				enableGrainEffect: options.enableGrainEffect,
				hoverLiftHeight: options.hoverLiftHeight,
				maxRotation: options.maxRotation,
				primaryColor: options.primaryColor,
				secondaryColor: options.secondaryColor,
				raritySystem: options.raritySystem,
				categorySystem: options.categorySystem,
				textureSystem: options.textureSystem,
			},
		});

		// Revalidar las rutas que usan esta configuración
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);

		return {
			success: true,
			message: `Configuración de tarjeta guardada para ${entityType}`,
		};
	} catch (error) {
		console.error('Error al guardar la configuración de tarjeta:', error);
		return {
			success: false,
			message: 'No se pudo guardar la configuración de tarjeta',
		};
	}
}

/**
 * Obtiene el sistema de rarezas para una entidad específica
 */
export async function getEntityRaritySystem(entityType: string): Promise<ActionResponse> {
	try {
		// Verificar si el sistema de rarezas está habilitado
		const config = await prisma.cardConfiguration.findUnique({
			where: { entityType },
		});

		const enabled = config?.raritySystem || false;

		// Obtener las rarezas de la base de datos
		const rarities = await prisma.rarity.findMany({
			where: { entityType },
			orderBy: { position: 'asc' },
		});

		// Mapear las rarezas al formato esperado por la UI
		const mappedRarities: RarityItem[] = rarities.map((rarity: PrismaRarity) => ({
			id: rarity.id,
			name: rarity.name,
			color: rarity.color,
			borderEffect: rarity.borderEffect || undefined,
			glowColor: rarity.glowColor || undefined,
			description: rarity.description || undefined,
			position: rarity.position,
			order: rarity.position, // Para compatibilidad con la UI
			chance: rarity.chance || 0, // Incluímos el valor de chance
			entityType: rarity.entityType,
			createdAt: rarity.createdAt,
			updatedAt: rarity.updatedAt,
		}));

		// Si no hay rarezas definidas, devolver rarezas predeterminadas
		if (mappedRarities.length === 0) {
			const defaultRarities: RarityItem[] = [
				{ id: 'common', name: 'Común', color: '#9ca3af', position: 0, chance: 50 },
				{ id: 'uncommon', name: 'Poco común', color: '#10b981', position: 1, chance: 30 },
				{ id: 'rare', name: 'Raro', color: '#3b82f6', position: 2, chance: 15 },
				{ id: 'epic', name: 'Épico', color: '#8b5cf6', position: 3, chance: 4 },
				{
					id: 'legendary',
					name: 'Legendario',
					color: '#f59e0b',
					borderEffect: 'animated',
					glowColor: '#f97316',
					position: 4,
					chance: 1,
				},
			];

			const raritySystem: RaritySystem = {
				enabled,
				rarities: defaultRarities,
				entityType,
			};

			return {
				success: true,
				message: `Sistema de rarezas por defecto para ${entityType}`,
				data: raritySystem,
			};
		}

		// Construir el sistema de rarezas
		const raritySystem: RaritySystem = {
			enabled,
			rarities: mappedRarities,
			entityType,
		};

		return {
			success: true,
			message: `Sistema de rarezas cargado para ${entityType}`,
			data: raritySystem,
		};
	} catch (error) {
		console.error('Error al obtener el sistema de rarezas:', error);
		return {
			success: false,
			message: 'No se pudo obtener el sistema de rarezas',
		};
	}
}

/**
 * Guarda el sistema de rarezas para una entidad específica
 */
export async function saveEntityRaritySystem(entityType: string, raritySystem: RaritySystem): Promise<ActionResponse> {
	try {
		// Actualizar el estado habilitado en la configuración de tarjeta
		await prisma.cardConfiguration.upsert({
			where: { entityType },
			update: { raritySystem: raritySystem.enabled },
			create: {
				entityType,
				raritySystem: raritySystem.enabled,
			},
		});

		// Si el sistema está deshabilitado, no necesitamos guardar las rarezas
		if (!raritySystem.enabled) {
			// Revalidar las rutas que usan esta configuración
			revalidatePath('/settings');
			revalidatePath(`/${entityType}`);

			return {
				success: true,
				message: `Sistema de rarezas deshabilitado para ${entityType}`,
			};
		}

		// Eliminar todas las rarezas existentes para esta entidad
		await prisma.rarity.deleteMany({
			where: { entityType },
		});

		// Crear las nuevas rarezas
		if (raritySystem.rarities.length > 0) {
			await prisma.$transaction(
				raritySystem.rarities.map((rarity) =>
					prisma.rarity.create({
						data: {
							entityType,
							name: rarity.name,
							color: rarity.color,
							borderEffect: rarity.borderEffect,
							glowColor: rarity.glowColor,
							description: rarity.description,
							position: rarity.position || rarity.order || 0,
							chance: rarity.chance || 0, // Aseguramos que siempre tiene un valor
						},
					})
				)
			);
		}

		// Revalidar las rutas que usan esta configuración
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);

		return {
			success: true,
			message: `Sistema de rarezas guardado para ${entityType}`,
		};
	} catch (error) {
		console.error('Error al guardar el sistema de rarezas:', error);
		return {
			success: false,
			message: 'No se pudo guardar el sistema de rarezas',
		};
	}
}

/**
 * Obtiene el sistema de texturas para una entidad específica
 */
export async function getEntityTextureSystem(entityType: string): Promise<ActionResponse> {
	try {
		// Verificar si el sistema de texturas está habilitado
		const config = await prisma.cardConfiguration.findUnique({
			where: { entityType },
		});

		const enabled = config?.textureSystem || false;

		// Obtener las texturas de la base de datos
		const textures = await prisma.texture.findMany({
			where: { entityType },
		});

		// Mapear las texturas al formato esperado por la UI
		const mappedTextures = textures.map((texture: PrismaTexture) => ({
			id: texture.id,
			name: texture.name,
			imageUrl: texture.imageUrl || undefined,
			patternType: texture.patternType || undefined,
			color: texture.color,
			opacity: texture.opacity,
			description: texture.description || undefined,
			blendMode: 'normal', // Valor por defecto
			noiseType: 'light', // Valor por defecto
			animated: false, // Valor por defecto
			animationSpeed: 1, // Valor por defecto
			density: 0.6, // Valor por defecto
			contrast: 1.2, // Valor por defecto
			visibleOnHover: false, // Valor por defecto
			layerOrder: 1, // Valor por defecto
			scale: 1, // Valor por defecto
		}));

		// Si no hay texturas definidas, devolver texturas predeterminadas
		if (mappedTextures.length === 0) {
			const defaultTextures = [
				{
					id: 'metallic',
					name: 'Metálico',
					patternType: 'lines',
					color: '#b6b6b6',
					opacity: 0.6,
					blendMode: 'normal',
					noiseType: 'light',
					animated: false,
					animationSpeed: 1,
					density: 0.6,
					contrast: 1.2,
					visibleOnHover: false,
					layerOrder: 1,
					scale: 1,
				},
				{
					id: 'holographic',
					name: 'Holográfico',
					patternType: 'diagonal',
					color: '#8a2be2',
					opacity: 0.7,
					blendMode: 'screen',
					noiseType: 'light',
					animated: true,
					animationSpeed: 0.8,
					density: 0.6,
					contrast: 1.2,
					visibleOnHover: true,
					layerOrder: 2,
					scale: 1,
				},
				{
					id: 'wood',
					name: 'Madera',
					patternType: 'grid',
					color: '#8B4513',
					opacity: 0.5,
					blendMode: 'multiply',
					noiseType: 'medium',
					animated: false,
					animationSpeed: 1,
					density: 0.7,
					contrast: 1.4,
					visibleOnHover: false,
					layerOrder: 1,
					scale: 1.2,
				},
			];

			const textureSystem: TextureSystem = {
				enabled,
				textures: defaultTextures,
				entityType,
			};

			return {
				success: true,
				message: `Sistema de texturas por defecto para ${entityType}`,
				data: textureSystem,
			};
		}

		// Construir el sistema de texturas
		const textureSystem: TextureSystem = {
			enabled,
			textures: mappedTextures,
			entityType,
		};

		return {
			success: true,
			message: `Sistema de texturas cargado para ${entityType}`,
			data: textureSystem,
		};
	} catch (error) {
		console.error('Error al obtener el sistema de texturas:', error);
		return {
			success: false,
			message: 'No se pudo obtener el sistema de texturas',
		};
	}
}

/**
 * Guarda el sistema de texturas para una entidad específica
 */
export async function saveEntityTextureSystem(
	entityType: string,
	textureSystem: TextureSystem
): Promise<ActionResponse> {
	try {
		// Actualizar el estado habilitado en la configuración de tarjeta
		await prisma.cardConfiguration.upsert({
			where: { entityType },
			update: { textureSystem: textureSystem.enabled },
			create: {
				entityType,
				textureSystem: textureSystem.enabled,
			},
		});

		// Si el sistema está deshabilitado, no necesitamos guardar las texturas
		if (!textureSystem.enabled) {
			// Revalidar las rutas que usan esta configuración
			revalidatePath('/settings');
			revalidatePath(`/${entityType}`);

			return {
				success: true,
				message: `Sistema de texturas deshabilitado para ${entityType}`,
			};
		}

		// Eliminar todas las texturas existentes para esta entidad
		await prisma.texture.deleteMany({
			where: { entityType },
		});

		// Crear las nuevas texturas
		if (textureSystem.textures.length > 0) {
			await prisma.$transaction(
				textureSystem.textures.map((texture) =>
					prisma.texture.create({
						data: {
							entityType,
							name: texture.name,
							imageUrl: texture.imageUrl,
							patternType: texture.patternType,
							color: texture.color || '#3b82f6',
							opacity: texture.opacity,
							description: texture.description,
						},
					})
				)
			);
		}

		// Revalidar las rutas que usan esta configuración
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);

		return {
			success: true,
			message: `Sistema de texturas guardado para ${entityType}`,
		};
	} catch (error) {
		console.error('Error al guardar el sistema de texturas:', error);
		return {
			success: false,
			message: 'No se pudo guardar el sistema de texturas',
		};
	}
}
