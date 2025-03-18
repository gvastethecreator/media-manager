'use client';

/**
 * 🌈 Adaptadores bidireccionales entre EntityCard y el sistema de capas
 *
 * Este archivo proporciona funciones para convertir entre las opciones de EntityCard
 * y la configuración del sistema de capas, permitiendo una integración fluida.
 */

import { deepMerge } from '@/lib/utils';
import type { LayerConfig, LayerSystemConfig } from '../../layers/types';
import { DEFAULT_LAYER_SYSTEM } from '../../settings/layer-settings-config';
import type { CardOptions } from '../../types/card-settings-types';

/**
 * Configuración por defecto para el sistema de capas
 */
export const DEFAULT_LAYERS_CONFIG = {
	layerSystem: DEFAULT_LAYER_SYSTEM,
	layerConfigs: {} as Record<string, LayerConfig>,
};

/**
 * Interfaz para la configuración completa del sistema de capas
 */
export interface EntityCardLayerSystemConfig {
	layerSystem: LayerSystemConfig;
	layerConfigs: Record<string, LayerConfig>;
}

/**
 * Convierte las opciones de EntityCard a configuración del sistema de capas
 *
 * @param cardOptions - Opciones de la tarjeta de entidad
 * @returns Configuración del sistema de capas
 */
export function adaptEntityCardToLayerSystem(cardOptions?: Partial<CardOptions>): EntityCardLayerSystemConfig {
	if (!cardOptions) return DEFAULT_LAYERS_CONFIG;

	// Extraer configuración de capas de las opciones de tarjeta
	const layerSystem = cardOptions.layerSystem || DEFAULT_LAYERS_CONFIG.layerSystem;
	const layerConfigs = cardOptions.layerConfigs || DEFAULT_LAYERS_CONFIG.layerConfigs;

	// Procesar configuraciones específicas de capas desde las opciones visuales
	const visualOptions = cardOptions.visualOptions || {};
	const processedLayerConfigs = { ...layerConfigs };

	// Mapear opciones visuales a configuraciones de capa específicas
	if (visualOptions.rarityConfig) {
		processedLayerConfigs.border = {
			...processedLayerConfigs.border,
			enabled: true,
			layerIndex: processedLayerConfigs.border?.layerIndex || 2,
			borderConfig: visualOptions.rarityConfig,
		};
	}

	if (visualOptions.textureConfig) {
		processedLayerConfigs.texture = {
			...processedLayerConfigs.texture,
			enabled: true,
			layerIndex: processedLayerConfigs.texture?.layerIndex || 1,
			textureConfig: visualOptions.textureConfig,
		};
	}

	// Mapear efectos visuales a capas correspondientes
	const effectsMapping = [
		{ effect: 'enableGlowEffect', layer: 'glow', options: 'glowOptions' },
		{ effect: 'enableGrainEffect', layer: 'grain', options: 'grainOptions' },
		{ effect: 'enableHolographicEffect', layer: 'holographic', options: 'holographicOptions' },
		{ effect: 'enableScanlinesEffect', layer: 'scanlines', options: 'scanlinesOptions' },
	];

	for (const mapping of effectsMapping) {
		if (visualOptions[mapping.effect]) {
			processedLayerConfigs[mapping.layer] = {
				...processedLayerConfigs[mapping.layer],
				enabled: true,
				layerIndex: processedLayerConfigs[mapping.layer]?.layerIndex || 3 + effectsMapping.indexOf(mapping),
				...(visualOptions[mapping.options] ? { [mapping.options]: visualOptions[mapping.options] } : {}),
			};
		}
	}

	return {
		layerSystem,
		layerConfigs: processedLayerConfigs,
	};
}

/**
 * Convierte la configuración del sistema de capas a opciones de EntityCard
 *
 * @param layerSystemConfig - Configuración del sistema de capas
 * @param existingOptions - Opciones existentes de la tarjeta (opcional)
 * @returns Opciones actualizadas para la tarjeta de entidad
 */
export function adaptLayerSystemToEntityCard(
	layerSystemConfig: EntityCardLayerSystemConfig,
	existingOptions?: Partial<CardOptions>
): Partial<CardOptions> {
	const options = existingOptions ? { ...existingOptions } : {};

	// Transferir configuración del sistema de capas
	options.layerSystem = layerSystemConfig.layerSystem;
	options.layerConfigs = layerSystemConfig.layerConfigs;

	// Inicializar opciones visuales si no existen
	if (!options.visualOptions) {
		options.visualOptions = {};
	}

	// Extraer configuraciones específicas de capas a opciones visuales
	const layerConfigs = layerSystemConfig.layerConfigs;

	// Procesar capa de borde
	if (layerConfigs.border?.enabled && layerConfigs.border.borderConfig) {
		options.visualOptions.rarityConfig = layerConfigs.border.borderConfig;
	}

	// Procesar capa de textura
	if (layerConfigs.texture?.enabled && layerConfigs.texture.textureConfig) {
		options.visualOptions.textureConfig = layerConfigs.texture.textureConfig;
	}

	// Procesar efectos visuales
	const effectsMapping = [
		{ layer: 'glow', effect: 'enableGlowEffect', options: 'glowOptions' },
		{ layer: 'grain', effect: 'enableGrainEffect', options: 'grainOptions' },
		{ layer: 'holographic', effect: 'enableHolographicEffect', options: 'holographicOptions' },
		{ layer: 'scanlines', effect: 'enableScanlinesEffect', options: 'scanlinesOptions' },
	];

	for (const mapping of effectsMapping) {
		if (layerConfigs[mapping.layer]?.enabled) {
			options.visualOptions[mapping.effect] = true;

			if (layerConfigs[mapping.layer][mapping.options]) {
				options.visualOptions[mapping.options] = layerConfigs[mapping.layer][mapping.options];
			}
		}
	}

	return options;
}

/**
 * Detecta automáticamente el formato de configuración y lo convierte al formato deseado
 *
 * @param config - Configuración en cualquier formato (EntityCard o sistema de capas)
 * @param targetFormat - Formato objetivo ('entityCard' o 'layerSystem')
 * @returns Configuración convertida al formato objetivo
 */
export function detectAndConvertLayerConfig(
	config: Record<string, unknown>,
	targetFormat: 'entityCard' | 'layerSystem'
): Record<string, unknown> {
	// Detectar formato actual
	const isEntityCardFormat = 'visualOptions' in config || 'cardType' in config;
	const isLayerSystemFormat = 'layerSystem' in config && 'layerConfigs' in config;

	// Si ya está en el formato objetivo, devolver sin cambios
	if (targetFormat === 'entityCard' && isEntityCardFormat) return config;
	if (targetFormat === 'layerSystem' && isLayerSystemFormat) return config;

	// Convertir al formato objetivo
	if (targetFormat === 'entityCard' && isLayerSystemFormat) {
		return adaptLayerSystemToEntityCard(config);
	}

	if (targetFormat === 'layerSystem' && isEntityCardFormat) {
		return adaptEntityCardToLayerSystem(config);
	}

	// Si no se puede determinar el formato, devolver la configuración original
	console.warn('No se pudo determinar el formato de configuración de capas');
	return config;
}

/**
 * Fusiona configuraciones de capas específicas por tipo de entidad con la configuración base
 *
 * @param baseConfig - Configuración base del sistema de capas
 * @param entityType - Tipo de entidad
 * @returns Configuración fusionada con ajustes específicos para el tipo de entidad
 */
export function mergeEntityTypeLayerConfig(
	baseConfig: EntityCardLayerSystemConfig,
	entityType: string
): EntityCardLayerSystemConfig {
	// Aquí se implementaría la lógica para cargar configuraciones específicas por tipo
	// Por ahora, devolvemos la configuración base sin cambios
	return baseConfig;
}

/**
 * Hook para gestionar la configuración de capas específica por tipo de entidad
 *
 * @param entityType - Tipo de entidad
 * @param entityId - ID de la entidad (opcional)
 * @param initialConfig - Configuración inicial (opcional)
 * @returns Configuración de capas optimizada para el tipo de entidad
 */
export function useEntityTypeLayerConfig(
	entityType: string,
	entityId?: string,
	initialConfig?: Partial<EntityCardLayerSystemConfig>
): EntityCardLayerSystemConfig {
	// Aquí se implementaría un hook completo con estado y efectos
	// Por ahora, simplemente fusionamos la configuración base con la específica del tipo
	const baseConfig = deepMerge(DEFAULT_LAYERS_CONFIG, initialConfig || {}) as EntityCardLayerSystemConfig;
	return mergeEntityTypeLayerConfig(baseConfig, entityType);
}

/**
 * 🔄 Adaptador de capas para tarjetas de entidad
 *
 * Este módulo proporciona funciones para adaptar el sistema de capas
 * a las tarjetas de entidad, permitiendo una integración bidireccional.
 */

/**
 * Configuración del sistema de capas para tarjetas de entidad
 */
export interface EntityCardLayerSystemConfig {
	/**
	 * Configuración de capas individuales
	 */
	layers: Record<string, LayerConfig>;

	/**
	 * Opacidad global para todas las capas (0-100)
	 */
	globalOpacity?: number;

	/**
	 * Escala global para todas las capas (50-150)
	 */
	globalScale?: number;

	/**
	 * Desactivar todas las animaciones
	 */
	disableAnimations?: boolean;

	/**
	 * Modo de alto rendimiento (reduce efectos visuales)
	 */
	highPerformanceMode?: boolean;
}

/**
 * Configuración predeterminada para el sistema de capas
 */
export const DEFAULT_ENTITY_CARD_LAYER_CONFIG: EntityCardLayerSystemConfig = {
	layers: {},
	globalOpacity: 100,
	globalScale: 100,
	disableAnimations: false,
	highPerformanceMode: false,
};

/**
 * Obtiene una configuración de capas para un tipo de entidad específico
 */
export function getEntityTypeLayerConfig(entityType: string): EntityCardLayerSystemConfig {
	// Aquí podríamos cargar configuraciones específicas por tipo de entidad
	// desde una base de datos o almacenamiento local

	switch (entityType) {
		case 'image':
			return {
				...DEFAULT_ENTITY_CARD_LAYER_CONFIG,
				layers: {
					border: { enabled: true, color: '#3b82f6', width: 2 },
					glow: { enabled: true, color: '#3b82f6', intensity: 40 },
					content: { enabled: true },
					metadata: { enabled: true },
				},
			};

		case 'folder':
			return {
				...DEFAULT_ENTITY_CARD_LAYER_CONFIG,
				layers: {
					border: { enabled: true, color: '#10b981', width: 2 },
					content: { enabled: true },
					metadata: { enabled: true },
					folderIcon: { enabled: true },
				},
			};

		case 'album':
			return {
				...DEFAULT_ENTITY_CARD_LAYER_CONFIG,
				layers: {
					border: { enabled: true, color: '#8b5cf6', width: 2 },
					glow: { enabled: true, color: '#8b5cf6', intensity: 30 },
					content: { enabled: true },
					metadata: { enabled: true },
					albumPreview: { enabled: true },
				},
			};

		case 'tag':
			return {
				...DEFAULT_ENTITY_CARD_LAYER_CONFIG,
				layers: {
					border: { enabled: true, color: '#f59e0b', width: 1 },
					content: { enabled: true },
					metadata: { enabled: true },
					tagIcon: { enabled: true },
				},
			};

		default:
			return DEFAULT_ENTITY_CARD_LAYER_CONFIG;
	}
}

/**
 * Convierte propiedades de EntityCard a configuración de capas
 */
export function entityCardPropsToLayerConfig(
	entityType: string,
	props: Record<string, unknown>
): EntityCardLayerSystemConfig {
	// Obtener configuración base para el tipo de entidad
	const baseConfig = getEntityTypeLayerConfig(entityType);

	// Mapear propiedades específicas de EntityCard a configuración de capas
	const layerConfig: EntityCardLayerSystemConfig = {
		...baseConfig,
		layers: { ...baseConfig.layers },
	};

	// Mapear propiedades específicas
	if (props.borderColor && layerConfig.layers.border) {
		layerConfig.layers.border = {
			...layerConfig.layers.border,
			color: props.borderColor,
		};
	}

	if (props.glowColor && layerConfig.layers.glow) {
		layerConfig.layers.glow = {
			...layerConfig.layers.glow,
			color: props.glowColor,
		};
	}

	if (props.showMetadata !== undefined && layerConfig.layers.metadata) {
		layerConfig.layers.metadata = {
			...layerConfig.layers.metadata,
			enabled: props.showMetadata,
		};
	}

	// Configuraciones globales
	if (props.disableEffects) {
		layerConfig.highPerformanceMode = true;
	}

	if (props.disableAnimations) {
		layerConfig.disableAnimations = true;
	}

	return layerConfig;
}

/**
 * Convierte configuración de capas a propiedades de EntityCard
 */
export function layerConfigToEntityCardProps(config: EntityCardLayerSystemConfig): Record<string, unknown> {
	const props: Record<string, unknown> = {};

	// Extraer propiedades específicas de la configuración de capas
	if (config.layers.border?.color) {
		props.borderColor = config.layers.border.color;
	}

	if (config.layers.glow?.color) {
		props.glowColor = config.layers.glow.color;
	}

	if (config.layers.metadata !== undefined) {
		props.showMetadata = config.layers.metadata.enabled !== false;
	}

	// Configuraciones globales
	if (config.highPerformanceMode) {
		props.disableEffects = true;
	}

	if (config.disableAnimations) {
		props.disableAnimations = true;
	}

	return props;
}

/**
 * Fusiona dos configuraciones de capas
 */
export function mergeLayerConfigs(
	baseConfig: EntityCardLayerSystemConfig,
	overrideConfig: Partial<EntityCardLayerSystemConfig>
): EntityCardLayerSystemConfig {
	return {
		...baseConfig,
		...overrideConfig,
		layers: {
			...baseConfig.layers,
			...(overrideConfig.layers || {}),
		},
	};
}

/**
 * Guarda la configuración de capas para un tipo de entidad
 */
export function saveEntityTypeLayerConfig(entityType: string, config: EntityCardLayerSystemConfig): void {
	// Aquí implementaríamos la lógica para guardar la configuración
	// en localStorage, base de datos, etc.
	try {
		localStorage.setItem(`entity-card-layer-config-${entityType}`, JSON.stringify(config));
	} catch (error) {
		console.error('Error al guardar configuración de capas:', error);
	}
}

/**
 * Carga la configuración de capas guardada para un tipo de entidad
 */
export function loadSavedEntityTypeLayerConfig(entityType: string): EntityCardLayerSystemConfig | null {
	try {
		const saved = localStorage.getItem(`entity-card-layer-config-${entityType}`);
		if (saved) {
			return JSON.parse(saved);
		}
	} catch (error) {
		console.error('Error al cargar configuración de capas guardada:', error);
	}
	return null;
}

/**
 * Obtiene la configuración de capas para un tipo de entidad,
 * con preferencia por la configuración guardada
 */
export function getEntityLayerConfig(entityType: string): EntityCardLayerSystemConfig {
	const savedConfig = loadSavedEntityTypeLayerConfig(entityType);
	if (savedConfig) {
		return savedConfig;
	}
	return getEntityTypeLayerConfig(entityType);
}
