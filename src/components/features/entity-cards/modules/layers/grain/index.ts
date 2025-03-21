'use client';

/**
 * 🌾 Módulo de capa de grano para tarjetas de entidades
 *
 * Este módulo proporciona efectos de grano y textura para las tarjetas.
 */

import type { GrainConfig } from './actions/grain-config.action';
import { GrainLayer } from './components/grain-layer';
import { grainImplementation } from './grain-implementation';

export { grainImplementation, GrainLayer };
export type { GrainConfig };

export default grainImplementation;

