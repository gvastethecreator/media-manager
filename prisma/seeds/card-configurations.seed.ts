import { PrismaClient } from '@prisma/client';
import { logger } from '../../src/lib/logger/logger';

const seedLogger = logger.withContext('CardConfigSeed');

/**
 * Comprueba si una tabla existe en la base de datos
 * @param prisma Cliente de Prisma
 * @param tableName Nombre de la tabla para comprobar
 * @returns true si la tabla existe, false en caso contrario
 */
async function tableExists(prisma: PrismaClient, tableName: string): Promise<boolean> {
	try {
		// Consulta SQLite para verificar si la tabla existe
		const result = await prisma.$queryRawUnsafe<{ name: string }[]>(
			`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`
		)
		return result.length > 0
	} catch (error) {
		seedLogger.error(`Error al comprobar si existe la tabla ${tableName}:`, error)
		return false
	}
}

export async function seedCardConfigurations(prisma: PrismaClient) {
	seedLogger.info('💳 Creando configuraciones de tarjetas por defecto...');

	// Lista de entidades que necesitan configuración
	// Nota: Estos son los nombres de las entidades en la base de datos (sin el prefijo 'card-')
	const entityTypes = [
		'album',
		'tag',
		'collection',
		'character',
		'place',
		'world-item', // Corregido de worldItem a world-item para consistencia
		'concept',
		'prompt',
		'note',
		'folder'
	];

	// Verificar si la tabla card_configurations existe antes de intentar eliminar
	const tableCardConfigExists = await tableExists(prisma, 'card_configurations');
	if (!tableCardConfigExists) {
		seedLogger.warn('⚠️ La tabla card_configurations no existe, saltando operaciones de CardConfiguration');
		return; // Salimos de la función si la tabla no existe
	}

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
		// Efectos 3D y Visuales
		enable3DEffect: true,
		enableHolographicEffect: true,
		enableScanlines: false,
		enableLightHalo: true,
		enableAnimatedBorder: true,
		enableGlowEffect: true,
		enableGrainEffect: false,

		// Parámetros 3D
		hoverLiftHeight: 10,
		maxRotation: 15,

		// Sistemas
		raritySystem: false,
		categorySystem: true,
		textureSystem: false,

		// Opciones visuales
		showTitle: true,
		showType: true,
		showDescription: true,
		showRarity: true,
		showTexture: true,
		showInfo: true,
		showImageCount: true,

		// Grid de imágenes (nueva configuración)
		imageGridLayout: 'single',
		imageGridGap: 4,
		imageGridStyle: 'standard',
		imageGridAspectRatio: '16/9',

		// Sistema
		enableShadow: true,
		cardShadowSize: 'md',
		cardShadowColor: 'rgba(0,0,0,0.2)',
		cardRoundedSize: 'md',
		cardBorderSize: 'sm',

		// Rendimiento
		enableLazyLoading: true,
		enablePrefetch: false,
		enableSkeleton: true,

		// Estados
		enableHover: true,
		enableActive: true,
		enableFocus: true,
		enableDisabled: false,

		// Avanzado
		enableHoverAnimation: true,
		enableParallaxEffect: false,
		enableBlurEffect: false,

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
			direction: "horizontal",
			animate: false,
			color: "rgba(255,255,255,0.15)",
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
			imageGridLayout: 'single',
			showImageCount: true,
			borderOptions: JSON.stringify({
				width: 2,
				pattern: "gradient",
				animationType: "rainbow",
				animationSpeed: 1,
				animationDuration: 5,
				glowIntensity: 7,
				glowOnHover: true,
				layerIndex: 5
			}),
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
			imageGridLayout: 'single',
			showImageCount: true,
			borderOptions: JSON.stringify({
				width: 2,
				pattern: "solid",
				animationType: "flow",
				animationSpeed: 1.2,
				animationDuration: 4,
				glowIntensity: 4,
				glowOnHover: true,
				layerIndex: 5
			}),
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
			imageGridLayout: 'dual',
			imageGridGap: 8,
			showImageCount: true,
			glowOptions: JSON.stringify({
				intensity: 1.2,
				size: 120,
				blurAmount: 35,
				animationType: "follow-mouse",
				pulseSpeed: 1.5,
				visibleOnHover: true,
				layerIndex: 4
			}),
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
			imageGridLayout: 'single',
			showImageCount: false,
			holographicOptions: JSON.stringify({
				primaryColor: "rgba(249, 115, 22, 0.15)",
				secondaryColor: "rgba(234, 88, 12, 0.25)",
				intensity: 1.1,
				animationSpeed: 0.8,
				patternType: "gradient",
				visibleOnHover: true,
				layerIndex: 3
			}),
		},

		// Lugares: Efectos sutiles pero elegantes
		place: {
			...baseConfig,
			primaryColor: "#0ea5e9",
			secondaryColor: "#0284c7",
			enableScanlines: true,
			hoverLiftHeight: 12,
			imageGridLayout: 'quad',
			imageGridGap: 4,
			showImageCount: true,
			scanlinesOptions: JSON.stringify({
				opacity: 0.1,
				spacing: 5,
				direction: "horizontal",
				animate: true,
				color: "rgba(2, 132, 199, 0.12)",
				visibleOnHover: false,
				layerIndex: 2
			}),
		},

		// Objetos del mundo: Aspecto metálico
		'world-item': {
			...baseConfig,
			primaryColor: "#a855f7",
			secondaryColor: "#9333ea",
			enableGlowEffect: true,
			raritySystem: true,
			imageGridLayout: 'dual',
			imageGridGap: 6,
			showImageCount: true,
			grainOptions: JSON.stringify({
				intensity: 0.1,
				density: 0.7,
				contrast: 1.3,
				noise: "digital",
				animated: true,
				animationSpeed: 0.5,
				visibleOnHover: false,
				layerIndex: 6
			}),
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
			imageGridLayout: 'single',
			showImageCount: false,
			grainOptions: JSON.stringify({
				intensity: 0.2,
				density: 0.8,
				contrast: 1.3,
				noise: "film",
				animated: false,
				animationSpeed: 0,
				visibleOnHover: false,
				layerIndex: 6
			}),
		},

		// Prompts: Estilo técnico
		prompt: {
			...baseConfig,
			primaryColor: "#f59e0b",
			secondaryColor: "#d97706",
			enableScanlines: true,
			enableHolographicEffect: false,
			imageGridLayout: 'dual',
			imageGridGap: 4,
			showImageCount: false,
			scanlinesOptions: JSON.stringify({
				opacity: 0.15,
				spacing: 4,
				direction: "diagonal",
				animate: true,
				color: "rgba(245, 158, 11, 0.12)",
				visibleOnHover: false,
				layerIndex: 2
			}),
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
			imageGridLayout: 'single',
			showImageCount: false,
		},

		// Carpetas: Estilo funcional
		folder: {
			...baseConfig,
			primaryColor: "#64748b",
			secondaryColor: "#475569",
			enableHolographicEffect: false,
			enableAnimatedBorder: true,
			hoverLiftHeight: 8,
			imageGridLayout: 'six',
			imageGridGap: 2,
			showImageCount: true,
			borderOptions: JSON.stringify({
				width: 1.5,
				pattern: "dashed",
				animationType: "pulse",
				animationSpeed: 0.8,
				animationDuration: 3,
				glowIntensity: 3,
				glowOnHover: true,
				layerIndex: 5
			}),
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

	seedLogger.info('✨ Configuraciones de tarjetas creadas con éxito');
}