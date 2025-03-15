import type { VisualPreset } from '@prisma/client';
import type { CardOptions } from '../types/unified-card-types';

/**
 * Tipos de entidades soportadas por el sistema de presets
 */
export type EntityType =
	| 'folder'
	| 'image'
	| 'video'
	| 'album'
	| 'tag'
	| 'collection'
	| 'character'
	| 'place'
	| 'worldItem'
	| 'concept'
	| 'prompt'
	| 'note';

/**
 * Interface para los módulos de configuración
 */
export interface PresetModule {
	[key: string]: any;
}

/**
 * Convierte una cadena JSON en un objeto, con manejo de errores
 */
export function parseJsonConfig<T = PresetModule>(jsonString?: string | null): T | null {
	if (!jsonString) {
		return null;
	}

	try {
		return JSON.parse(jsonString) as T;
	} catch (error) {
		console.error('Error parsing JSON config:', error);
		return null;
	}
}

/**
 * Combina configuraciones base con configuraciones específicas
 */
export function mergeConfigs<T = PresetModule>(baseConfig: T | null, specificConfig: T | null): T {
	return {
		...(baseConfig || {}),
		...(specificConfig || {}),
	} as T;
}

/**
 * Adapta un preset visual a opciones de tarjeta
 */
export function adaptPresetToCardOptions(preset: VisualPreset | null, entityType: EntityType): CardOptions {
	if (!preset) {
		// Proporcionar opciones por defecto según el tipo de entidad
		return getDefaultOptionsForEntityType(entityType);
	}

	// Parsear configuraciones base
	const coreConfig = parseJsonConfig(preset.coreConfig);
	const designConfig = parseJsonConfig(preset.designConfig);
	const animationConfig = parseJsonConfig(preset.animationConfig);
	const layerConfig = parseJsonConfig(preset.layerConfig);
	const backsideConfig = parseJsonConfig(preset.backsideConfig);
	const effectsConfig = parseJsonConfig(preset.effectsConfig);
	const performanceConfig = parseJsonConfig(preset.performanceConfig);

	// Parsear configuraciones comunes
	const colorConfig = parseJsonConfig(preset.colorConfig);
	const imageGridConfig = parseJsonConfig(preset.imageGridConfig);
	const layoutConfig = parseJsonConfig(preset.layoutConfig);
	const explodeConfig = parseJsonConfig(preset.explodeConfig);
	const previewConfig = parseJsonConfig(preset.previewConfig);
	const rarityConfig = parseJsonConfig(preset.rarityConfig);

	// Parsear configuración de estilo Magic Card
	const magicCardBase = parseJsonConfig(preset.magicCardBase);

	// Obtener configuración específica según el tipo de entidad
	let entityConfig = null;
	switch (entityType) {
		case 'folder':
			entityConfig = parseJsonConfig(preset.folderConfig);
			break;
		case 'image':
			entityConfig = parseJsonConfig(preset.imageConfig);
			break;
		case 'video':
			entityConfig = parseJsonConfig(preset.videoConfig);
			break;
		case 'album':
			entityConfig = parseJsonConfig(preset.albumConfig);
			break;
		case 'tag':
			entityConfig = parseJsonConfig(preset.tagConfig);
			break;
		case 'collection':
			entityConfig = parseJsonConfig(preset.collectionConfig);
			break;
		case 'character':
			entityConfig = parseJsonConfig(preset.characterConfig);
			break;
		case 'place':
			entityConfig = parseJsonConfig(preset.placeConfig);
			break;
		case 'worldItem':
			entityConfig = parseJsonConfig(preset.worldItemConfig);
			break;
		case 'concept':
			entityConfig = parseJsonConfig(preset.conceptConfig);
			break;
		case 'prompt':
			entityConfig = parseJsonConfig(preset.promptConfig);
			break;
		case 'note':
			entityConfig = parseJsonConfig(preset.noteConfig);
			break;
		default:
			entityConfig = {};
	}

	// Obtener opciones por defecto para el tipo de entidad
	const defaultOptions = getDefaultOptionsForEntityType(entityType);

	// Configurar el diseño de la tarjeta Magic
	const magicCard = magicCardBase || {};
	const frameColor = entityConfig?.frameColor || defaultOptions.designSystem?.frameColor || '#3b82f6';

	// Construir las opciones de tarjeta combinando todas las configuraciones
	const cardOptions: CardOptions = {
		// Primero las opciones por defecto
		...defaultOptions,

		// Sistema core
		core: {
			...defaultOptions.core,
			...coreConfig,
		},

		// Sistema de diseño
		designSystem: {
			...defaultOptions.designSystem,
			...(designConfig || {}),
			preset: entityType,
			frameColor,
			...magicCard,
		},

		// Animación
		animation: {
			...defaultOptions.animation,
			...(animationConfig || {}),
		},

		// Capas y efectos
		layers: {
			...defaultOptions.layers,
			...(layerConfig || {}),
		},
		effects: {
			...defaultOptions.effects,
			...(effectsConfig || {}),
			frameColor,
		},

		// Configuración de backside
		backside: {
			...defaultOptions.backside,
			...(backsideConfig || {}),
		},

		// Rendimiento
		performance: {
			...defaultOptions.performance,
			...(performanceConfig || {}),
		},

		// Configuración de colores
		colors: {
			...defaultOptions.colors,
			...(colorConfig || {}),
			primary: frameColor,
		},

		// Configuración del grid de imágenes
		imageGrid: {
			...defaultOptions.imageGrid,
			...(imageGridConfig || {}),
		},

		// Layout
		layout: {
			...defaultOptions.layout,
			...(layoutConfig || {}),
			type: entityConfig?.layout || defaultOptions.layout?.type || 'standard',
		},

		// Configuración específica por entidad
		entityConfig: entityConfig || {},

		// Explode y preview
		explode: {
			...defaultOptions.explode,
			...(explodeConfig || {}),
		},
		preview: {
			...defaultOptions.preview,
			...(previewConfig || {}),
		},

		// Sistema de rareza
		raritySystem: {
			...defaultOptions.raritySystem,
			...(rarityConfig || {}),
		},
	};

	return cardOptions;
}

/**
 * Obtiene opciones por defecto según el tipo de entidad
 */
function getDefaultOptionsForEntityType(entityType: EntityType): CardOptions {
	// Opciones base para todos los tipos
	const baseOptions: CardOptions = {
		enable3DEffect: true,
		enableHolographicEffect: false,
		enableScanlines: false,
		enableLightHalo: true,
		enableAnimatedBorder: true,
		enableGlowEffect: true,
		enableGrainEffect: false,
		designSystem: {
			preset: 'default',
			variant: 'default',
			aspectRatio: '1/1',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 2,
			shadowStyle: 'soft',
		},
		layers: {
			order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
			layerBlending: 'normal',
			layerSpacing: 2,
		},
		primaryColor: '#3b82f6',
		secondaryColor: '#1d4ed8',
		hoverLiftHeight: 10,
		maxRotation: 15,
	};

	// Opciones específicas por tipo
	switch (entityType) {
		case 'folder':
			return {
				...baseOptions,
				designSystem: {
					...baseOptions.designSystem,
					preset: 'folder',
					aspectRatio: '7/10',
				},
				layers: {
					...baseOptions.layers,
					layerBlending: 'screen',
				},
			};
		case 'album':
			return {
				...baseOptions,
				designSystem: {
					...baseOptions.designSystem,
					preset: 'album',
				},
				enableHolographicEffect: true,
			};
		case 'tag':
			return {
				...baseOptions,
				designSystem: {
					...baseOptions.designSystem,
					preset: 'tag',
					aspectRatio: '3/1',
					cornerRadius: 8,
				},
			};
		// Añadir más casos según sea necesario
		default:
			return baseOptions;
	}
}

/**
 * Servicio para manejar presets en el cliente
 */
export class PresetService {
	private presets: Map<string, VisualPreset> = new Map();
	private defaultPresets: Map<EntityType, VisualPreset> = new Map();

	/**
	 * Registra un preset en el servicio
	 */
	registerPreset(preset: VisualPreset): void {
		this.presets.set(preset.id, preset);

		// Si es un preset por defecto, registrarlo por tipo
		if (preset.isDefault) {
			// Aquí necesitaríamos detectar los tipos de entidad para los que este preset es por defecto
			// Por ahora, asumimos que viene en los metadatos o se determina por su categoria
			const metadata = parseJsonConfig(preset.metadata);
			if (metadata?.defaultFor) {
				const entityTypes = metadata.defaultFor as EntityType[];
				for (const type of entityTypes) {
					this.defaultPresets.set(type, preset);
				}
			}
		}
	}

	/**
	 * Obtiene un preset por ID
	 */
	getPreset(presetId: string): VisualPreset | null {
		return this.presets.get(presetId) || null;
	}

	/**
	 * Obtiene el preset por defecto para un tipo de entidad
	 */
	getDefaultPreset(entityType: EntityType): VisualPreset | null {
		return this.defaultPresets.get(entityType) || null;
	}

	/**
	 * Obtiene las opciones de tarjeta para una entidad y preset específicos
	 */
	getCardOptions(presetId: string | null, entityType: EntityType): CardOptions {
		// Si hay un preset específico, usarlo
		if (presetId) {
			const preset = this.getPreset(presetId);
			if (preset) {
				return adaptPresetToCardOptions(preset, entityType);
			}
		}

		// Si no hay preset específico, usar el por defecto
		const defaultPreset = this.getDefaultPreset(entityType);
		return adaptPresetToCardOptions(defaultPreset, entityType);
	}
}

// Exportar una instancia singleton del servicio
export const presetService = new PresetService();
