import { serverLogger } from '@/lib/logger/server-logger';
import type {
	ColorConfig,
	EffectsConfig,
	ImageGridConfig,
	LayerSystemConfig,
	LayoutConfig,
	PerformanceConfig,
	UIStatesConfig,
	VisualPresetBase,
	VisualPresetExtended,
	VisualPresetTags,
} from '@/types/entities/visual-preset';

const serializersLogger = serverLogger.withContext('VisualPreset:Serializers');

/**
 * Serializa un array de tags a string para almacenar en BD
 * @param tags Array de tags
 * @returns String JSON serializado
 */
export function serializeTags(tags: string[]): string {
	try {
		const tagsObj: VisualPresetTags = { items: tags };
		return JSON.stringify(tagsObj);
	} catch (error) {
		serializersLogger.error('❌ Error serializando tags:', error);
		return JSON.stringify({ items: [] });
	}
}

/**
 * Deserializa string JSON de tags a array
 * @param tagsJson String JSON de tags
 * @returns Array de tags
 */
export function deserializeTags(tagsJson: string | null | undefined): string[] {
	if (!tagsJson || tagsJson === 'empty_array') return [];

	try {
		const parsed = JSON.parse(tagsJson) as VisualPresetTags;
		return Array.isArray(parsed.items) ? parsed.items : [];
	} catch (error) {
		serializersLogger.error('❌ Error deserializando tags:', error);
		return [];
	}
}

/**
 * Función genérica para deserializar configuraciones JSON
 * @param jsonStr String JSON a deserializar
 * @param defaultValue Valor por defecto si hay error
 * @returns Objeto deserializado o valor por defecto
 */
export function deserializeConfig<T>(jsonStr: string | null | undefined, defaultValue: T): T {
	if (!jsonStr) return defaultValue;

	try {
		return JSON.parse(jsonStr) as T;
	} catch (error) {
		serializersLogger.error('❌ Error deserializando configuración:', error);
		return defaultValue;
	}
}

/**
 * Deserializa la configuración de colores
 */
export function deserializeColorConfig(jsonStr: string | null | undefined): ColorConfig | undefined {
	if (!jsonStr) return undefined;

	const defaultConfig: ColorConfig = {
		primaryColor: '#3b82f6',
		secondaryColor: '#8b5cf6',
	};

	return deserializeConfig(jsonStr, defaultConfig);
}

/**
 * Deserializa la configuración de la cuadrícula de imágenes
 */
export function deserializeImageGridConfig(jsonStr: string | null | undefined): ImageGridConfig | undefined {
	if (!jsonStr) return undefined;

	const defaultConfig: ImageGridConfig = {
		layout: 'single',
		gap: 4,
		aspectRatio: '16/9',
		style: 'standard',
	};

	return deserializeConfig(jsonStr, defaultConfig);
}

/**
 * Deserializa la configuración de diseño
 */
export function deserializeLayoutConfig(jsonStr: string | null | undefined): LayoutConfig | undefined {
	if (!jsonStr) return undefined;

	const defaultConfig: LayoutConfig = {
		designType: 'standard' as any,
		cornerStyle: 'rounded' as any,
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: 'soft',
	};

	return deserializeConfig(jsonStr, defaultConfig);
}

/**
 * Deserializa la configuración del sistema de capas
 */
export function deserializeLayerSystemConfig(jsonStr: string | null | undefined): LayerSystemConfig | undefined {
	if (!jsonStr) return undefined;

	const defaultConfig: LayerSystemConfig = {
		layers: ['base', 'background', 'content', 'effect', 'overlay'] as any[],
		layerOrder: {
			base: 0,
			background: 1,
			pattern: 2,
			content: 3,
			foreground: 4,
			effect: 5,
			overlay: 6,
		} as any,
		visibleLayers: ['base', 'background', 'content', 'effect'] as any[],
	};

	return deserializeConfig(jsonStr, defaultConfig);
}

/**
 * Deserializa la configuración de efectos
 */
export function deserializeEffectsConfig(jsonStr: string | null | undefined): EffectsConfig | undefined {
	if (!jsonStr) return undefined;

	const defaultConfig: EffectsConfig = {
		enableGlow: true,
		enableScanlines: false,
		enableGrainEffect: false,
		enableLightHalo: false,
		enableAnimatedBorder: false,
		enable3DEffect: true,
		enableHolographicEffect: false,
		enableGlitchEffect: false,
		enableChromaticAberration: false,
		enablePixelate: false,
		maxRotation: 15,
		hoverLiftHeight: 10,
	};

	return deserializeConfig(jsonStr, defaultConfig);
}

/**
 * Deserializa la configuración de rendimiento
 */
export function deserializePerformanceConfig(jsonStr: string | null | undefined): PerformanceConfig | undefined {
	if (!jsonStr) return undefined;

	const defaultConfig: PerformanceConfig = {
		mode: 'medium' as any,
		enableLazyLoading: true,
		enablePrefetch: false,
		enableSkeleton: true,
		optimizeForMobile: true,
		optimizeForTouch: true,
	};

	return deserializeConfig(jsonStr, defaultConfig);
}

/**
 * Deserializa la configuración de estados de UI
 */
export function deserializeUIStatesConfig(jsonStr: string | null | undefined): UIStatesConfig | undefined {
	if (!jsonStr) return undefined;

	const defaultConfig: UIStatesConfig = {
		enableHover: true,
		enableActive: true,
		enableFocus: true,
		enableDisabled: true,
		hoverAnimation: 'fade' as any,
		activeAnimation: 'pulse' as any,
		focusAnimation: 'glow' as any,
	};

	return deserializeConfig(jsonStr, defaultConfig);
}

/**
 * Procesa un preset visual para incluir campos deserializados
 */
export function processVisualPresetFields(preset: VisualPresetBase): VisualPresetExtended {
	try {
		return {
			...preset,
			parsedTags: deserializeTags(preset.tags),
			parsedColorConfig: deserializeColorConfig(preset.colorConfig),
			parsedImageGridConfig: deserializeImageGridConfig(preset.imageGridConfig),
			parsedLayoutConfig: deserializeLayoutConfig(preset.layoutConfig),
			parsedLayerConfig: deserializeLayerSystemConfig(preset.layerConfig),
			parsedEffectsConfig: deserializeEffectsConfig(preset.effectsConfig),
			parsedPerformanceConfig: deserializePerformanceConfig(preset.performanceConfig),
			parsedMetadata: deserializeConfig(preset.metadata, {}),
		};
	} catch (error) {
		serializersLogger.error('❌ Error procesando campos del preset visual:', error);
		return {
			...preset,
			parsedTags: [],
		};
	}
}
