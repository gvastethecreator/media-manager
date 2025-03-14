/**
 * 🎨 Tipos para el módulo de efectos avanzados
 * @typedef {Object} AdvancedEffectsOptions
 */
export interface AdvancedEffectsOptions {
	// Efectos de Escaneo
	scanlines?: boolean;
	scanlinesDensity?: number;
	scanlinesOpacity?: number;

	// Efectos de Textura
	grain?: boolean;
	grainDensity?: number;
	grainOpacity?: number;
	noiseTexture?: boolean;
	noiseTextureDensity?: number;
	noiseTextureOpacity?: number;

	// Efectos de Borde
	borderGlow?: boolean;
	borderGlowColor?: string;
	borderGlowWidth?: number;
	borderGlowSpread?: number;
	borderGlowIntensity?: number;

	// Efectos Holográficos
	holographicEffect?: boolean;
	holographicRainbowMode?: boolean;
	holographicEffectColor?: string;
	holographicEffectIntensity?: number;

	// Efectos de Distorsión
	chromaticAberration?: boolean;
	chromaticAberrationOffset?: number;
	chromaticAberrationIntensity?: number;
	glitchEffect?: boolean;
	glitchEffectIntensity?: number;
	glitchEffectFrequency?: number;
	pixelate?: boolean;
	pixelateSize?: number;
}

/**
 * Valores predeterminados para efectos avanzados
 */
export const DEFAULT_ADVANCED_EFFECTS: AdvancedEffectsOptions = {
	// Efectos de Escaneo
	scanlines: false,
	scanlinesDensity: 2,
	scanlinesOpacity: 0.3,

	// Efectos de Textura
	grain: false,
	grainDensity: 30,
	grainOpacity: 0.2,
	noiseTexture: false,
	noiseTextureDensity: 40,
	noiseTextureOpacity: 0.15,

	// Efectos de Borde
	borderGlow: false,
	borderGlowColor: '#00ffff',
	borderGlowWidth: 3,
	borderGlowSpread: 10,
	borderGlowIntensity: 0.7,

	// Efectos Holográficos
	holographicEffect: false,
	holographicRainbowMode: false,
	holographicEffectColor: '#ff00ff',
	holographicEffectIntensity: 0.5,

	// Efectos de Distorsión
	chromaticAberration: false,
	chromaticAberrationOffset: 2,
	chromaticAberrationIntensity: 0.5,
	glitchEffect: false,
	glitchEffectIntensity: 0.3,
	glitchEffectFrequency: 0.5,
	pixelate: false,
	pixelateSize: 5
};

/**
 * Props para el componente de efectos avanzados
 */
export interface AdvancedEffectsProps {
	initialOptions?: Partial<AdvancedEffectsOptions>;
	onChange?: (options: AdvancedEffectsOptions) => void;
	disabled?: boolean;
	className?: string;
}