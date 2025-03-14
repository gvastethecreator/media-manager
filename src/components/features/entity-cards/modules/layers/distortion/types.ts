/**
 * @file Tipos para el módulo de efectos de distorsión
 * @description Define las interfaces y tipos para la gestión de efectos de distorsión
 */

/**
 * Opciones para el efecto glitch
 */
export interface GlitchEffectOptions {
  /** Si el efecto está habilitado */
  enabled: boolean;

  /** Si el efecto solo es visible al pasar el cursor */
  visibleOnHover: boolean;

  /** Intensidad del efecto (0-1) */
  intensity: number;

  /** Frecuencia del efecto (0-1) */
  frequency: number;

  /** Duración del efecto en segundos */
  duration: number;
}

/**
 * Opciones para el efecto de aberración cromática
 */
export interface ChromaticAberrationOptions {
  /** Si el efecto está habilitado */
  enabled: boolean;

  /** Si el efecto solo es visible al pasar el cursor */
  visibleOnHover: boolean;

  /** Intensidad del efecto (0-1) */
  intensity: number;

  /** Desplazamiento en píxeles */
  offset: number;
}

/**
 * Opciones para el efecto de pixelado
 */
export interface PixelateOptions {
  /** Si el efecto está habilitado */
  enabled: boolean;

  /** Si el efecto solo es visible al pasar el cursor */
  visibleOnHover: boolean;

  /** Intensidad del efecto (0-1) */
  intensity: number;

  /** Tamaño de los bloques en píxeles */
  blockSize: number;
}

/**
 * Sistema completo de efectos de distorsión
 */
export interface DistortionEffectsSystem {
  /** Si los efectos de distorsión están habilitados globalmente */
  enabled: boolean;

  /** Si los efectos solo son visibles al pasar el cursor */
  visibleOnHover: boolean;

  /** Intensidad global de los efectos (0-1) */
  intensity: number;

  /** Configuración del efecto glitch */
  glitchEffect: GlitchEffectOptions;

  /** Configuración del efecto de aberración cromática */
  chromaticAberration: ChromaticAberrationOptions;

  /** Configuración del efecto de pixelado */
  pixelate: PixelateOptions;
}

/**
 * Props para el componente DistortionEffectsModule
 */
export interface DistortionEffectsModuleProps {
  /** Sistema de efectos inicial */
  initialEffectsSystem?: Partial<DistortionEffectsSystem>;

  /** Callback invocado cuando cambia el sistema de efectos */
  onChange?: (effectsSystem: DistortionEffectsSystem) => void;

  /** Si el módulo está deshabilitado */
  disabled?: boolean;

  /** Clases CSS adicionales */
  className?: string;
}