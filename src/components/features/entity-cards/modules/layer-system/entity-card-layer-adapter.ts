'use client';

/**
 * 🌈 Adaptadores bidireccionales entre EntityCard y el sistema de capas
 *
 * Este archivo proporciona funciones para convertir entre las opciones de EntityCard
 * y la configuración del sistema de capas, permitiendo una integración fluida.
 */

import type { LayerConfig, LayerImplementation, LayerSystemConfig } from '../layers/types';
import { DEFAULT_LAYER_SYSTEM } from '../settings/layer-settings-config';
import type { CardOptions } from '../types/card-settings-types';
import type { LayersModuleConfig } from './types';

// Interfaces auxiliares para tipar correctamente las opciones
interface LayerOptions {
	system?: Partial<LayerSystemConfig>;
	configs?: Record<string, LayerConfig>;
}

interface VisualOptions {
	layerSystem?: Partial<LayerSystemConfig>;
	layerConfigs?: Record<string, LayerConfig>;
}

/**
 * Configuración por defecto para el sistema de capas
 */
export const DEFAULT_ENTITY_CARD_LAYERS_CONFIG = {
	layerSystem: {
		...DEFAULT_LAYER_SYSTEM,
		// Asegurar que tenga las propiedades requeridas
		enabled: true,
		renderStrategy: 'stacked' as const,
		compositionMode: 'normal' as const,
		enabledLayers: {} as Record<string, boolean>,
		layerOrder: [] as string[]
	},
	layerConfigs: {} as Record<string, LayerConfig>,
	layers: {} as Record<string, LayerImplementation>,
};

/**
 * Interfaz para la configuración completa del sistema de capas en EntityCard
 * Esta interfaz es compatible con LayersModuleConfig para permitir la integración
 */
export interface EntityCardLayerSystemConfig extends Omit<LayersModuleConfig, 'layers'> {
	/**
	 * Configuración del sistema de capas
	 */
	layerSystem: LayerSystemConfig;

	/**
	 * Configuraciones individuales de cada capa
	 */
	layerConfigs: Record<string, LayerConfig>;

	/**
	 * Capas registradas en el sistema (opcional)
	 * Esta propiedad es opcional para mantener compatibilidad con código existente
	 */
	layers?: Record<string, LayerImplementation>;

	/**
	 * Opacidad global de las capas
	 */
	globalOpacity?: number;
}

/**
 * Convierte opciones de EntityCard a configuración de capas
 */
export function adaptEntityCardToLayerSystem(cardOptions?: Partial<CardOptions>): EntityCardLayerSystemConfig {
	if (!cardOptions) {
		return DEFAULT_ENTITY_CARD_LAYERS_CONFIG as EntityCardLayerSystemConfig;
	}

	// Extraer propiedades visuales de las opciones de la tarjeta
	const visualOptions = (cardOptions.visualOptions || {}) as VisualOptions;
	const layerOptions = (cardOptions.layerOptions || {}) as LayerOptions;

	// Obtener propiedades específicas de las capas
	const layerSystem: LayerSystemConfig = {
		...DEFAULT_ENTITY_CARD_LAYERS_CONFIG.layerSystem,
		...(layerOptions.system || {}),
		...(visualOptions.layerSystem || {}),
	};

	// Combinar configuraciones de capas individuales
	const layerConfigs: Record<string, LayerConfig> = {
		...(layerOptions.configs || {}),
		...(visualOptions.layerConfigs || {}),
	};

	return {
		layerSystem,
		layerConfigs,
		// Preservar cualquier capa registrada que pueda estar presente
		layers: {},
	};
}

/**
 * Convierte configuración de capas a opciones de EntityCard
 */
export function adaptLayerSystemToEntityCard(config: EntityCardLayerSystemConfig): Partial<CardOptions> {
	return {
		visualOptions: {
			layerSystem: config.layerSystem,
			layerConfigs: config.layerConfigs,
		},
	};
}

/**
 * Convierte EntityCardLayerSystemConfig a LayersModuleConfig
 * Este adaptador asegura la compatibilidad completa entre los dos sistemas
 */
export function adaptEntityCardConfigToLayersModuleConfig(
	config: EntityCardLayerSystemConfig
): LayersModuleConfig {
	return {
		layerSystem: config.layerSystem,
		layerConfigs: config.layerConfigs,
		// Usar las capas proporcionadas o un objeto vacío si no hay ninguna
		layers: config.layers || {},
	};
}

/**
 * Detecta automáticamente el formato de configuración y lo convierte al formato deseado
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
		const result = adaptLayerSystemToEntityCard(config as unknown as EntityCardLayerSystemConfig);
		return result as Record<string, unknown>;
	}

	if (targetFormat === 'layerSystem' && isEntityCardFormat) {
		const result = adaptEntityCardToLayerSystem(config as unknown as Partial<CardOptions>);
		return result as unknown as Record<string, unknown>;
	}

	// Si no se puede determinar el formato, devolver la configuración original
	console.warn('No se pudo determinar el formato de configuración de capas');
	return config;
}

/**
 * Fusiona configuraciones de capas específicas por tipo de entidad con la configuración base
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
 */
export function useEntityTypeLayerConfig(
	entityType: string,
	entityId?: string,
	initialConfig?: Partial<EntityCardLayerSystemConfig>
): EntityCardLayerSystemConfig {
	// Aquí se implementaría un hook completo con estado y efectos
	// Por ahora, simplemente fusionamos la configuración base con la específica del tipo
	const baseConfig = {
		...DEFAULT_ENTITY_CARD_LAYERS_CONFIG,
		...(initialConfig || {}),
		layerSystem: {
			...DEFAULT_ENTITY_CARD_LAYERS_CONFIG.layerSystem,
			...(initialConfig?.layerSystem || {}),
		},
		layers: initialConfig?.layers || {},
	} as EntityCardLayerSystemConfig;

	return mergeEntityTypeLayerConfig(baseConfig, entityType);
}

/**
 * Configuración predeterminada para el sistema de capas (versión compatible)
 */
export const DEFAULT_ENTITY_CARD_LAYER_CONFIG: EntityCardLayerSystemConfig = {
	layerSystem: {
		enabled: true,
		renderStrategy: 'stacked' as const,
		compositionMode: 'normal' as const,
		enabledLayers: {},
		layerOrder: [],
	},
	layerConfigs: {},
	layers: {},
	globalOpacity: 100,
};

/**
 * Obtiene una configuración de capas para un tipo de entidad específico
 * NOTA: Esta función está obsoleta y se mantiene para compatibilidad.
 * Se recomienda usar adaptEntityCardToLayerSystem o useEntityTypeLayerConfig
 */
export function getEntityTypeLayerConfig(entityType: string): EntityCardLayerSystemConfig {
	// Configuración base para todos los tipos
	const baseConfig: EntityCardLayerSystemConfig = {
		...DEFAULT_ENTITY_CARD_LAYER_CONFIG,
		layerSystem: {
			...DEFAULT_ENTITY_CARD_LAYER_CONFIG.layerSystem,
			enabled: true,
			renderStrategy: 'stacked' as const,
			compositionMode: 'normal' as const,
			enabledLayers: {
				border: true,
				content: true,
				metadata: true,
			},
			layerOrder: ['border', 'content', 'metadata'],
		},
		layerConfigs: {
			border: {
				enabled: true,
				layerIndex: 0,
				borderWidth: 2,
				borderStyle: 'solid',
				borderColor: 'var(--border-color, currentColor)',
			},
			content: {
				enabled: true,
				layerIndex: 1,
			},
			metadata: {
				enabled: true,
				layerIndex: 2,
				showTitle: true,
				position: 'bottom',
			},
		},
	};

	// Modificar según el tipo de entidad
	switch (entityType) {
		case 'image':
			return {
				...baseConfig,
				layerSystem: {
					...baseConfig.layerSystem,
					enabledLayers: {
						...baseConfig.layerSystem.enabledLayers,
						glow: true,
					},
					layerOrder: ['border', 'content', 'glow', 'metadata'],
				},
				layerConfigs: {
					...baseConfig.layerConfigs,
					glow: {
						enabled: true,
						layerIndex: 2,
						glowColor: 'var(--glow-color, rgba(255, 255, 255, 0.5))',
						glowSize: 10,
						glowIntensity: 0.5,
					},
				},
			};
		case 'folder':
			return {
				...baseConfig,
				layerSystem: {
					...baseConfig.layerSystem,
					enabledLayers: {
						...baseConfig.layerSystem.enabledLayers,
						texture: true,
					},
					layerOrder: ['border', 'content', 'texture', 'metadata'],
				},
				layerConfigs: {
					...baseConfig.layerConfigs,
					texture: {
						enabled: true,
						layerIndex: 2,
						textureOpacity: 0.1,
						textureBlendMode: 'overlay',
					},
				},
			};
		case 'album':
			return {
				...baseConfig,
				layerSystem: {
					...baseConfig.layerSystem,
					enabledLayers: {
						...baseConfig.layerSystem.enabledLayers,
						imageGrid: true,
					},
					layerOrder: ['border', 'imageGrid', 'metadata'],
				},
				layerConfigs: {
					...baseConfig.layerConfigs,
					imageGrid: {
						enabled: true,
						layerIndex: 1,
						columns: 2,
						rows: 2,
						gap: 2,
					},
				},
			};
		case 'tag':
			return {
				...baseConfig,
				layerSystem: {
					...baseConfig.layerSystem,
					layerOrder: ['border', 'content'],
				},
				layerConfigs: {
					...baseConfig.layerConfigs,
					border: {
						...baseConfig.layerConfigs.border,
						borderWidth: 1,
						cornerRadius: 16,
					},
					content: {
						...baseConfig.layerConfigs.content,
						padding: '0.5rem 1rem',
					},
					metadata: {
						enabled: false,
						layerIndex: -1,
					},
				},
			};
		default:
			return baseConfig;
	}
}

/**
 * Adapta la configuración de capas para que sea compatible con las opciones de las tarjetas de entidades
 * Esta función es útil para la integración con componentes que esperan CardOptions
 */
export function adaptLayerSystemToCardOptions(config: EntityCardLayerSystemConfig): Partial<CardOptions> {
	// Extraer propiedades relevantes de la configuración de capas
	const { layerSystem, layerConfigs } = config;

	// Crear el objeto de opciones de tarjeta
	const cardOptions: Partial<CardOptions> = {
		// Propiedades directas de la tarjeta
		enable3DEffect: layerSystem.renderStrategy === 'dynamic', // Ajustado para evitar comparación incompatible
		enableGlowEffect: !!layerConfigs.glow?.enabled,
		enableAnimatedBorder: !!layerConfigs.animatedBorder?.enabled,

		// Opciones visuales organizadas
		visualOptions: {
			layerSystem,
			layerConfigs,
		},

		// Opciones de capa
		layerOptions: {
			system: layerSystem,
			configs: layerConfigs,
		},
	};

	return cardOptions;
}

/**
 * Valida y repara la configuración del sistema de capas para asegurar que sea coherente
 */
export function validateAndRepairLayerConfig(config: EntityCardLayerSystemConfig): EntityCardLayerSystemConfig {
	// Asegurar que exista la configuración básica del sistema
	const repairedConfig = {
		...DEFAULT_ENTITY_CARD_LAYER_CONFIG,
		...config,
		layerSystem: {
			...DEFAULT_ENTITY_CARD_LAYER_CONFIG.layerSystem,
			...config.layerSystem,
			// Asegurar que siempre existan estas propiedades
			layerOrder: config.layerSystem.layerOrder || DEFAULT_ENTITY_CARD_LAYER_CONFIG.layerSystem.layerOrder || [],
			enabledLayers: config.layerSystem.enabledLayers || DEFAULT_ENTITY_CARD_LAYER_CONFIG.layerSystem.enabledLayers || {},
		},
	};

	// Asegurar que cada capa habilitada tenga una configuración
	const enabledLayers = repairedConfig.layerSystem.enabledLayers;
	const layerOrder = repairedConfig.layerSystem.layerOrder;
	const layerConfigs = repairedConfig.layerConfigs || {};

	// Asegurar que todas las capas habilitadas estén en el orden
	for (const layerId of Object.keys(enabledLayers)) {
		if (enabledLayers[layerId] && !layerOrder.includes(layerId)) {
			repairedConfig.layerSystem.layerOrder = [...layerOrder, layerId];
		}
	}

	// Asegurar que todas las capas en el orden tengan una configuración
	for (const layerId of repairedConfig.layerSystem.layerOrder) {
		if (!layerConfigs[layerId]) {
			repairedConfig.layerConfigs = {
				...repairedConfig.layerConfigs,
				[layerId]: {
					enabled: true,
					layerIndex: repairedConfig.layerSystem.layerOrder.indexOf(layerId),
				},
			};
		}
	}

	return repairedConfig;
}

/**
 * Convierte propiedades de EntityCard a configuración de capas
 * NOTA: Función obsoleta, se mantiene para compatibilidad
 */
export function entityCardPropsToLayerConfig(
	entityType: string,
	props: Record<string, unknown>
): EntityCardLayerSystemConfig {
	const baseConfig = getEntityTypeLayerConfig(entityType);

	// Inicialización segura de layerConfigs
	const layerConfigs = { ...baseConfig.layerConfigs };

	// Mapeo simplificado para evitar errores de tipo
	if (props.borderColor && layerConfigs.border) {
		layerConfigs.border = {
			...layerConfigs.border,
			borderColor: props.borderColor,
		};
	}

	if (props.glowColor && layerConfigs.glow) {
		layerConfigs.glow = {
			...layerConfigs.glow,
			glowColor: props.glowColor,
		};
	}

	if (props.showMetadata !== undefined && layerConfigs.metadata) {
		layerConfigs.metadata = {
			...layerConfigs.metadata,
			enabled: Boolean(props.showMetadata),
		};
	}

	return {
		...baseConfig,
		layerConfigs,
	};
}

/**
 * Convierte configuración de capas a propiedades de EntityCard
 * NOTA: Función obsoleta, se mantiene para compatibilidad
 */
export function layerConfigToEntityCardProps(config: EntityCardLayerSystemConfig): Record<string, unknown> {
	const props: Record<string, unknown> = {};

	// Mapeo simplificado para evitar errores de tipo
	if (config.layerConfigs?.border?.borderColor) {
		props.borderColor = config.layerConfigs.border.borderColor;
	}

	if (config.layerConfigs?.glow?.glowColor) {
		props.glowColor = config.layerConfigs.glow.glowColor;
	}

	if (config.layerConfigs?.metadata !== undefined) {
		props.showMetadata = config.layerConfigs.metadata.enabled !== false;
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
		layerSystem: {
			...baseConfig.layerSystem,
			...(overrideConfig.layerSystem || {}),
			enabledLayers: {
				...(baseConfig.layerSystem.enabledLayers || {}),
				...(overrideConfig.layerSystem?.enabledLayers || {}),
			},
			layerOrder: overrideConfig.layerSystem?.layerOrder || baseConfig.layerSystem.layerOrder || [],
		},
		layerConfigs: {
			...baseConfig.layerConfigs,
			...(overrideConfig.layerConfigs || {}),
		},
		layers: {
			...(baseConfig.layers || {}),
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
