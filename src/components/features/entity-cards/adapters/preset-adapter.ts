import type { VisualPreset } from '@prisma/client';
import type { CardOptions } from '../types/card-settings-types';

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
		return {} as CardOptions;
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

	// Configurar el diseño de la tarjeta Magic
	const magicCard = magicCardBase || {};
	const frameColor = entityConfig?.frameColor || '#3b82f6';

	// Construir las opciones de tarjeta combinando todas las configuraciones
	const cardOptions: CardOptions = {
		// Sistema core
		core: coreConfig || {},

		// Sistema de diseño
		designSystem: {
			...(designConfig || {}),
			preset: entityType,
			frameColor,
			...magicCard,
		},

		// Animación
		animation: animationConfig || {},

		// Capas y efectos
		layers: layerConfig || {},
		effects: {
			...(effectsConfig || {}),
			frameColor,
		},

		// Configuración de backside
		backside: backsideConfig || {},

		// Rendimiento
		performance: performanceConfig || {},

		// Configuración de colores
		colors: {
			...(colorConfig || {}),
			primary: frameColor,
		},

		// Configuración del grid de imágenes
		imageGrid: imageGridConfig || {},

		// Layout
		layout: {
			...(layoutConfig || {}),
			type: entityConfig?.layout || 'standard',
		},

		// Configuración específica por entidad
		entityConfig: entityConfig || {},

		// Explode y preview
		explode: explodeConfig || {},
		preview: previewConfig || {},

		// Sistema de rareza
		raritySystem: rarityConfig || {},
	};

	return cardOptions;
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
