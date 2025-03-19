'use server';

import type { TextureSystem } from '@/components/features/entity-cards/types/base-card-types';
import type { CardConfigurationDto } from '@/components/features/entity-cards/types/card-types';
import { serverLogger } from '@/lib/logger/server-logger';
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
	entityType: string;
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

const logger = serverLogger.withContext('EntityCardActiones');

/**
 * Obtiene la configuración de tarjeta para una entidad específica
 */
export async function getEntityCardConfig(entityType: string): Promise<ActionResponse> {
	try {
		// Buscar la configuración existente en la base de datos
		const config = await prisma.cardConfiguration.findUnique({
			where: { entityType },
		});

		if (!config) {
			return {
				success: false,
				message: `No se encontró configuración para el tipo de entidad: ${entityType}`,
			};
		}

		return {
			success: true,
			message: 'Configuración de tarjeta obtenida correctamente',
			data: config,
		};
	} catch (error) {
		logger.error('❌ Error al obtener configuración de tarjeta:', error);
		return {
			success: false,
			message: 'Error al obtener la configuración de tarjeta',
		};
	}
}

/**
 * Guarda la configuración de tarjeta para una entidad específica
 */
export async function saveEntityCardConfig(
	entityType: string,
	config: CardConfigurationDto
): Promise<ActionResponse> {
	try {
		// Actualizar o crear la configuración
		const updatedConfig = await prisma.cardConfiguration.upsert({
			where: { entityType },
			update: {
				...config,
				// Añadir campos adicionales necesarios
				updatedAt: new Date(),
			},
			create: {
				entityType,
				...config,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});

		// Revalidar rutas relevantes
		revalidatePath('/settings');
		revalidatePath(`/api/entities/${entityType}/visual-config`);

		return {
			success: true,
			message: 'Configuración de tarjeta guardada correctamente',
			data: updatedConfig,
		};
	} catch (error) {
		logger.error('❌ Error al guardar configuración de tarjeta:', error);
		return {
			success: false,
			message: 'Error al guardar la configuración de tarjeta',
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

/**
 * Obtiene la configuración de backside para una entidad específica
 */
export async function getBacksideConfig(entityType: string, entityId?: string): Promise<ActionResponse> {
	try {
		// Determinar si buscamos configuración específica o por defecto
		const isDefaultConfig = !entityId;

		// Opciones para la consulta
		const whereOptions = isDefaultConfig ? { entityType, isDefault: true } : { entityType, entityId };

		// Buscar la configuración existente en la base de datos
		const config = await prisma.backsideConfig.findFirst({
			where: whereOptions,
		});

		// Si no existe configuración, buscar la configuración por defecto (si no estamos ya buscando la default)
		if (!config && !isDefaultConfig) {
			const defaultConfig = await prisma.backsideConfig.findFirst({
				where: { entityType, isDefault: true },
			});

			if (defaultConfig) {
				return {
					success: true,
					message: `Usando configuración por defecto para backside de ${entityType}`,
					data: defaultConfig,
				};
			}
		}

		// Si no hay configuración en absoluto, crear una por defecto
		if (!config) {
			const defaultBacksideConfig = {
				entityType,
				entityId: entityId || undefined,
				isDefault: isDefaultConfig,
				enabled: true,
				layoutType: 'standard',
				colorMode: 'inherit',
				opacity: 0.95,
				blurBackground: true,
				blurAmount: 10,
				showAttributes: true,
				showDescription: true,
				showStats: true,
				showMetadata: true,
				showRelations: false,
				attributesConfig: '{}',
				maxDescriptionLength: 300,
				flipAnimation: 'rotate',
				flipDuration: 600,
				enableAutoFlip: false,
				autoFlipDelay: 3000,
				flipTrigger: 'click',
				headingStyle: 'default',
				infoStyle: 'default',
				separatorStyle: 'line',
			};

			return {
				success: true,
				message: `Configuración por defecto para backside de ${entityType}`,
				data: defaultBacksideConfig,
			};
		}

		return {
			success: true,
			message: `Configuración de backside cargada para ${entityType}`,
			data: config,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de backside:', error);
		return {
			success: false,
			message: 'No se pudo obtener la configuración de backside',
		};
	}
}

/**
 * Guarda la configuración de backside para una entidad específica
 */
export async function saveBacksideConfig(
	entityType: string,
	options: Record<string, unknown>,
	entityId?: string
): Promise<ActionResponse> {
	try {
		// Determinar si guardamos configuración específica o por defecto
		const isDefaultConfig = !entityId;

		// Opciones para la consulta
		const whereOptions = isDefaultConfig ? { entityType, isDefault: true } : { entityType, entityId };

		// Preparar datos para upsert
		const backsideData = {
			entityType,
			entityId: entityId || null,
			isDefault: isDefaultConfig,
			enabled: options.enabled === undefined ? true : Boolean(options.enabled),
			layoutType: (options.layoutType as string) || 'standard',
			colorMode: (options.colorMode as string) || 'inherit',
			customColor: (options.customColor as string) || null,
			opacity: options.opacity !== undefined ? Number.parseFloat(options.opacity.toString()) : 0.95,
			blurBackground: options.blurBackground === undefined ? true : Boolean(options.blurBackground),
			blurAmount: options.blurAmount !== undefined ? Number.parseFloat(options.blurAmount.toString()) : 10,
			showAttributes: options.showAttributes === undefined ? true : Boolean(options.showAttributes),
			showDescription: options.showDescription === undefined ? true : Boolean(options.showDescription),
			showStats: options.showStats === undefined ? true : Boolean(options.showStats),
			showMetadata: options.showMetadata === undefined ? true : Boolean(options.showMetadata),
			showRelations: options.showRelations === undefined ? false : Boolean(options.showRelations),
			attributesConfig: (options.attributesConfig as string) || '{}',
			maxDescriptionLength: Number.parseInt(options.maxDescriptionLength as string) || 300,
			flipAnimation: (options.flipAnimation as string) || 'rotate',
			flipDuration: Number.parseInt(options.flipDuration as string) || 600,
			enableAutoFlip: options.enableAutoFlip === undefined ? false : Boolean(options.enableAutoFlip),
			autoFlipDelay: Number.parseInt(options.autoFlipDelay as string) || 3000,
			flipTrigger: (options.flipTrigger as string) || 'click',
			customBackgroundImage: (options.customBackgroundImage as string) || null,
			customTemplate: (options.customTemplate as string) || null,
			headingStyle: (options.headingStyle as string) || 'default',
			infoStyle: (options.infoStyle as string) || 'default',
			separatorStyle: (options.separatorStyle as string) || 'line',
		};

		try {
			// Guardar la configuración en la base de datos usando upsert
			await prisma.backsideConfig.upsert({
				where: {
					backside_entity: {
						entityType: whereOptions.entityType,
						entityId: whereOptions.entityId || null,
					},
				},
				update: backsideData,
				create: backsideData,
			});
		} catch (upsertError) {
			console.error('Error específico al hacer upsert de backside config:', upsertError);
			// Si falla, intentar con create (puede ocurrir en nuevas instalaciones)
			await prisma.backsideConfig.create({
				data: backsideData,
			});
		}

		// Actualizar la relación con CardConfiguration si es la configuración por defecto
		if (isDefaultConfig) {
			const backsideConfig = await prisma.backsideConfig.findFirst({
				where: whereOptions,
			});

			if (backsideConfig) {
				await prisma.cardConfiguration.update({
					where: { entityType },
					data: {
						backsideConfigId: backsideConfig.id,
					},
				});
			}
		}

		// Revalidar las rutas que usan esta configuración
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: `Configuración de backside guardada para ${entityType}`,
		};
	} catch (error) {
		console.error('Error al guardar la configuración de backside:', error);
		return {
			success: false,
			message: 'No se pudo guardar la configuración de backside',
		};
	}
}

/**
 * Obtiene la configuración core para una entidad específica
 */
export async function getCoreConfig(entityType: string, entityId?: string): Promise<ActionResponse> {
	try {
		// Determinar si buscamos configuración específica o por defecto
		const isDefaultConfig = !entityId;

		// Opciones para la consulta
		const whereOptions = isDefaultConfig ? { entityType, isDefault: true } : { entityType, entityId };

		// Buscar la configuración existente en la base de datos
		const config = await prisma.coreConfig.findFirst({
			where: whereOptions,
		});

		// Si no existe configuración, buscar la configuración por defecto (si no estamos ya buscando la default)
		if (!config && !isDefaultConfig) {
			const defaultConfig = await prisma.coreConfig.findFirst({
				where: { entityType, isDefault: true },
			});

			if (defaultConfig) {
				return {
					success: true,
					message: `Usando configuración core por defecto para ${entityType}`,
					data: defaultConfig,
				};
			}
		}

		// Si no hay configuración en absoluto, crear una por defecto
		if (!config) {
			const defaultCoreConfig = {
				entityType,
				entityId: entityId || undefined,
				isDefault: isDefaultConfig,
				layerSystem: JSON.stringify({
					order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
					layerBlending: 'screen',
					layerSpacing: 2,
				}),
				interactiveMode: 'hover',
				hoverDelay: 100,
				touchBehavior: 'tap',
				pointerPrecision: 'medium',
				motionReduction: false,
				performanceMode: 'balanced',
				enableCache: true,
				loadingStrategy: 'progressive',
				enablePreloading: true,
				enableHaptics: false,
				hapticIntensity: 0.5,
				enableSounds: false,
				soundVolume: 0.5,
				soundTheme: 'minimal',
				contentArrangement: 'standard',
				enableAutoHeight: true,
				textTruncation: 'ellipsis',
				mediaFit: 'cover',
			};

			return {
				success: true,
				message: `Configuración core por defecto para ${entityType}`,
				data: defaultCoreConfig,
			};
		}

		// Procesar cualquier campo JSON para devolverlo como objeto
		const processedConfig = {
			...config,
			layerSystem: config.layerSystem ? JSON.parse(config.layerSystem as string) : undefined,
		};

		return {
			success: true,
			message: `Configuración core cargada para ${entityType}`,
			data: processedConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración core:', error);
		return {
			success: false,
			message: 'No se pudo obtener la configuración core',
		};
	}
}

/**
 * Guarda la configuración core para una entidad específica
 */
export async function saveCoreConfig(
	entityType: string,
	options: Record<string, unknown>,
	entityId?: string
): Promise<ActionResponse> {
	try {
		// Determinar si guardamos configuración específica o por defecto
		const isDefaultConfig = !entityId;

		// Opciones para la consulta
		const whereOptions = isDefaultConfig ? { entityType, isDefault: true } : { entityType, entityId };

		// Procesar layerSystem para almacenarlo como JSON
		let layerSystemJson: string | undefined;
		if (options.layerSystem) {
			if (typeof options.layerSystem === 'string') {
				// Ya es un string, validamos que sea JSON válido
				try {
					JSON.parse(options.layerSystem);
					layerSystemJson = options.layerSystem;
				} catch (_e) {
					layerSystemJson = JSON.stringify({
						order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
						layerBlending: 'screen',
						layerSpacing: 2,
					});
				}
			} else {
				// Es un objeto, lo stringificamos
				layerSystemJson = JSON.stringify(options.layerSystem);
			}
		}

		// Preparar datos para upsert
		const coreData = {
			entityType,
			entityId: entityId || null,
			isDefault: isDefaultConfig,
			layerSystem: layerSystemJson,
			interactiveMode: (options.interactiveMode as string) || 'hover',
			hoverDelay: Number.parseInt(options.hoverDelay as string) || 100,
			touchBehavior: (options.touchBehavior as string) || 'tap',
			pointerPrecision: (options.pointerPrecision as string) || 'medium',
			motionReduction: options.motionReduction === undefined ? false : Boolean(options.motionReduction),
			performanceMode: (options.performanceMode as string) || 'balanced',
			enableCache: options.enableCache === undefined ? true : Boolean(options.enableCache),
			loadingStrategy: (options.loadingStrategy as string) || 'progressive',
			enablePreloading: options.enablePreloading === undefined ? true : Boolean(options.enablePreloading),
			enableHaptics: options.enableHaptics === undefined ? false : Boolean(options.enableHaptics),
			hapticIntensity: Number.parseFloat(options.hapticIntensity as string) || 0.5,
			enableSounds: options.enableSounds === undefined ? false : Boolean(options.enableSounds),
			soundVolume: Number.parseFloat(options.soundVolume as string) || 0.5,
			soundTheme: (options.soundTheme as string) || 'minimal',
			contentArrangement: (options.contentArrangement as string) || 'standard',
			enableAutoHeight: options.enableAutoHeight === undefined ? true : Boolean(options.enableAutoHeight),
			maxLines: options.maxLines ? Number.parseInt(options.maxLines as string) : null,
			textTruncation: (options.textTruncation as string) || 'ellipsis',
			mediaFit: (options.mediaFit as string) || 'cover',
		};

		try {
			// Guardar la configuración en la base de datos usando upsert
			await prisma.coreConfig.upsert({
				where: {
					core_entity: {
						entityType: whereOptions.entityType,
						entityId: whereOptions.entityId || null,
					},
				},
				update: coreData,
				create: coreData,
			});
		} catch (upsertError) {
			console.error('Error específico al hacer upsert de core config:', upsertError);
			// Si falla, intentar con create (puede ocurrir en nuevas instalaciones)
			await prisma.coreConfig.create({
				data: coreData,
			});
		}

		// Actualizar la relación con CardConfiguration si es la configuración por defecto
		if (isDefaultConfig) {
			const coreConfig = await prisma.coreConfig.findFirst({
				where: whereOptions,
			});

			if (coreConfig) {
				await prisma.cardConfiguration.update({
					where: { entityType },
					data: {
						coreConfigId: coreConfig.id,
					},
				});
			}
		}

		// Revalidar las rutas que usan esta configuración
		revalidatePath('/settings');
		revalidatePath(`/${entityType}`);
		if (entityId) {
			revalidatePath(`/${entityType}/${entityId}`);
		}

		return {
			success: true,
			message: `Configuración core guardada para ${entityType}`,
		};
	} catch (error) {
		console.error('Error al guardar la configuración core:', error);
		return {
			success: false,
			message: 'No se pudo guardar la configuración core',
		};
	}
}

/**
 * Aplica un preset visual a una entidad específica
 * @param entityType Tipo de entidad (album, folder, tag, etc.)
 * @param entityId ID de la entidad
 * @param presetId ID del preset a aplicar (null para quitar)
 */
export async function applyPresetToEntity(
	entityType: string,
	entityId: string,
	presetId: string | null
): Promise<ActionResponse> {
	try {
		// Verificar que los parámetros sean válidos
		if (!entityType || !entityId) {
			return {
				success: false,
				message: 'Tipo de entidad e ID son obligatorios',
			};
		}

		logger.info(`🔄 Aplicando preset ${presetId || 'ninguno'} a ${entityType} con ID ${entityId}`);

		// Objeto para almacenar la entidad actualizada
		let updatedEntity: unknown = null;

		// Según el tipo de entidad, actualizar el campo presetId
		switch (entityType) {
			case 'album':
				updatedEntity = await prisma.album.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'folder':
				updatedEntity = await prisma.folder.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'tag':
				updatedEntity = await prisma.tag.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'collection':
				updatedEntity = await prisma.collection.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'character':
				updatedEntity = await prisma.character.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'place':
				updatedEntity = await prisma.place.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'worldItem':
				updatedEntity = await prisma.worldItem.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'concept':
				updatedEntity = await prisma.concept.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'prompt':
				updatedEntity = await prisma.prompt.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			case 'note':
				updatedEntity = await prisma.note.update({
					where: { id: entityId },
					data: { presetId },
				});
				break;
			default:
				return {
					success: false,
					message: `Tipo de entidad no soportado: ${entityType}`,
				};
		}

		// Revalidar todas las rutas relevantes
		revalidatePath(`/${entityType}s`);
		revalidatePath(`/${entityType}/${entityId}`);
		revalidatePath(`/api/entities/${entityType}s`);
		revalidatePath(`/api/entities/${entityType}/${entityId}`);

		logger.info(`✅ Preset aplicado correctamente a ${entityType} con ID ${entityId}`);

		return {
			success: true,
			message: presetId
				? `Preset aplicado correctamente a ${entityType}`
				: `Preset removido de ${entityType}`,
			data: updatedEntity,
		};
	} catch (error) {
		logger.error(`❌ Error al aplicar preset a ${entityType}:`, error);
		return {
			success: false,
			message: `Error al aplicar preset a ${entityType}`,
		};
	}
}
