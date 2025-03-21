'use client';

/**
 * 🔧 Módulo de capa de glitch para tarjetas de entidades
 *
 * Este módulo proporciona efectos de glitch y distorsión para las tarjetas.
 */

import { GlitchLayer } from './components/glitch-layer';
import { glitchImplementation } from './glitch-implementation';
import { type GlitchConfig, createDefaultGlitchConfig } from './glitch-schema';

export { GlitchLayer, createDefaultGlitchConfig as defaultGlitchConfig, glitchImplementation };
export type { GlitchConfig };

export default glitchImplementation;
