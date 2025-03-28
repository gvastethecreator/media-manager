'use client';

import { blurImplementation as blurLayerImplementation } from './blur-implementation';
import { type BlurConfig, defaultBlurConfig } from './blur-schema';
import { BlurLayer as BlurEffectLayer } from './components/blur-layer';

/**
 * 🌫️ Módulo de capa de desenfoque para tarjetas de entidades
 *
 * Este módulo proporciona efectos de desenfoque para las tarjetas.
 */

export { BlurEffectLayer, blurLayerImplementation, defaultBlurConfig };
export type { BlurConfig };

export default blurLayerImplementation;
