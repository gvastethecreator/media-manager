'use client';

import { useLayerPlugin } from './layer-plugin-system';
import type { LayerImplementation } from './types';

// Importar solo las implementaciones que están funcionando correctamente
import { borderLayerImplementation } from './border/border-layer-implementation';
import { chromaticAberrationLayerImplementation } from './chromatic-aberration';
import { filterLayerImplementation } from './filters';
import { glowLayerImplementation } from './glow/glow-layer-implementation';
import { holographicLayerImplementation } from './holographic/holographic-layer-implementation';
import { scanlinesLayerImplementation } from './scanlines';
import { textureLayerImplementation } from './textures';

// Mapa con todas las capas disponibles
// Solo incluir capas que estén correctamente implementadas y probadas
const VERIFIED_LAYERS: Record<string, LayerImplementation> = {
	// Capas básicas
	border: borderLayerImplementation,

	// Capas de efectos visuales
	glow: glowLayerImplementation,
	scanlines: scanlinesLayerImplementation,
	texture: textureLayerImplementation,

	// Capas de efectos especiales
	'chromatic-aberration': chromaticAberrationLayerImplementation,
	'holographic': holographicLayerImplementation,

	// Otras capas
	'filter': filterLayerImplementation
};

/**
 * 🔌 Registro de capas del sistema
 * @module RegisterLayers
 */

import * as React from 'react';

// Importar capas
import { FilterLayer, FilterSettings, defaultFilterConfig } from './filters/filter-layer-implementation';
import { GlowLayer, GlowSettings, defaultGlowConfig } from './glow/glow-layer-implementation';
import { NoiseLayer, NoiseSettings, defaultNoiseConfig } from './noise/noise-layer-implementation';
import { PatternLayer, PatternSettings, defaultPatternConfig } from './patterns/pattern-layer-implementation';

/**
 * 🎨 Componente para registrar todas las capas disponibles
 */
export function RegisterLayers(): null {
	const { registerLayer } = useLayerPlugin();

	React.useEffect(() => {
		// Registrar capa de filtros
		registerLayer({
			type: 'filter',
			name: 'Filtros',
			description: 'Aplica efectos de filtro a la tarjeta',
			component: FilterLayer,
			settings: FilterSettings,
			defaultConfig: defaultFilterConfig,
			icon: '🎨',
		});

		// Registrar capa de brillo
		registerLayer({
			type: 'glow',
			name: 'Brillo',
			description: 'Añade un efecto de brillo interactivo',
			component: GlowLayer,
			settings: GlowSettings,
			defaultConfig: defaultGlowConfig,
			icon: '✨',
		});

		// Registrar capa de ruido
		registerLayer({
			type: 'noise',
			name: 'Ruido',
			description: 'Agrega textura de ruido visual',
			component: NoiseLayer,
			settings: NoiseSettings,
			defaultConfig: defaultNoiseConfig,
			icon: '🌫️',
		});

		// Registrar capa de patrones
		registerLayer({
			type: 'pattern',
			name: 'Patrones',
			description: 'Aplica patrones decorativos',
			component: PatternLayer,
			settings: PatternSettings,
			defaultConfig: defaultPatternConfig,
			icon: '🔲',
		});
	}, [registerLayer]);

	return null;
}
