import { PrismaClient } from '@prisma/client';
import { logger } from '../../src/lib/logger/logger';

const seedLogger = logger.withContext('CardConfigSeed');

export async function seedCardConfigurations(prisma: PrismaClient) {
	seedLogger.info('💳 Creando configuraciones de tarjetas por defecto...');

	// Lista de entidades que necesitan configuración
	const entityTypes = [
		'album',
		'tag',
		'collection',
		'character',
		'place',
		'worldItem',
		'concept',
		'prompt',
		'note',
		'folder'
	];

	// Eliminar configuraciones existentes para una instalación limpia
	await prisma.cardConfiguration.deleteMany({
		where: {
			entityType: {
				in: entityTypes
			}
		}
	});

	// Configuración de base para todas las entidades
	const baseConfig = {
		enable3DEffect: true,
		enableHolographicEffect: true,
		enableScanlines: false,
		enableLightHalo: true,
		enableAnimatedBorder: true,
		enableGlowEffect: true,
		enableGrainEffect: false,
		hoverLiftHeight: 10,
		maxRotation: 15,
		raritySystem: false,
		categorySystem: true,
		textureSystem: false,
		// Configs específicas para capas
		holographicOptions: JSON.stringify({
			primaryColor: "rgba(0, 153, 255, 0.1)",
			secondaryColor: "rgba(128, 0, 255, 0.2)",
			intensity: 1,
			animationSpeed: 1,
			patternType: "rainbow",
			visibleOnHover: true,
			layerIndex: 3
		}),
		scanlinesOptions: JSON.stringify({
			opacity: 0.2,
			spacing: 4,
			color: "rgba(255,255,255,0.15)",
			animate: false,
			direction: "horizontal",
			visibleOnHover: false,
			layerIndex: 2
		}),
		glowOptions: JSON.stringify({
			intensity: 1,
			size: 100,
			blurAmount: 30,
			animationType: "follow-mouse",
			pulseSpeed: 1.5,
			visibleOnHover: true,
			layerIndex: 4
		}),
		borderOptions: JSON.stringify({
			width: 2,
			pattern: "solid",
			animationType: "flow",
			animationSpeed: 1,
			animationDuration: 6,
			glowIntensity: 5,
			glowOnHover: true,
			layerIndex: 5
		}),
		grainOptions: JSON.stringify({
			intensity: 0.15,
			density: 0.6,
			contrast: 1.2,
			noise: "light",
			animated: false,
			animationSpeed: 1,
			visibleOnHover: true,
			layerIndex: 6
		})
	};

	// Configuraciones específicas por entidad
	const configurationsByEntity = {
		// Álbumes: Estilo más visual con efectos holográficos
		album: {
			...baseConfig,
			primaryColor: "#3b82f6",
			secondaryColor: "#8b5cf6",
			enableHolographicEffect: true,
			enableGlowEffect: true,
			raritySystem: true,
		},

		// Tags: Estilo más simple pero con borde animado
		tag: {
			...baseConfig,
			primaryColor: "#10b981",
			secondaryColor: "#059669",
			enableHolographicEffect: false,
			enableAnimatedBorder: true,
			hoverLiftHeight: 8,
			maxRotation: 12,
		},

		// Colecciones: Estilo premium con sistema de rarezas
		collection: {
			...baseConfig,
			primaryColor: "#8b5cf6",
			secondaryColor: "#6d28d9",
			enableHolographicEffect: true,
			enableGlowEffect: true,
			raritySystem: true,
			maxRotation: 18,
		},

		// Personajes: Estilo detallado con texturas
		character: {
			...baseConfig,
			primaryColor: "#f97316",
			secondaryColor: "#ea580c",
			enableHolographicEffect: true,
			enableGlowEffect: true,
			raritySystem: true,
			textureSystem: true,
		},

		// Lugares: Efectos sutiles pero elegantes
		place: {
			...baseConfig,
			primaryColor: "#0ea5e9",
			secondaryColor: "#0284c7",
			enableScanlines: true,
			hoverLiftHeight: 12,
		},

		// Objetos del mundo: Aspecto metálico
		worldItem: {
			...baseConfig,
			primaryColor: "#a855f7",
			secondaryColor: "#9333ea",
			enableGlowEffect: true,
			raritySystem: true,
		},

		// Conceptos: Aspecto minimalista
		concept: {
			...baseConfig,
			primaryColor: "#ec4899",
			secondaryColor: "#db2777",
			enableHolographicEffect: false,
			enableGrainEffect: true,
			hoverLiftHeight: 6,
			maxRotation: 10,
		},

		// Prompts: Estilo técnico
		prompt: {
			...baseConfig,
			primaryColor: "#f59e0b",
			secondaryColor: "#d97706",
			enableScanlines: true,
			enableHolographicEffect: false,
		},

		// Notas: Estilo simple
		note: {
			...baseConfig,
			primaryColor: "#6b7280",
			secondaryColor: "#4b5563",
			enableHolographicEffect: false,
			enableGlowEffect: false,
			enable3DEffect: true,
			hoverLiftHeight: 5,
			maxRotation: 8,
		},

		// Carpetas: Estilo funcional
		folder: {
			...baseConfig,
			primaryColor: "#64748b",
			secondaryColor: "#475569",
			enableHolographicEffect: false,
			enableAnimatedBorder: true,
			hoverLiftHeight: 8,
		},
	};

	// Crear configuraciones en la base de datos
	for (const entityType of entityTypes) {
		const config = configurationsByEntity[entityType as keyof typeof configurationsByEntity] || baseConfig;

		await prisma.cardConfiguration.create({
			data: {
				entityType,
				...config
			}
		});

		seedLogger.info(`✅ Configuración creada para: ${entityType}`);
	}

	// También vamos a crear sistemas adicionales para las entidades que los usan
	const entitiesWithRarities = ['album', 'collection', 'character', 'worldItem'];
	const entitiesWithTextures = ['character'];

	await seedRarities(prisma, entitiesWithRarities);
	await seedTextures(prisma, entitiesWithTextures);

	seedLogger.info('✨ Configuraciones de tarjetas creadas con éxito');
}

// Función para sembrar las rarezas por defecto
async function seedRarities(prisma: PrismaClient, entityTypes: string[]) {
	seedLogger.info('🌈 Creando rarezas por defecto...');

	// Eliminar rarezas existentes
	await prisma.rarity.deleteMany({
		where: {
			entityType: {
				in: entityTypes
			}
		}
	});

	// Rarezas comunes para todas las entidades
	const commonRarities = [
		{
			name: "common",
			color: "#3b82f6",
			borderEffect: "solid",
			borderWidth: 2,
			position: 0,
			description: "Común - Items que aparecen con frecuencia",
			chance: 70,
		},
		{
			name: "uncommon",
			color: "#10b981",
			borderEffect: "animated",
			borderWidth: 2,
			glowColor: "rgba(16, 185, 129, 0.7)",
			glowIntensity: 4,
			position: 1,
			description: "Poco común - Items más escasos",
			chance: 20,
		},
		{
			name: "rare",
			color: "#f59e0b",
			borderEffect: "animated",
			borderWidth: 2.5,
			glowColor: "rgba(245, 158, 11, 0.8)",
			glowIntensity: 5,
			position: 2,
			description: "Raro - Items difíciles de encontrar",
			chance: 8,
		},
		{
			name: "mythic",
			color: "#ef4444",
			borderEffect: "animated",
			borderWidth: 3,
			glowColor: "rgba(239, 68, 68, 0.9)",
			glowIntensity: 6,
			position: 3,
			description: "Mítico - Items extremadamente raros",
			chance: 2,
		}
	];

	// Crear rarezas para cada tipo de entidad
	for (const entityType of entityTypes) {
		for (const rarity of commonRarities) {
			await prisma.rarity.create({
				data: {
					entityType,
					...rarity,
				}
			});
		}

		seedLogger.info(`✅ Rarezas creadas para: ${entityType}`);
	}
}

// Función para sembrar las texturas por defecto
async function seedTextures(prisma: PrismaClient, entityTypes: string[]) {
	seedLogger.info('🎨 Creando texturas por defecto...');

	// Eliminar texturas existentes
	await prisma.texture.deleteMany({
		where: {
			entityType: {
				in: entityTypes
			}
		}
	});

	// Texturas comunes para todas las entidades
	const commonTextures = [
		{
			name: "noise",
			patternType: "noise",
			noiseType: "light",
			color: "#000000",
			opacity: 0.3,
			description: "Ruido sutil para añadir textura",
			blendMode: "overlay",
			animated: false,
			density: 0.6,
			contrast: 1.2,
			visibleOnHover: false,
			layerOrder: 6,
		},
		{
			name: "dots",
			patternType: "dots",
			color: "#ffffff",
			opacity: 0.2,
			description: "Patrón de puntos pequeños",
			blendMode: "soft-light",
			animated: false,
			density: 0.8,
			visibleOnHover: false,
			layerOrder: 6,
		},
		{
			name: "lines",
			patternType: "lines",
			color: "#3b82f6",
			opacity: 0.15,
			description: "Líneas sutiles en diagonal",
			blendMode: "overlay",
			animated: false,
			visibleOnHover: false,
			layerOrder: 6,
		},
		{
			name: "grain",
			patternType: "grain",
			noiseType: "medium",
			color: "#000000",
			opacity: 0.25,
			description: "Grano tipo película fotográfica",
			blendMode: "overlay",
			animated: true,
			animationSpeed: 0.5,
			density: 0.7,
			contrast: 1.4,
			visibleOnHover: false,
			layerOrder: 6,
		},
		{
			name: "paper",
			patternType: "paper",
			color: "#f8fafc",
			opacity: 0.2,
			description: "Textura de papel con relieve sutil",
			blendMode: "multiply",
			animated: false,
			density: 0.5,
			contrast: 1.1,
			visibleOnHover: false,
			layerOrder: 6,
		},
		{
			name: "metal",
			patternType: "metal",
			color: "#64748b",
			opacity: 0.4,
			description: "Textura metálica con reflejo",
			blendMode: "overlay",
			animated: true,
			animationSpeed: 0.3,
			density: 0.6,
			contrast: 1.5,
			visibleOnHover: false,
			layerOrder: 6,
		},
	];

	// Crear texturas para cada tipo de entidad
	for (const entityType of entityTypes) {
		for (const texture of commonTextures) {
			await prisma.texture.create({
				data: {
					entityType,
					...texture,
				}
			});
		}

		seedLogger.info(`✅ Texturas creadas para: ${entityType}`);
	}
}