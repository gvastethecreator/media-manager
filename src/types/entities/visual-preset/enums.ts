/**
 * Categorías de presets visuales
 */
export enum VisualPresetCategory {
	GENERAL = 'general',
	CARDS = 'cards',
	GRID = 'grid',
	LIST = 'list',
	GALLERY = 'gallery',
	CUSTOM = 'custom',
	GAME = 'game',
	MINIMAL = 'minimal',
	PREMIUM = 'premium',
}

/**
 * Tipos de efectos visuales
 */
export enum VisualEffectType {
	GLOW = 'glow',
	HOLOGRAPHIC = 'holographic',
	SCANLINES = 'scanlines',
	GRAIN = 'grain',
	BORDER = 'border',
	ANIMATED_BORDER = 'animated_border',
	GLITCH = 'glitch',
	CHROMATIC_ABERRATION = 'chromatic_aberration',
	PIXELATE = 'pixelate',
	NOISE = 'noise',
	PATTERN = 'pattern',
	FILTER = 'filter',
	DISTORTION = 'distortion',
	LIGHT_HALO = 'light_halo',
	BLUR = 'blur',
	THREE_D = '3d',
}

/**
 * Tipos de diseño para tarjetas
 */
export enum CardDesignType {
	STANDARD = 'standard',
	MAGIC_CARD = 'magic_card',
	MINIMAL = 'minimal',
	MODERN = 'modern',
	RETRO = 'retro',
	CYBER = 'cyber',
	FANTASY = 'fantasy',
	SCI_FI = 'sci_fi',
	ABSTRACT = 'abstract',
	CUSTOM = 'custom',
}

/**
 * Modos de color
 */
export enum ColorMode {
	LIGHT = 'light',
	DARK = 'dark',
	AUTO = 'auto',
	CUSTOM = 'custom',
}

/**
 * Configuraciones de rendimiento
 */
export enum PerformanceMode {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	ULTRA = 'ultra',
	ADAPTIVE = 'adaptive',
}

/**
 * Estilos de esquinas
 */
export enum CornerStyle {
	ROUNDED = 'rounded',
	SHARP = 'sharp',
	BEVELED = 'beveled',
	CUSTOM = 'custom',
}

/**
 * Modos de blend (mezclado)
 */
export enum BlendMode {
	NORMAL = 'normal',
	MULTIPLY = 'multiply',
	SCREEN = 'screen',
	OVERLAY = 'overlay',
	DARKEN = 'darken',
	LIGHTEN = 'lighten',
	COLOR_DODGE = 'color-dodge',
	COLOR_BURN = 'color-burn',
	HARD_LIGHT = 'hard-light',
	SOFT_LIGHT = 'soft-light',
	DIFFERENCE = 'difference',
	EXCLUSION = 'exclusion',
	HUE = 'hue',
	SATURATION = 'saturation',
	COLOR = 'color',
	LUMINOSITY = 'luminosity',
}

/**
 * Tipos de animación
 */
export enum AnimationType {
	NONE = 'none',
	FADE = 'fade',
	SLIDE = 'slide',
	ZOOM = 'zoom',
	ROTATE = 'rotate',
	PULSE = 'pulse',
	WAVE = 'wave',
	FLOW = 'flow',
	GLITCH = 'glitch',
	CUSTOM = 'custom',
}

/**
 * Tipos de capa (layer)
 */
export enum LayerType {
	BASE = 'base',
	BACKGROUND = 'background',
	PATTERN = 'pattern',
	CONTENT = 'content',
	FOREGROUND = 'foreground',
	EFFECT = 'effect',
	OVERLAY = 'overlay',
}

/**
 * Tipos de sistema de diseño
 */
export enum DesignSystem {
	DEFAULT = 'default_design_system',
	MINIMAL = 'minimal_design_system',
	MODERN = 'modern_design_system',
	PREMIUM = 'premium_design_system',
	RETRO = 'retro_design_system',
	CUSTOM = 'custom_design_system',
}
