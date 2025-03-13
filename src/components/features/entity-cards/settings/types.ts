import type { KeyboardEvent } from 'react';
import type { AnimationPresets, DesignSystem, VisualSystem } from '../base-card';

/**
 * Opciones de efectos visuales para las tarjetas
 */
export interface VisualEffectsOptions {
	blur?: number;
	brightness?: number;
	contrast?: number;
	grayscale?: number;
	hueRotate?: number;
	invert?: number;
	opacity?: number;
	saturate?: number;
	sepia?: number;
	dropShadow?: boolean;
	backdropBlur?: number;
	backdropBrightness?: number;
	backdropContrast?: number;
	backdropGrayscale?: number;
	backdropHueRotate?: number;
	backdropInvert?: number;
	backdropOpacity?: number;
	backdropSaturate?: number;
	backdropSepia?: number;
}

/**
 * Opciones de efectos avanzados para las tarjetas
 */
export interface AdvancedEffectsOptions {
	scanlines?: boolean;
	scanlinesDensity?: number;
	scanlinesOpacity?: number;
	grain?: boolean;
	grainOpacity?: number;
	grainDensity?: number;
	borderGlow?: boolean;
	borderGlowColor?: string;
	borderGlowWidth?: number;
	borderGlowSpread?: number;
	borderGlowIntensity?: number;
	glitchEffect?: boolean;
	glitchEffectIntensity?: number;
	glitchEffectFrequency?: number;
	holographicEffect?: boolean;
	holographicEffectIntensity?: number;
	holographicEffectColor?: string;
	holographicRainbowMode?: boolean;
	noiseTexture?: boolean;
	noiseTextureOpacity?: number;
	noiseTextureDensity?: number;
	chromaticAberration?: boolean;
	chromaticAberrationOffset?: number;
	chromaticAberrationIntensity?: number;
	pixelate?: boolean;
	pixelateSize?: number;
}

/**
 * Opciones de rendimiento para las tarjetas
 */
export interface PerformanceOptions {
	lazyLoad?: boolean;
	imageOptimization?: boolean;
	prefetchOnHover?: boolean;
	placeholderImage?: boolean;
	virtualizeList?: boolean;
	cacheStrategy?: 'none' | 'memory' | 'persistent';
	debounceTime?: number;
	transitionDelay?: number;
	reducedMotion?: boolean;
	animationMaxFPS?: number;
	animationDuration?: number;
	animationTimingFunction?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
	enableHardwareAcceleration?: boolean;
	useSkeletonLoading?: boolean;
}

/**
 * Estados interactivos de las tarjetas
 */
export interface StateOptions {
	hover?: boolean;
	hoverScale?: number;
	hoverRotate?: number;
	hoverTranslateY?: number;
	hoverEffects?: VisualEffectsOptions;

	focus?: boolean;
	focusScale?: number;
	focusRotate?: number;
	focusTranslateY?: number;
	focusEffects?: VisualEffectsOptions;

	active?: boolean;
	activeScale?: number;
	activeRotate?: number;
	activeTranslateY?: number;
	activeEffects?: VisualEffectsOptions;

	selected?: boolean;
	selectedScale?: number;
	selectedRotate?: number;
	selectedTranslateY?: number;
	selectedEffects?: VisualEffectsOptions;
}

/**
 * Opciones del sistema para las tarjetas
 */
export interface SystemOptions {
	designSystem?: DesignSystem;
	visualSystem?: VisualSystem;
	animationPreset?: keyof typeof AnimationPresets;
	enableKeyboardNavigation?: boolean;
	keyboardShortcuts?: Record<string, (e: KeyboardEvent) => void>;
	enableScreenReader?: boolean;
	enableHighContrastMode?: boolean;
	colorBlindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
	enableDarkMode?: boolean;
	rtl?: boolean;
}

/**
 * Configuración completa de las tarjetas
 */
export interface CardOptions {
	id?: string;
	visualEffects?: VisualEffectsOptions;
	advancedEffects?: AdvancedEffectsOptions;
	performance?: PerformanceOptions;
	states?: StateOptions;
	system?: SystemOptions;
	design?: {
		variant?: string;
		preset?: string;
		customProperties?: Record<string, unknown>;
	};
}

/**
 * Interface para los componentes de panel de configuración
 */
export interface SettingsPanelProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}
