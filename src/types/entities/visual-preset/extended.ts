import type { VisualPresetBase } from './base';
import type { AnimationType, CardDesignType, CornerStyle, LayerType, PerformanceMode } from './enums';

/**
 * Tipo para las etiquetas de los presets visuales
 */
export interface VisualPresetTags {
	items: string[];
}

/**
 * Estructura para config de colores
 */
export interface ColorConfig {
	primaryColor: string;
	secondaryColor: string;
	accentColor?: string;
	backgroundColor?: string;
	textColor?: string;
	borderColor?: string;
	highlightColor?: string;
	shadowColor?: string;
}

/**
 * Estructura para config de cuadrícula de imágenes
 */
export interface ImageGridConfig {
	layout: string;
	gap: number;
	columns?: number;
	rows?: number;
	aspectRatio: string;
	style: string;
}

/**
 * Estructura para config de diseño
 */
export interface LayoutConfig {
	designType: CardDesignType;
	cornerStyle: CornerStyle;
	cornerRadius: number;
	elevation: number;
	shadowStyle: string;
	aspectRatio?: string;
}

/**
 * Estructura para config del sistema de capas
 */
export interface LayerSystemConfig {
	layers: LayerType[];
	layerOrder: Record<LayerType, number>;
	visibleLayers: LayerType[];
}

/**
 * Estructura para config de efectos
 */
export interface EffectsConfig {
	enableGlow: boolean;
	enableScanlines: boolean;
	enableGrainEffect: boolean;
	enableLightHalo: boolean;
	enableAnimatedBorder: boolean;
	enable3DEffect: boolean;
	enableHolographicEffect: boolean;
	enableGlitchEffect: boolean;
	enableChromaticAberration: boolean;
	enablePixelate: boolean;
	maxRotation?: number;
	hoverLiftHeight?: number;
}

/**
 * Estructura para config de rendimiento
 */
export interface PerformanceConfig {
	mode: PerformanceMode;
	enableLazyLoading: boolean;
	enablePrefetch: boolean;
	enableSkeleton: boolean;
	optimizeForMobile: boolean;
	optimizeForTouch: boolean;
}

/**
 * Estructura para config de estados de UI
 */
export interface UIStatesConfig {
	enableHover: boolean;
	enableActive: boolean;
	enableFocus: boolean;
	enableDisabled: boolean;
	hoverAnimation?: AnimationType;
	activeAnimation?: AnimationType;
	focusAnimation?: AnimationType;
}

/**
 * Interfaz que extiende el preset visual con propiedades deserializadas
 */
export interface VisualPresetExtended extends VisualPresetBase {
	parsedTags: string[];
	parsedColorConfig?: ColorConfig;
	parsedImageGridConfig?: ImageGridConfig;
	parsedLayoutConfig?: LayoutConfig;
	parsedLayerConfig?: LayerSystemConfig;
	parsedEffectsConfig?: EffectsConfig;
	parsedPerformanceConfig?: PerformanceConfig;
	parsedUIStatesConfig?: UIStatesConfig;
	parsedMetadata?: Record<string, any>;
}
