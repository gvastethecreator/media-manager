'use client';

/**
 * ✨ Módulo de capa de brillo para tarjetas de entidades
 *
 * Este módulo proporciona efectos de brillo y resplandor para las tarjetas.
 */

import { GlowEffectLayer } from './glow-effect-layer';
import { type GlowConfig, defaultGlowConfig, glowLayerImplementation } from './glow-layer-implementation';
import type { LayerImplementation } from '../types';

export { GlowEffectLayer, defaultGlowConfig, glowLayerImplementation };
export type { GlowConfig };

/**
 * 🌟 Implementación de la capa de resplandor
 */
const glowLayer: LayerImplementation = {
	type: 'glow',
	name: 'Resplandor',
	description: 'Añade un efecto de resplandor alrededor de la tarjeta',
	defaultConfig: {
		enabled: true,
		layerIndex: 4,
		color: '#00aaff',
		size: 10,
		intensity: 0.5,
		blendMode: 'screen',
	},
	render: () => null, // Stub implementation
	settings: () => null, // Stub implementation
	icon: 'sun',
};

export default glowLayer;
