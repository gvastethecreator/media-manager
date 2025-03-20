'use client';

import type { LayerImplementation } from '../types';
import type { PatternConfig } from './actions/pattern-config.action';
import { PatternLayer } from './components/pattern-layer';
import { PatternSettings } from './components/pattern-settings';

/**
 * 🔲 Implementación de la capa de patrones geométricos
 * Esta capa permite añadir patrones visuales a las tarjetas
 */
export const patternImplementation: LayerImplementation<PatternConfig> = {
	type: 'pattern',
	name: 'Pattern',
	description: 'Añade patrones geométricos a las tarjetas',
	icon: '🔲',
	defaultConfig: {
		enabled: true,
		visibleOnHover: false,
		layerIndex: 2,
		opacity: 0.15,
		scale: 1,
		color: '#ffffff',
		patternType: 'grid',
		spacing: 20,
		lineWidth: 1,
		rotation: 0,
		blendMode: 'overlay',
	},
	component: PatternLayer,
	settings: PatternSettings,
	presets: [
		{
			name: 'Grid Clásico',
			description: 'Patrón de cuadrícula simple y elegante',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 2,
				opacity: 0.15,
				scale: 1,
				color: '#ffffff',
				patternType: 'grid',
				spacing: 20,
				lineWidth: 1,
				rotation: 0,
				blendMode: 'overlay',
			},
		},
		{
			name: 'Dots Minimalista',
			description: 'Patrón de puntos sutil y moderno',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 2,
				opacity: 0.2,
				scale: 1.2,
				color: '#ffffff',
				patternType: 'dots',
				spacing: 25,
				lineWidth: 2,
				rotation: 45,
				blendMode: 'overlay',
			},
		},
		{
			name: 'Hexágonos Futuristas',
			description: 'Patrón de hexágonos con estilo tecnológico',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 2,
				opacity: 0.25,
				scale: 0.8,
				color: '#ffffff',
				patternType: 'hexagon',
				spacing: 30,
				lineWidth: 1.5,
				rotation: 0,
				blendMode: 'overlay',
			},
		},
		{
			name: 'Líneas Diagonales',
			description: 'Patrón de líneas dinámico y energético',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 2,
				opacity: 0.2,
				scale: 1,
				color: '#ffffff',
				patternType: 'lines',
				spacing: 15,
				lineWidth: 1,
				rotation: -45,
				blendMode: 'overlay',
			},
		},
	],
};