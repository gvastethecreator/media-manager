'use client';

/**
 * 🌈 Presets de capas para diferentes tipos de tarjetas
 *
 * Este archivo define configuraciones predefinidas de capas para diferentes estilos
 * y tipos de entidades, permitiendo aplicar rápidamente conjuntos de capas.
 */

import type { LayerConfig } from '../../layers/types';
import { DEFAULT_LAYER_SYSTEM } from '../../settings/layer-settings-config';
import type { EntityCardLayerSystemConfig } from './entity-card-layer-adapter';

/**
 * Interfaz para un preset de capas
 */
export interface LayerPreset {
	id: string;
	name: string;
	description: string;
	thumbnail?: string;
	category: 'basic' | 'advanced' | 'special' | 'custom';
	entityTypes: string[];
	config: EntityCardLayerSystemConfig;
}

/**
 * Preset básico con solo bordes
 */
const basicPreset: LayerPreset = {
	id: 'basic',
	name: 'Básico',
	description: 'Configuración básica con solo bordes y contenido',
	category: 'basic',
	entityTypes: ['image', 'folder', 'album', 'tag', 'collection'],
	config: {
		layerSystem: {
			...DEFAULT_LAYER_SYSTEM,
			enabled: true,
			renderStrategy: 'stacked',
		},
		layerConfigs: {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			border: {
				enabled: true,
				layerIndex: 1,
				borderWidth: 2,
				borderStyle: 'solid',
				borderColor: 'var(--border-color, currentColor)',
			},
			content: {
				enabled: true,
				layerIndex: 2,
			},
		},
	},
};

/**
 * Preset con efectos de brillo
 */
const glowPreset: LayerPreset = {
	id: 'glow',
	name: 'Resplandor',
	description: 'Tarjeta con efecto de resplandor en los bordes',
	category: 'basic',
	entityTypes: ['image', 'folder', 'album'],
	config: {
		layerSystem: {
			...DEFAULT_LAYER_SYSTEM,
			enabled: true,
			renderStrategy: 'stacked',
		},
		layerConfigs: {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			border: {
				enabled: true,
				layerIndex: 1,
				borderWidth: 2,
				borderStyle: 'solid',
				borderColor: 'var(--border-color, currentColor)',
			},
			content: {
				enabled: true,
				layerIndex: 2,
			},
			glow: {
				enabled: true,
				layerIndex: 3,
				glowColor: 'var(--glow-color, rgba(255, 255, 255, 0.7))',
				glowSize: 15,
				glowIntensity: 0.7,
				animateOnHover: true,
			},
		},
	},
};

/**
 * Preset holográfico
 */
const holographicPreset: LayerPreset = {
	id: 'holographic',
	name: 'Holográfico',
	description: 'Efecto holográfico tipo carta coleccionable',
	category: 'advanced',
	entityTypes: ['image', 'album'],
	config: {
		layerSystem: {
			...DEFAULT_LAYER_SYSTEM,
			enabled: true,
			renderStrategy: 'stacked',
		},
		layerConfigs: {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			border: {
				enabled: true,
				layerIndex: 1,
				borderWidth: 3,
				borderStyle: 'solid',
				borderColor: 'var(--border-color, currentColor)',
			},
			content: {
				enabled: true,
				layerIndex: 2,
			},
			holographic: {
				enabled: true,
				layerIndex: 3,
				intensity: 0.8,
				colorShift: true,
				animateOnHover: true,
			},
			glow: {
				enabled: true,
				layerIndex: 4,
				glowColor: 'var(--glow-color, rgba(255, 255, 255, 0.5))',
				glowSize: 10,
				glowIntensity: 0.5,
				animateOnHover: true,
			},
		},
	},
};

/**
 * Preset retro con líneas de escaneo
 */
const retroPreset: LayerPreset = {
	id: 'retro',
	name: 'Retro',
	description: 'Estilo retro con líneas de escaneo y grano',
	category: 'special',
	entityTypes: ['image', 'folder', 'album'],
	config: {
		layerSystem: {
			...DEFAULT_LAYER_SYSTEM,
			enabled: true,
			renderStrategy: 'stacked',
		},
		layerConfigs: {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			border: {
				enabled: true,
				layerIndex: 1,
				borderWidth: 2,
				borderStyle: 'solid',
				borderColor: 'var(--border-color, #888888)',
			},
			content: {
				enabled: true,
				layerIndex: 2,
			},
			scanlines: {
				enabled: true,
				layerIndex: 3,
				linesOpacity: 0.15,
				linesCount: 50,
				linesColor: 'rgba(0, 0, 0, 0.7)',
			},
			grain: {
				enabled: true,
				layerIndex: 4,
				grainOpacity: 0.1,
				grainDensity: 0.5,
				animateGrain: true,
			},
		},
	},
};

/**
 * Preset de tarjeta de carpeta
 */
const folderPreset: LayerPreset = {
	id: 'folder-card',
	name: 'Tarjeta de Carpeta',
	description: 'Estilo específico para carpetas con metadatos',
	category: 'special',
	entityTypes: ['folder'],
	config: {
		layerSystem: {
			...DEFAULT_LAYER_SYSTEM,
			enabled: true,
			renderStrategy: 'stacked',
		},
		layerConfigs: {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			border: {
				enabled: true,
				layerIndex: 1,
				borderWidth: 2,
				borderStyle: 'solid',
				borderColor: 'var(--border-color, currentColor)',
			},
			content: {
				enabled: true,
				layerIndex: 2,
			},
			texture: {
				enabled: true,
				layerIndex: 3,
				textureOpacity: 0.1,
				textureBlendMode: 'overlay',
			},
			metadata: {
				enabled: true,
				layerIndex: 4,
				showStats: true,
				showPath: true,
				showCreationDate: true,
			},
		},
	},
};

/**
 * Preset de tarjeta de imagen
 */
const imagePreset: LayerPreset = {
	id: 'image-card',
	name: 'Tarjeta de Imagen',
	description: 'Estilo optimizado para mostrar imágenes',
	category: 'basic',
	entityTypes: ['image'],
	config: {
		layerSystem: {
			...DEFAULT_LAYER_SYSTEM,
			enabled: true,
			renderStrategy: 'stacked',
		},
		layerConfigs: {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			border: {
				enabled: true,
				layerIndex: 1,
				borderWidth: 0,
			},
			image: {
				enabled: true,
				layerIndex: 2,
				objectFit: 'cover',
				aspectRatio: '3/2',
				cornerRadius: 8,
			},
			metadata: {
				enabled: true,
				layerIndex: 3,
				showTitle: true,
				showDimensions: true,
				position: 'bottom',
				background: 'gradient',
			},
		},
	},
};

/**
 * Preset de tarjeta de álbum
 */
const albumPreset: LayerPreset = {
	id: 'album-card',
	name: 'Tarjeta de Álbum',
	description: 'Estilo para álbumes con vista previa de imágenes',
	category: 'basic',
	entityTypes: ['album'],
	config: {
		layerSystem: {
			...DEFAULT_LAYER_SYSTEM,
			enabled: true,
			renderStrategy: 'stacked',
		},
		layerConfigs: {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			border: {
				enabled: true,
				layerIndex: 1,
				borderWidth: 1,
				borderStyle: 'solid',
				borderColor: 'var(--border-color, rgba(255,255,255,0.1))',
			},
			imageGrid: {
				enabled: true,
				layerIndex: 2,
				columns: 2,
				rows: 2,
				gap: 2,
				cornerRadius: 4,
			},
			metadata: {
				enabled: true,
				layerIndex: 3,
				showTitle: true,
				showCount: true,
				position: 'bottom',
				background: 'solid',
			},
		},
	},
};

/**
 * Preset de tarjeta de etiqueta
 */
const tagPreset: LayerPreset = {
	id: 'tag-card',
	name: 'Tarjeta de Etiqueta',
	description: 'Estilo minimalista para etiquetas',
	category: 'basic',
	entityTypes: ['tag'],
	config: {
		layerSystem: {
			...DEFAULT_LAYER_SYSTEM,
			enabled: true,
			renderStrategy: 'stacked',
		},
		layerConfigs: {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			border: {
				enabled: true,
				layerIndex: 1,
				borderWidth: 1,
				borderStyle: 'solid',
				borderColor: 'var(--border-color, rgba(255,255,255,0.2))',
				cornerRadius: 16,
			},
			content: {
				enabled: true,
				layerIndex: 2,
				padding: '0.5rem 1rem',
			},
		},
	},
};

/**
 * Preset de tarjeta con efectos de glitch
 */
const glitchPreset: LayerPreset = {
	id: 'glitch',
	name: 'Glitch',
	description: 'Efectos de glitch y distorsión digital',
	category: 'advanced',
	entityTypes: ['image', 'album'],
	config: {
		layerSystem: {
			...DEFAULT_LAYER_SYSTEM,
			enabled: true,
			renderStrategy: 'stacked',
		},
		layerConfigs: {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			border: {
				enabled: true,
				layerIndex: 1,
				borderWidth: 2,
				borderStyle: 'solid',
				borderColor: 'var(--border-color, rgba(0,255,255,0.5))',
			},
			content: {
				enabled: true,
				layerIndex: 2,
			},
			glitch: {
				enabled: true,
				layerIndex: 3,
				intensity: 0.5,
				frequency: 0.2,
				animateOnHover: true,
			},
			chromaticAberration: {
				enabled: true,
				layerIndex: 4,
				offset: 3,
				direction: 'horizontal',
			},
		},
	},
};

/**
 * Preset de tarjeta con borde animado
 */
const animatedBorderPreset: LayerPreset = {
	id: 'animated-border',
	name: 'Borde Animado',
	description: 'Borde con animación de flujo de color',
	category: 'advanced',
	entityTypes: ['image', 'album', 'folder'],
	config: {
		layerSystem: {
			...DEFAULT_LAYER_SYSTEM,
			enabled: true,
			renderStrategy: 'stacked',
		},
		layerConfigs: {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			content: {
				enabled: true,
				layerIndex: 1,
			},
			animatedBorder: {
				enabled: true,
				layerIndex: 2,
				borderWidth: 3,
				animationSpeed: 2,
				colorMode: 'rainbow',
				customColors: ['#ff0080', '#7928ca', '#0070f3', '#00dfd8'],
			},
		},
	},
};

/**
 * Todos los presets disponibles
 */
export const LAYER_PRESETS: LayerPreset[] = [
	basicPreset,
	glowPreset,
	holographicPreset,
	retroPreset,
	folderPreset,
	imagePreset,
	albumPreset,
	tagPreset,
	glitchPreset,
	animatedBorderPreset,
];

/**
 * Obtiene presets filtrados por tipo de entidad
 */
export function getPresetsByEntityType(entityType: string): LayerPreset[] {
	return LAYER_PRESETS.filter(
		(preset) => preset.entityTypes.includes(entityType) || preset.entityTypes.includes('all')
	);
}

/**
 * Obtiene un preset por su ID
 */
export function getPresetById(presetId: string): LayerPreset | undefined {
	return LAYER_PRESETS.find((preset) => preset.id === presetId);
}

/**
 * Crea un nuevo preset personalizado
 */
export function createCustomPreset(
	name: string,
	description: string,
	entityTypes: string[],
	config: EntityCardLayerSystemConfig
): LayerPreset {
	return {
		id: `custom-${Date.now()}`,
		name,
		description,
		category: 'custom',
		entityTypes,
		config,
	};
}

/**
 * Aplica un preset a una configuración existente
 */
export function applyPresetToConfig(
	preset: LayerPreset,
	existingConfig?: Partial<EntityCardLayerSystemConfig>
): EntityCardLayerSystemConfig {
	if (!existingConfig) {
		return preset.config;
	}

	// Fusionar configuraciones manteniendo capas personalizadas
	const mergedLayerConfigs: Record<string, LayerConfig> = {
		...existingConfig.layerConfigs,
	};

	// Aplicar configuraciones del preset
	for (const [key, layerConfig] of Object.entries(preset.config.layerConfigs)) {
		mergedLayerConfigs[key] = {
			...mergedLayerConfigs[key],
			...layerConfig,
		};
	}

	return {
		layerSystem: {
			...existingConfig.layerSystem,
			...preset.config.layerSystem,
		},
		layerConfigs: mergedLayerConfigs,
	};
}
