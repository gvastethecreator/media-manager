import type { BaseEffectOptions, ColorEffectOptions, DimensionalEffectOptions } from '../shared';

/**
 * 🔍 Opciones para efectos de escaneo
 */
export interface ScanEffectOptions extends BaseEffectOptions {
  density: number;
  opacity: number;
}

/**
 * 🎨 Opciones para efectos de textura
 */
export interface TextureEffectOptions extends BaseEffectOptions {
  density: number;
  opacity: number;
  noiseEnabled: boolean;
  noiseDensity: number;
  noiseOpacity: number;
}

/**
 * ✨ Opciones para efectos de borde
 */
export interface BorderEffectOptions extends ColorEffectOptions, DimensionalEffectOptions {
  glowEnabled: boolean;
  glowSpread: number;
}

/**
 * 🌈 Opciones para efectos holográficos
 */
export interface HolographicEffectOptions extends ColorEffectOptions {
  rainbowMode: boolean;
}

/**
 * 🎭 Opciones para efectos de distorsión
 */
export interface DistortionEffectOptions extends BaseEffectOptions {
  chromaticAberration: {
    enabled: boolean;
    offset: number;
    intensity: number;
  };
  glitch: {
    enabled: boolean;
    intensity: number;
    frequency: number;
  };
  pixelate: {
    enabled: boolean;
    size: number;
  };
}

/**
 * 🎨 Configuración completa de efectos avanzados
 */
export interface AdvancedEffectsConfig {
  scan: ScanEffectOptions;
  texture: TextureEffectOptions;
  border: BorderEffectOptions;
  holographic: HolographicEffectOptions;
  distortion: DistortionEffectOptions;
}

/**
 * 🎛️ Props para secciones de efectos
 */
export interface EffectSectionProps<T extends BaseEffectOptions> {
  effect: T;
  onChange: (effect: Partial<T>) => void;
  disabled?: boolean;
}

/**
 * 🔧 Valores por defecto
 */
export const DEFAULT_ADVANCED_EFFECTS: AdvancedEffectsConfig = {
  scan: {
    enabled: false,
    density: 2,
    opacity: 0.3
  },
  texture: {
    enabled: false,
    density: 2,
    opacity: 0.3,
    noiseEnabled: false,
    noiseDensity: 2,
    noiseOpacity: 0.3
  },
  border: {
    enabled: false,
    color: '#ffffff',
    width: 2,
    spread: 0,
    intensity: 50,
    glowEnabled: false,
    glowSpread: 0
  },
  holographic: {
    enabled: false,
    color: '#00ff00',
    intensity: 50,
    rainbowMode: false
  },
  distortion: {
    enabled: false,
    intensity: 50,
    chromaticAberration: {
      enabled: false,
      offset: 2,
      intensity: 50
    },
    glitch: {
      enabled: false,
      intensity: 50,
      frequency: 1
    },
    pixelate: {
      enabled: false,
      size: 8
    }
  }
};

/**
 * Props para el componente de efectos avanzados
 */
export interface AdvancedEffectsProps {
  initialOptions?: Partial<AdvancedEffectsConfig>;
  onChange?: (options: AdvancedEffectsConfig) => void;
  disabled?: boolean;
  className?: string;
}
