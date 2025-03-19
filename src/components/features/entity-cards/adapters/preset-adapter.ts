'use client';

import { serverLogger } from '@/lib/logger/server-logger';
import type { VisualPreset } from '@prisma/client';
import type { CardOptions, CardPreset, ColorPalette, LayersConfig } from '../types/unified-card-types';

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
	[key: string]: unknown;
}

const logger = serverLogger.withContext('PresetAdapter');

/**
 * Convierte una cadena JSON en un objeto, con manejo de errores
 */
export function parseJsonConfig<T = PresetModule>(jsonString?: string | null): T | null {
	if (!jsonString) {
		return null;
	}

	try {
		// Verificar si el string es un JSON válido
		if (typeof jsonString !== 'string' || jsonString.trim() === '') {
			console.warn('parseJsonConfig: String vacío o no válido');
			return null;
		}

		// Verificar si el string comienza con "default_ex" (error común)
		if (jsonString.startsWith('default_ex')) {
			console.warn('parseJsonConfig: String comienza con "default_ex", no es un JSON válido');
			return null;
		}

		// Verificar si el string tiene caracteres JSON válidos
		if (
			!jsonString.startsWith('{') &&
			!jsonString.startsWith('[') &&
			!jsonString.startsWith('"') &&
			!/^\d/.test(jsonString) &&
			jsonString !== 'true' &&
			jsonString !== 'false' &&
			jsonString !== 'null'
		) {
			console.warn('parseJsonConfig: String no tiene formato JSON válido:', jsonString.substring(0, 20));
			return null;
		}

		// Intentar parsear el JSON
		return JSON.parse(jsonString) as T;
	} catch (error) {
		console.error('Error parsing JSON config:', error, 'String:', jsonString.substring(0, 50));
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

	try {
		// Parsear configuraciones base
		const coreConfig = parseJsonConfig(preset.coreConfig);
		const designConfig = parseJsonConfig(preset.designConfig);
		const animationConfig = parseJsonConfig(preset.animationConfig);
		const layerConfig = parseJsonConfig(preset.layerConfig);
		const backsideConfig = parseJsonConfig(preset.backsideConfig);
		const effectsConfig = parseJsonConfig(preset.effectsConfig);
		const performanceConfig = parseJsonConfig(preset.performanceConfig);

		// Parsear configuraciones comunes
		const colorConfig = parseJsonConfig<Partial<ColorPalette>>(preset.colorConfig);
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
		const frameColor = entityConfig?.frameColor || defaultOptions.primaryColor || '#3b82f6';

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
				preset: entityType as unknown as CardPreset,
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
				primary: frameColor,
				secondary: defaultOptions.secondaryColor || '#1d4ed8',
				accent: colorConfig?.accent || '#4f46e5',
				background: colorConfig?.background || '#ffffff',
				text: colorConfig?.text || '#111827',
				border: colorConfig?.border || '#e5e7eb',
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
	} catch (error) {
		console.error('Error adaptando preset a opciones de tarjeta:', error);
		// En caso de error, devolver opciones por defecto
		return getDefaultOptionsForEntityType(entityType);
	}
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
			preset: 'default' as CardPreset,
			variant: 'default',
			aspectRatio: '1/1',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 2,
			shadowStyle: 'soft',
		},
		layers: {
			order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
			spacing: 2,
		} as LayersConfig,
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
					preset: 'folder' as CardPreset,
					aspectRatio: '7/10',
				},
				layers: {
					...baseOptions.layers,
					blendMode: 'screen',
				} as LayersConfig,
			};
		case 'album':
			return {
				...baseOptions,
				designSystem: {
					...baseOptions.designSystem,
					preset: 'album' as CardPreset,
				},
				enableHolographicEffect: true,
			};
		case 'tag':
			return {
				...baseOptions,
				designSystem: {
					...baseOptions.designSystem,
					preset: 'tag' as CardPreset,
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
	private fallbackPresets: Map<EntityType, CardOptions> = new Map();

	constructor() {
		// Inicializar presets de respaldo para cada tipo de entidad
		for (const type of [
			'folder',
			'image',
			'video',
			'album',
			'tag',
			'collection',
			'character',
			'place',
			'worldItem',
			'concept',
			'prompt',
			'note',
		] as EntityType[]) {
			this.fallbackPresets.set(type, getDefaultOptionsForEntityType(type));
		}
	}

	/**
	 * Registra un preset en el servicio
	 */
	registerPreset(preset: VisualPreset): void {
		try {
			if (!preset || !preset.id) {
				console.warn('PresetService: Intento de registrar un preset inválido');
				return;
			}

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
		} catch (error) {
			console.error('Error al registrar preset:', error);
		}
	}

	/**
	 * Obtiene un preset por ID
	 */
	getPreset(presetId: string): VisualPreset | null {
		if (!presetId) return null;
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
		try {
			// Si hay un preset específico, usarlo
			if (presetId) {
				const preset = this.getPreset(presetId);
				if (preset) {
					return adaptPresetToCardOptions(preset, entityType);
				}
			}

			// Si no hay preset específico, usar el por defecto
			const defaultPreset = this.getDefaultPreset(entityType);
			if (defaultPreset) {
				return adaptPresetToCardOptions(defaultPreset, entityType);
			}

			// Si no hay preset por defecto, usar el respaldo
			return this.fallbackPresets.get(entityType) || getDefaultOptionsForEntityType(entityType);
		} catch (error) {
			console.error('Error al obtener opciones de tarjeta:', error);
			return getDefaultOptionsForEntityType(entityType);
		}
	}
}

// Exportar una instancia singleton del servicio
export const presetService = new PresetService();

/**
 * Adapta opciones de tarjeta a un formato de preset
 * @param cardOptions Opciones de tarjeta
 * @param entityType Tipo de entidad
 */
export function adaptCardOptionsToPreset(cardOptions: CardOptions, entityType: EntityType): Record<string, unknown> {
	try {
		// Crear un objeto que contiene solo las propiedades relevantes para un preset
		const presetConfig: Record<string, unknown> = {
			// Propiedades básicas
			enable3DEffect: cardOptions.enable3DEffect,
			enableHolographicEffect: cardOptions.enableHolographicEffect,
			enableScanlines: cardOptions.enableScanlines,
			enableLightHalo: cardOptions.enableLightHalo,
			enableAnimatedBorder: cardOptions.enableAnimatedBorder,
			enableGlowEffect: cardOptions.enableGlowEffect,
			enableGrainEffect: cardOptions.enableGrainEffect,
			hoverLiftHeight: cardOptions.hoverLiftHeight,
			maxRotation: cardOptions.maxRotation,
			primaryColor: cardOptions.primaryColor,
			secondaryColor: cardOptions.secondaryColor,

			// Sistemas
			raritySystem: cardOptions.raritySystem,
			categorySystem: cardOptions.categorySystem,
			textureSystem: cardOptions.textureSystem,

			// Sistemas anidados (si existen)
			designSystem: cardOptions.designSystem,
			layerSystem: cardOptions.layerSystem,
			animation: cardOptions.animation,
			effects: cardOptions.effects,
			performance: cardOptions.performance,
			core: cardOptions.core,
		};

		// Añadir propiedades específicas según el tipo de entidad
		switch (entityType) {
			case 'folder':
				// Propiedades específicas para carpetas
				presetConfig.folderConfig = {
					showTotalFiles: cardOptions.showTotalFiles,
					showTotalSize: cardOptions.showTotalSize,
					showLastIndexed: cardOptions.showLastIndexed,
				};
				break;
			case 'album':
				// Propiedades específicas para álbumes
				presetConfig.albumConfig = {
					imageGridLayout: cardOptions.imageGridLayout,
					imageGridGap: cardOptions.imageGridGap,
					imageGridStyle: cardOptions.imageGridStyle,
					useImageGrid: cardOptions.useImageGrid,
				};
				break;
			// ... otros casos para los demás tipos de entidades
		}

		return presetConfig;
	} catch (error) {
		logger.error('❌ Error adaptando opciones de tarjeta a preset:', error);
		return {};
	}
}

/**
 * Parsea una configuración JSON almacenada como string
 * @param jsonConfig String JSON con la configuración
 */
export function parseJsonConfigLegacy(jsonConfig: string): Record<string, unknown> {
	try {
		if (!jsonConfig) return {};
		return JSON.parse(jsonConfig) as Record<string, unknown>;
	} catch (error) {
		logger.error('❌ Error parseando configuración JSON:', error);
		return {};
	}
}

/**
 * Convierte un ID de entidad entre diferentes formatos
 */
export const convertEntityId = {
	/**
	 * Convierte un ID de componente a formato API
	 * Ej: 'card-album' -> 'album'
	 */
	toApiFormat(componentId: string): string {
		return componentId.replace(/^card-/, '');
	},

	/**
	 * Convierte un ID de API a formato de componente
	 * Ej: 'album' -> 'card-album'
	 */
	toComponentFormat(apiId: string): string {
		return `card-${apiId}`;
	},
};
