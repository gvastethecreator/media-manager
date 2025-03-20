import { DEFAULT_EFFECTS_CONFIG } from './types';
import type { EffectsConfig, DistortionOptions, FilterOptions, ShadowOptions } from './types';
import type { CardOptions } from '../../types/unified-card-types';

/**
 * Adapta las opciones de tarjeta a configuración de efectos
 * @param cardOptions Opciones de tarjeta
 * @returns Configuración de efectos parcial
 */
export function adaptCardOptionsToEffectsConfig(cardOptions?: Partial<CardOptions>): EffectsConfig {
  if (!cardOptions) {
    return DEFAULT_EFFECTS_CONFIG;
  }

  const {
    holographicOptions,
    scanlinesOptions,
    glowOptions,
    grainOptions,
    borderOptions,
    distortionOptions,
    filterOptions,
    shadowOptions
  } = cardOptions;

  const visual = {
    holographic: holographicOptions ?? DEFAULT_EFFECTS_CONFIG.visual.holographic,
    scanlines: scanlinesOptions ?? DEFAULT_EFFECTS_CONFIG.visual.scanlines,
    glow: glowOptions ?? DEFAULT_EFFECTS_CONFIG.visual.glow,
    grain: grainOptions ?? DEFAULT_EFFECTS_CONFIG.visual.grain,
    border: borderOptions ?? DEFAULT_EFFECTS_CONFIG.visual.border
  };

  const advanced = {
    distortion: distortionOptions as DistortionOptions ?? DEFAULT_EFFECTS_CONFIG.advanced.distortion,
    filter: filterOptions as FilterOptions ?? DEFAULT_EFFECTS_CONFIG.advanced.filter,
    shadow: shadowOptions as ShadowOptions ?? DEFAULT_EFFECTS_CONFIG.advanced.shadow
  };

  return {
    visual,
    advanced
  };
}

/**
 * Adapta la configuración de efectos a opciones de tarjeta
 * @param config Configuración de efectos
 * @returns Opciones de tarjeta parciales
 */
export function adaptEffectsConfigToCardOptions(config?: Partial<EffectsConfig>): Partial<CardOptions> {
  if (!config) return {};

  const result: Partial<CardOptions> = {};

  // Extraer valores de visual si existe
  if (config.visual) {
    if (config.visual.holographic) result.holographicOptions = config.visual.holographic;
    if (config.visual.scanlines) result.scanlinesOptions = config.visual.scanlines;
    if (config.visual.glow) result.glowOptions = config.visual.glow;
    if (config.visual.grain) result.grainOptions = config.visual.grain;
    if (config.visual.border) result.borderOptions = config.visual.border;
  }

  // Extraer valores de advanced si existe
  if (config.advanced) {
    if (config.advanced.distortion) result.distortionOptions = config.advanced.distortion;
    if (config.advanced.filter) result.filterOptions = config.advanced.filter;
    if (config.advanced.shadow) result.shadowOptions = config.advanced.shadow;
  }

  return result;
}
