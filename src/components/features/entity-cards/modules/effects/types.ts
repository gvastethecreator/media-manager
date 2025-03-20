/**
 * 🎨 Tipos para el módulo de efectos
 */

import type { CardOptions } from '../../types/unified-card-types';

/**
 * Opciones de efectos visuales
 */
export interface VisualEffectsOptions {
	holographic: CardOptions['holographicOptions'];
	scanlines: CardOptions['scanlinesOptions'];
	glow: CardOptions['glowOptions'];
	grain: CardOptions['grainOptions'];
	border: CardOptions['borderOptions'];
}

/**
 * Opciones de efectos avanzados
 */
export interface AdvancedEffectsOptions {
	distortion: DistortionOptions;
	filter: FilterOptions;
	shadow: ShadowOptions;
}

/**
 * Opciones de distorsión
 */
export interface DistortionOptions {
	enabled: boolean;
	intensity: number;
	type: 'wave' | 'twist' | 'bulge' | 'pinch' | 'none';
	animated: boolean;
	speed: number;
}

/**
 * Opciones de filtro
 */
export interface FilterOptions {
	enabled: boolean;
	brightness: number;
	contrast: number;
	saturation: number;
	hueRotate: number;
	blur: number;
	sepia: number;
}

/**
 * Opciones de sombra
 */
export interface ShadowOptions {
	enabled: boolean;
	offsetX: number;
	offsetY: number;
	blur: number;
	spread: number;
	color: string;
	opacity: number;
	inset: boolean;
}

/**
 * Configuración completa de efectos
 */
export interface EffectsConfig {
	visual: VisualEffectsOptions;
	advanced: AdvancedEffectsOptions;
}

/**
 * Props para el módulo de efectos
 */
export interface EffectsModuleProps {
	initialConfig?: Partial<EffectsConfig>;
	onChange?: (config: EffectsConfig) => void;
	cardOptions?: CardOptions;
	onCardOptionsChange?: (options: Partial<CardOptions>) => void;
}

/**
 * Props para el panel de efectos
 */
export interface EffectsPanelProps {
	config: EffectsConfig;
	onChange: (config: EffectsConfig) => void;
	cardOptions?: CardOptions;
	onCardOptionsChange?: (options: Partial<CardOptions>) => void;
}

/**
 * Valores por defecto para los efectos visuales
 */
export const DEFAULT_VISUAL_EFFECTS: VisualEffectsOptions = {
	holographic: {
		enabled: true,
		intensity: 0.5,
		animationSpeed: 5,
		patternType: 'rainbow',
		primaryColor: '#3b82f6',
		secondaryColor: '#22d3ee',
		visibleOnHover: false,
	},
	scanlines: {
		enabled: true,
		opacity: 0.1,
		spacing: 5,
		color: 'rgba(255, 255, 255, 0.1)',
		density: 1,
		animated: true,
		direction: 'horizontal',
		animationSpeed: 1,
	},
	glow: {
		enabled: true,
		intensity: 3,
		color: '#3b82f6',
		size: 10,
		blurAmount: 5,
		animationType: 'static',
	},
	grain: {
		enabled: true,
		intensity: 0.05,
		animated: true,
		density: 1,
		contrast: 0.5,
		noise: 'subtle',
	},
	border: {
		enabled: true,
		width: 2,
		color: '#3b82f6',
		pattern: 'solid',
		glowOnHover: true,
		glowIntensity: 0.5,
		glowColor: '#3b82f6',
		opacity: 1,
	},
};

/**
 * Valores por defecto para los efectos avanzados
 */
export const DEFAULT_ADVANCED_EFFECTS: AdvancedEffectsOptions = {
	distortion: {
		enabled: false,
		intensity: 0.1,
		type: 'wave',
		animated: true,
		speed: 1,
	},
	filter: {
		enabled: false,
		brightness: 1,
		contrast: 1,
		saturation: 1,
		hueRotate: 0,
		blur: 0,
		sepia: 0,
	},
	shadow: {
		enabled: false,
		offsetX: 0,
		offsetY: 4,
		blur: 8,
		spread: 0,
		color: '#000000',
		opacity: 0.2,
		inset: false,
	},
};

/**
 * Valores por defecto para la configuración completa de efectos
 */
export const DEFAULT_EFFECTS_CONFIG: EffectsConfig = {
	visual: DEFAULT_VISUAL_EFFECTS,
	advanced: DEFAULT_ADVANCED_EFFECTS,
};
