import type * as React from 'react';
import type { BaseLayerConfig } from '../layers/layer-plugin-system';

// Configuración predeterminada para el sistema de capas
export const DEFAULT_LAYER_SYSTEM: LayerSystemConfig = {
	order: [
		'background',
		'texture',
		'content',
		'pattern',
		'filter',
		'glitch',
		'chromaticAberration',
		'grain',
		'pixelate',
		'scanlines',
		'holographic',
		'shader',
		'glow',
		'border',
		'animatedBorder',
	],
	layerBlending: 'screen',
	layerSpacing: 2,
	explodeView: false,
	explodeDistance: 10,
};

// Interfaz para la configuración del sistema de capas en CardOptions
export interface LayerSystemConfig {
	order?: string[];
	layerBlending?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
	layerSpacing?: number;
	explodeView?: boolean;
	explodeDistance?: number;
}

// Función para obtener todas las configuraciones de capa conocidas
export function getDefaultLayerConfigs(): Record<string, BaseLayerConfig> {
	return {
		// Se poblarán automáticamente desde los componentes de capa registrados
	};
}

// Función para obtener la configuración combinada
export function getLayerSystemWithDefaults(config?: Partial<LayerSystemConfig>): LayerSystemConfig {
	return {
		...DEFAULT_LAYER_SYSTEM,
		...config,
	};
}

// Función para generar el CSS de BlendMode para la configuración de capas
export function getLayerBlendModeCss(blendMode?: string): React.CSSProperties['mixBlendMode'] {
	const validBlendModes = [
		'normal',
		'multiply',
		'screen',
		'overlay',
		'darken',
		'lighten',
		'color-dodge',
		'color-burn',
		'hard-light',
		'soft-light',
		'difference',
		'exclusion',
		'hue',
		'saturation',
		'color',
		'luminosity',
	];

	if (!blendMode || !validBlendModes.includes(blendMode)) {
		return 'normal';
	}

	return blendMode as React.CSSProperties['mixBlendMode'];
}
