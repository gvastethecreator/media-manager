'use server';

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

// Tipo para el sistema de texturas
export interface TextureSystem {
	enabled: boolean;
	textures: TextureItem[];
	entityType?: string;
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
export async function saveEntityCardConfig(entityType: string, config: CardOptions): Promise<ActionResponse> {
	try {
		// Guardar la configuración en la base de datos usando upsert
		await prisma.cardConfiguration.upsert({
			where: { entityType },
			update: {
				enable3DEffect: config.enable3DEffect,
				enableHolographicEffect: config.enableHolographicEffect,
				enableScanlines: config.enableScanlines,
				enableLightHalo: config.enableLightHalo,
				enableAnimatedBorder: config.enableAnimatedBorder,
				enableGlowEffect: config.enableGlowEffect,
				enableGrainEffect: config.enableGrainEffect,
				hoverLiftHeight: config.hoverLiftHeight,
				maxRotation: config.maxRotation,
				primaryColor: config.primaryColor,
				secondaryColor: config.secondaryColor,
				raritySystem: config.raritySystem,
				categorySystem: config.categorySystem,
				textureSystem: config.textureSystem,
			},
			create: {
				entityType,
				enable3DEffect: config.enable3DEffect,
				enableHolographicEffect: config.enableHolographicEffect,
				enableScanlines: config.enableScanlines,
				enableLightHalo: config.enableLightHalo,
				enableAnimatedBorder: config.enableAnimatedBorder,
				enableGlowEffect: config.enableGlowEffect,
				enableGrainEffect: config.enableGrainEffect,
				hoverLiftHeight: config.hoverLiftHeight,
				maxRotation: config.maxRotation,
				primaryColor: config.primaryColor,
				secondaryColor: config.secondaryColor,
				raritySystem: config.raritySystem,
				categorySystem: config.categorySystem,
				textureSystem: config.textureSystem,
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
		const mappedTextures: TextureItem[] = textures.map((texture: PrismaTexture) => ({
			id: texture.id,
			name: texture.name,
			imageUrl: texture.imageUrl || undefined,
			patternType: texture.patternType || undefined,
			pattern: texture.patternType || undefined, // Cambiado: Aseguramos que no sea null
			color: texture.color,
			primaryColor: texture.color, // Para compatibilidad con la UI
			secondaryColor: '#ffffff', // Valor por defecto
			opacity: texture.opacity,
			description: texture.description || undefined,
			order: 0, // Se ordenará por ID por defecto
			entityType: texture.entityType,
			createdAt: texture.createdAt,
			updatedAt: texture.updatedAt,
		}));

		// Si no hay texturas definidas, devolver texturas predeterminadas
		if (mappedTextures.length === 0) {
			const defaultTextures: TextureItem[] = [
				{
					id: 'metallic',
					name: 'Metálico',
					pattern:
						'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1))',
					patternType:
						'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1))',
					color: '#b6b6b6',
					primaryColor: '#b6b6b6',
					secondaryColor: '#d8d8d8',
					opacity: 0.6,
					order: 0,
				},
				{
					id: 'holographic',
					name: 'Holográfico',
					pattern: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
					patternType: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
					color: '#8a2be2',
					primaryColor: '#8a2be2',
					secondaryColor: '#e6a8d7',
					opacity: 0.7,
					order: 1,
				},
				{
					id: 'wood',
					name: 'Madera',
					pattern:
						'repeating-linear-gradient(90deg, rgba(101, 67, 33, 0.5) 0px, rgba(67, 32, 0, 0.5) 5px, rgba(101, 67, 33, 0.5) 10px)',
					patternType:
						'repeating-linear-gradient(90deg, rgba(101, 67, 33, 0.5) 0px, rgba(67, 32, 0, 0.5) 5px, rgba(101, 67, 33, 0.5) 10px)',
					color: '#8B4513',
					primaryColor: '#8B4513',
					secondaryColor: '#A0522D',
					opacity: 0.5,
					order: 2,
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
							patternType: texture.patternType || texture.pattern,
							color: texture.color || texture.primaryColor || '#3b82f6',
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
