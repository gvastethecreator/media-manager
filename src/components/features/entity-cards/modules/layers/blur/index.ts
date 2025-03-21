'use client';

/**
 * 🌫️ Módulo de capa de desenfoque para tarjetas de entidades
 *
 * Este módulo proporciona efectos de desenfoque para las tarjetas.
 */

import { type BlurConfig, blurLayerImplementation, defaultBlurConfig } from './blur-implementation';
import { BlurEffectLayer } from './blur-layer';

export { BlurEffectLayer, blurLayerImplementation, defaultBlurConfig };
export type { BlurConfig };

export default blurLayerImplementation;